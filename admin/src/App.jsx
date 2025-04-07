import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";
import ViewRecord from "./pages/ViewRecord";
import StudentRecordCreate from "./component/StudentRecordCreate";
import Assignment from "./pages/Assignment";
import AssignmentList from "./component/AssignmentList";
import AddVideos from "./component/AddVideos";
import ListVideo from "./pages/ListVideos";
import Layout from "./component/Layout";
import Schedule from "./pages/Schedule";
import ListSchedule from "./pages/ListSchedule";
import AdminSubmissions from "./pages/AdminSubmissions";
import ProtectedRoute from "./component/ProtectedRoute"; // Correct import

function App() {
  const [students, setStudents] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AdminLogin />} />
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route
              path="/student-created"
              element={
                <StudentRecordCreate
                  students={students}
                  setStudents={setStudents}
                />
              }
            />
            <Route
              path="/student-record"
              element={<ViewRecord students={students} />}
            />
            <Route path="/submission" element={<AdminSubmissions />} />
            <Route path="/assignment-created" element={<Assignment />} />
            <Route path="/assignment-list" element={<AssignmentList />} />
            <Route path="/add-videos" element={<AddVideos />} />
            <Route path="/list-videos" element={<ListVideo />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/list-schedule" element={<ListSchedule />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
