import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  Image,
  BackHandler,
} from "react-native";
import { useStudent } from "../context/StudentProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../config";

// ✅ Class Grade Mapping
const classGradeMap: Record<string, string> = {
  "11th": "11th",
  "12th": "12th",
  "FY BCom": "FY BCom",
  "SY BCom": "SY BCom",
  "TY BCom": "TY BCom",
  "CA Foundation": "CA Foundation",
  "CA Intermediate": "CA Intermediate",
  "CA Final": "CA Final",
};

const formatClassGrade = (grade: string): string => {
  return classGradeMap[grade] || grade;
};

// ✅ Avatar Component
const Avatar = React.memo(({ name }: { name: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
  </View>
));

// ✅ Profile Card Component
const ProfileCard = React.memo(({ student }: { student: any }) => (
  <View style={styles.card}>
    <Text style={styles.title}>My Profile</Text>

    <Text style={styles.label}>Name</Text>
    <Text style={styles.value}>{student.name}</Text>

    <Text style={styles.label}>Username</Text>
    <Text style={styles.value}>{student.username}</Text>

    <Text style={styles.label}>Class</Text>
    <Text style={styles.value}>{formatClassGrade(student.class_grade)}</Text>
  </View>
));

// ✅ Logout Button Component
const LogoutButton = React.memo(({ onLogout }: { onLogout: () => void }) => (
  <Pressable onPress={onLogout} style={styles.logoutButton}>
    <Text style={styles.logoutText}>Logout</Text>
  </Pressable>
));

const ProfileScreen: React.FC = () => {
  const { student, setStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    if (!student?.id) return;

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/student/profile/?student_id=${student.id}`
        );
        const data = await res.json();
        if (data?.name && isMounted) {
          setStudent(data);
        }
      } catch (error) {
        console.log("❌ Error fetching student:", error);
      } finally {
        isMounted && setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [student?.id]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("student");
            setStudent(null);
            navigation.reset({
              index: 0,
              routes: [{ name: "StudentLogin" as never }],
            });
          } catch (error) {
            console.error("Failed to logout:", error);
          }
        },
      },
    ]);
  }, [navigation, setStudent]);

  const onBackPress = () => {
    Alert.alert("Exit App", "Do you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, []);

  if (loading || !student?.name) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require("../assets/profile.png")}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Avatar name={student.name} />
          <ProfileCard student={student} />
          <LogoutButton onLogout={handleLogout} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    width: "100%",
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  container: {
    flex: 1,
    paddingTop: 30,
    marginTop: -30,
    backgroundColor: "#fff",
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECEBFF",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontStyle: "italic",
  },
  avatar: {
    backgroundColor: "#6D28D9",
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 12,
    fontSize: 15,
  },
  value: {
    fontSize: 17,
    color: "#111827",
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ProfileScreen;
