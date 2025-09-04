// App.tsx
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faBook,
  faCloudUploadAlt,
  faVideo,
  faCalendar,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

import { StudentProvider, useStudent } from "./context/StudentProvider";
import StudentLoginScreen from "./screens/StudentLoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AssignmentsListScreen from "./screens/AssignmentsListScreen";
import SubmitAssignmentScreen from "./screens/SubmitAssignmentScreen";
import VideoLecturesScreen from "./screens/VideoLecturesScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import StudentQueryScreen from "./screens/StudentQueryScreen";
import LectureViewerScreen from "./screens/LectureViewerScreen";
import SubjectChaptersScreen from "./screens/SubjectChaptersScreen ";
import ChapterScreen from "./screens/ChapterScreen ";

// Add FontAwesome icons to library
library.add(faUser, faBook, faCloudUploadAlt, faVideo, faCalendar, faComments);

// Type definitions for tab navigation
export type TabParamList = {
  Profile: undefined;
  Videos: undefined;
  Assignments: undefined;
  Submit: undefined;
  Schedule: undefined;
  Query: undefined;
};

// Type definitions for stack navigation
export type StackParamList = {
  StudentLogin: undefined;
  StudentDashboard: undefined;
  VideoLecturesScreen: undefined;
  SubjectChaptersScreen: {
    subject: string;
    chapters: {
      [chapterName: string]: {
        videos: { title: string; video_url: string }[];
        pdfs: { title: string; pdf_url: string }[];
      };
    };
  };
  ChapterScreen: {
    subject: string;
    chapter: string;
    content: {
      videos: { title: string; video_url: string }[];
      pdfs: { title: string; pdf_url: string }[];
    };
  };
  LectureViewer: {
    title: string;
    url: string;
    type: "video" | "pdf";
  };
};

const Stack = createStackNavigator<StackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom tab navigator
const StudentDashboard: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Profile"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let icon;
        switch (route.name) {
          case "Profile":
            icon = faUser;
            break;
          case "Videos":
            icon = faVideo;
            break;
          case "Assignments":
            icon = faBook;
            break;
          case "Submit":
            icon = faCloudUploadAlt;
            break;
          case "Schedule":
            icon = faCalendar;
            break;
          case "Query":
            icon = faComments;
            break;
          default:
            icon = faUser;
        }
        return <FontAwesomeIcon icon={icon} size={size || 24} color={color} />;
      },
      tabBarActiveTintColor: "#007bff",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#eee",
      },
    })}
  >
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "My Profile" }} />
    <Tab.Screen name="Videos" component={VideoLecturesScreen} options={{ tabBarLabel: "Lectures" }} />
    <Tab.Screen name="Assignments" component={AssignmentsListScreen} options={{ tabBarLabel: "Assignments" }} />
    <Tab.Screen name="Submit" component={SubmitAssignmentScreen} options={{ tabBarLabel: "Submit Work" }} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: "Timetable" }} />
    <Tab.Screen name="Query" component={StudentQueryScreen} options={{ tabBarLabel: "Ask Query" }} />
  </Tab.Navigator>
);

// Stack navigation logic
const AppNavigator: React.FC = () => {
  const { student, isLoading } = useStudent();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={student ? "StudentDashboard" : "StudentLogin"}>
        {student ? (
          <>
            <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
            <Stack.Screen name="LectureViewer" component={LectureViewerScreen} />
            <Stack.Screen name="SubjectChaptersScreen" component={SubjectChaptersScreen} />
            <Stack.Screen name="ChapterScreen" component={ChapterScreen} />
          </>
        ) : (
          <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root component
const App: React.FC = () => {
  return (
    <StudentProvider>
      <AppNavigator />
    </StudentProvider>
  );
};

export default App;
