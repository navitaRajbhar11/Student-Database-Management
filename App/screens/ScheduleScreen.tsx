import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from "react-native";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { useStudent } from "../context/StudentProvider";
import API_BASE_URL from "../config";

type Schedule = {
  _id: string;
  day: string;
  subject: string;
  start_time: string;
  end_time: string;
};

// 🕒 Utility to convert 24-hour time to 12-hour AM/PM
const formatTimeTo12Hour = (time: string): string => {
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

const ScheduleScreen: React.FC = () => {
  const { student } = useStudent();
  const isFocused = useIsFocused();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!student || !student.class_grade) {
      Alert.alert("Error", "Class grade not found.");
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/student/schedule/`, {
        params: { class_grade: student.class_grade },
      });
      setSchedules(res.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      Alert.alert("Error", "Failed to load schedule.");
    }
  }, [student]);

  const loadSchedules = async () => {
    setLoading(true);
    await fetchSchedules();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  const handleBackPress = () => {
    Alert.alert("Hold on!", "Do you want to exit the app?", [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "YES",
        onPress: () => BackHandler.exitApp(),
      },
    ]);
    return true;
  };

  useEffect(() => {
    if (isFocused) {
      loadSchedules();
      const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

      return () => backHandler.remove();
    }
  }, [isFocused, fetchSchedules]);

  const renderScheduleItem = useCallback(
    ({ item }: { item: Schedule }) => (
      <View style={styles.card}>
        <Text style={styles.day}>📅 {item.day}</Text>
        <Text style={styles.subject}>📘 {item.subject}</Text>
        <Text style={styles.time}>
          🕒 {formatTimeTo12Hour(item.start_time)} - {formatTimeTo12Hour(item.end_time)}
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🗓️ Class Schedule</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item._id}
          renderItem={renderScheduleItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No schedule available yet.</Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF1FF",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1F2937",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  day: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  subject: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
  },
  time: {
    fontSize: 15,
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 30,
  },
});
