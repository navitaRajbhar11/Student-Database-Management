import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the student type
export type Student = {
  id: string;
  name: string;
  username: string;
  email: string;
  class_grade: string;
};

// Define the context type
type StudentContextType = {
  student: Student | null;
  setStudent: (student: Student | null) => void;
  logout: () => void;
  isLoading: boolean;
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Provider component that wraps around your app
export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudentState] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const storedStudent = await AsyncStorage.getItem("student");
        if (storedStudent) {
          setStudentState(JSON.parse(storedStudent)); // Load student data from AsyncStorage
        }
      } catch (error) {
        console.error("Failed to load student from storage:", error);
      } finally {
        setIsLoading(false); // Stop loading once the data is fetched or an error occurs
      }
    };
    loadStudent();
  }, []); // Only run once when the component mounts

  // Function to set student data to AsyncStorage and context state
  const setStudent = async (student: Student | null) => {
    try {
      if (student) {
        await AsyncStorage.setItem("student", JSON.stringify(student)); // Store in AsyncStorage
      } else {
        await AsyncStorage.removeItem("student"); // Remove from AsyncStorage
      }
      setStudentState(student); // Update the state
    } catch (error) {
      console.error("Failed to set student in storage:", error);
    }
  };

  // Logout function that clears student data from AsyncStorage
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("student");
      setStudentState(null); // Clear student state on logout
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <StudentContext.Provider value={{ student, setStudent, logout, isLoading }}>
      {children}
    </StudentContext.Provider>
  );
};

// Custom hook to access the student context
export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
};
