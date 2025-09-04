import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config";
import { useStudent } from "../context/StudentProvider";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const StudentLoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setStudent } = useStudent();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/student/login/`, {
        username: username.trim(),
        password: password.trim(),
      });

      const studentData = response.data;

      await AsyncStorage.setItem("student", JSON.stringify(studentData));
      setStudent(studentData);

      navigation.replace("StudentDashboard");
    } catch (error: any) {
      console.error("Login Error:", error?.response || error.message);
      Alert.alert(
        "Login Failed",
        error?.response?.data?.detail || "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const onBackPress = () => {
    Alert.alert("Exit App", "Do you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() },
    ]);
    return true; // prevent default behavior (going back)
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove(); // clean up
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../assets/login.jpg")}
          style={styles.illustration}
          resizeMode="contain"
        />

        <View style={styles.loginBox}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            selectionColor="#4B4DFF"
          />

          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              selectionColor="#4B4DFF"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                size={20}
                color="#4B4DFF"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default StudentLoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#B2B6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  illustration: {
    width: 250,
    height: 180,
    marginBottom: 10,
  },
  loginBox: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#4B4DFF",
    marginBottom: 20,
  },
  input: {
    height: 48,
    backgroundColor: "#fff",
    borderColor: "#4B4DFF",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    width: "100%",
    color: "#000",
  },
  passwordInput: {
    height: 48,
    backgroundColor: "#fff",
    borderColor: "#4B4DFF",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingRight: 40,
    fontSize: 16,
    width: "100%",
    color: "#000",
  },
  inputWithIcon: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
    marginBottom: 15,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 12,
    zIndex: 1,
  },
  button: {
    backgroundColor: "#4B4DFF",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
