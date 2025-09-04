import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useStudent } from "../context/StudentProvider";
import { StackParamList } from "../App";
import API_BASE_URL from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
type VideoLecturesScreenNavigationProp = StackNavigationProp<
  StackParamList,
  "VideoLecturesScreen"
>;

type ChapterContent = {
  videos: { title: string; video_url: string }[];
  pdfs: { title: string; pdf_url: string }[];
};

type SubjectData = {
  [subject: string]: {
    [chapter: string]: ChapterContent;
  };
};

// Axios instance outside the component to avoid re-creating it
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Attach interceptors only once
axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem("access_token");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      try {
        const res = await axios.post(`${API_BASE_URL}/refresh-token/`, {
          refresh_token: refreshToken,
        });
        const newAccessToken = res.data.access_token;
        await AsyncStorage.setItem("access_token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

const VideoLecturesScreen = () => {
  const { student } = useStudent();
  const navigation = useNavigation<VideoLecturesScreenNavigationProp>();
  const [lectures, setLectures] = useState<SubjectData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLectures = useCallback(async () => {
    if (!student?.class_grade) {
      setError("Class grade not available.");
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.get(
        `/student/list-videos-lectures/?class_grade=${student.class_grade}`
      );
      if (res.data.data) {
        setLectures(res.data.data);
        setError(null);
      } else {
        setError("No lectures found.");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching lectures.");
    } finally {
      setLoading(false);
    }
  }, [student?.class_grade]);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLectures().finally(() => setRefreshing(false));
  }, [fetchLectures]);

  const renderSubject = ({ item }: { item: string }) => (
    <Pressable
      style={styles.subjectButton}
      onPress={() =>
        navigation.navigate("SubjectChaptersScreen", {
          subject: item,
          chapters: lectures[item],
        })
      }
    >
      <FontAwesomeIcon icon={faFolder} size={22} color="#fff" style={{ marginRight: 15 }} />
      <Text style={styles.subjectText}>{item}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📖 Select Subject</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 30 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={Object.keys(lectures)}
          renderItem={renderSubject}
          keyExtractor={(item) => item}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    padding: 16,
  },
  header: {
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E293B",
  },
  subjectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 18,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  subjectText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    flex: 1,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});

export default VideoLecturesScreen;
