import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Alert,
} from "react-native";
import axios from "axios";
import moment from "moment";
import { useIsFocused } from "@react-navigation/native";
import { useStudent } from "../context/StudentProvider";
import API_BASE_URL from "../config";

interface Assignment {
  _id: string;
  title?: string;
  description?: string;
  due_date?: string;
  class_grade?: number;
  created_at?: string;
}

const AssignmentsListScreen: React.FC = () => {
  const { student } = useStudent();
  const isFocused = useIsFocused();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!student) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/student/list-assignments/`, {
        params: {
          student_id: student.id,
          class_grade: student.class_grade,
        },
      });
      setAssignments(res.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, [student]);

  const loadAssignments = async () => {
    setLoading(true);
    await fetchAssignments();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused && student) {
      loadAssignments();

      const backAction = () => {
        Alert.alert("Hold on!", "Do you want to exit the app?", [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          { text: "YES", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [isFocused, student, fetchAssignments]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Your Assignments</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.assignmentTitle}>{item.title || "Untitled Assignment"}</Text>
              <Text style={styles.assignmentText}>
                📝 {item.description || "No description provided."}
              </Text>
              <Text style={styles.assignmentDue}>
                📅 Due:{" "}
                {item.due_date ? moment(item.due_date).format("MMM D, YYYY") : "Not specified"}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
          }
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>📭 No assignments found.</Text>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          initialNumToRender={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
};

export default AssignmentsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#EEF2FF",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
  },
  assignmentText: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 50,
  },
});
