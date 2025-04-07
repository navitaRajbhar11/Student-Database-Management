import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../component/AxiosInstances";

const Schedule = () => {
  const [schedule, setSchedule] = useState({
    class_grade: "",
    subject: "",
    day: "",
    start_time: "",
    end_time: "",
  });

  const navigate = useNavigate();

  // ✅ Fix: Add handleChange function
  const handleChange = (e) => {
    setSchedule({ ...schedule, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const classGrade = parseInt(schedule.class_grade, 10);

    if (
      !classGrade ||
      !schedule.subject.trim() ||
      !schedule.day ||
      !schedule.start_time ||
      !schedule.end_time
    ) {
      alert("❌ Please fill all required fields!");
      return;
    }

    try {
      const response = await AxiosInstance.post("admin/create-schedule/", {
        class_grade: classGrade,
        subject: schedule.subject,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      });

      console.log("✅ API Response:", response.data);
      alert("✅ Schedule Created Successfully!");

      // ✅ Navigate to ListSchedule page
      navigate("/list-schedule", { replace: true });
    } catch (error) {
      console.error("❌ API Error:", error);
      alert(
        `Failed to create schedule! 🚨 Error: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          📅 Create Class Timetable
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <label className="text-sm font-semibold">Class Grade:</label>
          <select
            name="class_grade"
            value={schedule.class_grade}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Select Class Grade</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Class {i + 1}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold">Subject:</label>
          <input
            type="text"
            name="subject"
            value={schedule.subject}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter subject name"
          />

          <label className="text-sm font-semibold">Day:</label>
          <select
            name="day"
            value={schedule.day}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Select Day</option>
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold">Start Time:</label>
          <input
            type="time"
            name="start_time"
            value={schedule.start_time}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <label className="text-sm font-semibold">End Time:</label>
          <input
            type="time"
            name="end_time"
            value={schedule.end_time}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-900 cursor-pointer"
          >
            ➕ Add Timetable
          </button>
        </form>
      </div>
    </div>
  );
};

export default Schedule;
