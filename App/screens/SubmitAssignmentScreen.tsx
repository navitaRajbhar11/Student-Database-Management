import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  RefreshControl,
} from "react-native";
import { pick, types } from "@react-native-documents/picker";
import axios from "axios";
import { useStudent } from "../context/StudentProvider";
import API_BASE_URL from "../config";

const SubmitAssignmentScreen: React.FC = () => {
  const { student } = useStudent();
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (assignmentTitle || file) {
        Alert.alert(
          "Unsaved Changes",
          "You have unsaved changes. Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Yes, Exit",
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, [assignmentTitle, file]);

  const handleFilePick = useCallback(async () => {
    try {
      const result = await pick({
        type: [types.pdf, types.docx],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const pickedFile = result[0];
        const fileSizeKB = Number(pickedFile.size) / 1024;

        if (fileSizeKB > 1024) {
          Alert.alert("File Too Large", "Please upload a file smaller than 1MB.");
          return;
        }

        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!pickedFile.type || !allowedTypes.includes(pickedFile.type)) {
          Alert.alert("Invalid File Type", "Please upload a PDF or DOCX file.");
          return;
        }

        setFile({
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.type || "application/octet-stream",
          size: pickedFile.size,
        });
      }
    } catch (err: any) {
      if (err?.code !== "DOCUMENT_PICKER_CANCEL") {
        console.error("File Picker Error:", err);
        Alert.alert("Error", "File selection failed.");
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!assignmentTitle.trim() || !file) {
      Alert.alert("All Fields Required", "All fields are required. Please fill them in.");
      return;
    }

    const formData = new FormData();
    formData.append("student_name", student?.name || "");
    formData.append("class_grade", String(student?.class_grade || ""));
    formData.append("assignment_title", assignmentTitle.trim());
    formData.append("due_date", new Date().toISOString().split("T")[0]);
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/student/submit-assignment/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.status === 201) {
        Alert.alert("Success", "Assignment submitted successfully!");
        setAssignmentTitle("");
        setFile(null);
      } else {
        Alert.alert("Failed", res?.data?.error || "Submission failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Submission error:", error?.response || error);
      if (error?.response) {
        console.error("Response body:", error.response.data);
      }
      const message = error?.response?.data?.error || "An unexpected error occurred.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [assignmentTitle, file, student]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    // Clear the form fields
    setAssignmentTitle("");
    setFile(null);

    // Simulate a network request delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>📤 Submit Assignment</Text>

      <Text style={styles.greeting}>
        Hello, {student?.name || "Student"}! Submit your work here.
      </Text>

      <TextInput
        placeholder="Enter assignment title"
        style={styles.input}
        value={assignmentTitle}
        onChangeText={(text) => {
          if (text.length <= 100) setAssignmentTitle(text);
        }}
        placeholderTextColor="#999"
        editable={!loading}
      />

      <Text style={styles.charCount}>{assignmentTitle.length}/100</Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={handleFilePick}
        disabled={loading}
      >
        <Text style={styles.uploadText}>
          {file ? "📄 Change File" : "📂 Browse PDF / DOCX"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.fileHint}>
        Max file size: 1MB (.pdf, .docx only)
      </Text>

      {file && (
        <Text style={styles.fileText}>
          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !assignmentTitle.trim() || !file}
        style={[
          styles.submitButton,
          (loading || !assignmentTitle.trim() || !file) && {
            backgroundColor: "#A5B4FC",
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#EEF2FF",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  greeting: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 12,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 6,
  },
  charCount: {
    textAlign: "right",
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 14,
  },
  uploadBox: {
    backgroundColor: "#E0E7FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#A5B4FC",
  },
  uploadText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  fileHint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 10,
    textAlign: "center",
  },
  fileText: {
    marginTop: 8,
    color: "#374151",
    fontSize: 14,
    fontStyle: "italic",
  },
  submitButton: {
    marginTop: 30,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default SubmitAssignmentScreen;
