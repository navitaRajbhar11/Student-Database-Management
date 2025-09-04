import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import axios from "axios";
import { useStudent } from "../context/StudentProvider";
import API_BASE_URL from "../config";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const StudentQueryScreen: React.FC = () => {
  const { student } = useStudent();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = useCallback(async () => {
    if (!query.trim()) {
      Alert.alert("Validation Error", "Please enter your query.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/student/upload-query/`, {
        studentName: student?.name,
        class_grade: student?.class_grade,
        query,
      });

      Alert.alert("Success", "Query sent successfully!");
      setQuery("");
    } catch (error) {
      Alert.alert("Error", "Failed to send query.");
      console.error("Upload query error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, student]);

  // 🔙 Back handler to prevent accidental exits
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (query.trim()) {
          Alert.alert("Unsaved Query", "You have unsent changes. Go back anyway?", [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Yes",
              onPress: () => navigation.goBack(),
            },
          ]);
          return true;
        }
  
        Alert.alert("Exit", "Do you want to go back?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => navigation.goBack(),
          },
        ]);
        return true;
      };
  
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
  
      return () => subscription.remove(); // ✅ updated from removeEventListener
    }, [navigation, query])
  );
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗣️ Ask a Query</Text>

        <Text style={styles.greeting}>
          Hello, {student?.name || "Student"}! Got a question?
        </Text>

        <Text style={styles.label}>What would you like to ask?</Text>

        <TextInput
          placeholder="Write your query here..."
          value={query}
          onChangeText={(text) => {
            if (text.length <= 300) setQuery(text);
          }}
          style={styles.input}
          multiline
          numberOfLines={5}
          editable={!loading}
        />

        <Text style={styles.charCount}>{query.length}/300</Text>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Query</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default StudentQueryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF1FF",
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#1F2937",
  },
  greeting: {
    fontSize: 16,
    marginBottom: 16,
    color: "#4B5563",
    fontStyle: "italic",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 8,
    minHeight: 120,
  },
  charCount: {
    textAlign: "right",
    marginBottom: 20,
    color: "#6B7280",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
