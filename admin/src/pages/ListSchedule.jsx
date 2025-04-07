import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react"; // Importing Trash2 icon
import AxiosInstance from "../component/AxiosInstances";

const ListSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [classGrade, setClassGrade] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, [classGrade]);

  const fetchSchedules = async () => {
    try {
      console.log("📌 Fetching schedules...");
      const url = classGrade
        ? `admin/list-schedule/?class_grade=${classGrade}`
        : "admin/list-schedule/";
      const response = await AxiosInstance.get(url);
      console.log("✅ API Response:", response.data);
      setSchedules(response.data);
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
    }
  };

  // ✅ Handle Delete Schedule
  const handleDelete = async (scheduleId) => {
    if (!scheduleId) {
      console.error("❌ Error: Schedule ID is undefined!");
      alert("⚠️ Error: Cannot delete schedule. Invalid ID.");
      return;
    }

    if (!window.confirm("⚠️ Are you sure you want to delete this schedule?")) {
      return;
    }

    try {
      console.log(`🗑️ Deleting schedule with ID: ${scheduleId}`);
      await AxiosInstance.delete(`admin/delete-schedule/${scheduleId}/`);
      alert("✅ Schedule Deleted Successfully!");
      setSchedules(schedules.filter((s) => s._id !== scheduleId));
    } catch (error) {
      console.error(
        "❌ Error deleting schedule:",
        error.response?.data || error
      );
      alert("Failed to delete schedule! Check console for details.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        📅 Class Timetable
      </h2>

      {/* ✅ Class Filter (Dropdown) */}
      <div className="flex justify-center mb-4">
        <select
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
          className="border p-2 rounded-lg shadow-md"
        >
          <option value="">Select Class</option>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Class {i + 1}
            </option>
          ))}
        </select>
      </div>

      {schedules.length === 0 ? (
        <p className="text-gray-500 text-center">No schedules found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-green-600 text-white uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Class</th>
                <th className="py-3 px-6 text-left">Day</th>
                <th className="py-3 px-6 text-left">Subject</th>
                <th className="py-3 px-6 text-left">Start Time</th>
                <th className="py-3 px-6 text-left">End Time</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-medium">
              {schedules.map((schedule) => (
                <tr
                  key={schedule._id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                >
                  <td className="py-3 px-6">Class {schedule.class_grade}</td>
                  <td className="py-3 px-6">{schedule.day}</td>
                  <td className="py-3 px-6">{schedule.subject}</td>
                  <td className="py-3 px-6">{schedule.start_time}</td>
                  <td className="py-3 px-6">{schedule.end_time}</td>
                  <td className="py-3 px-6">
                    {/* ✅ Delete Button */}
                    <button
                      onClick={() => handleDelete(schedule._id)}
                      className="cursor-pointer text-red-600 hover:text-red-800 transition duration-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Add Schedule Button */}
      <div className="mt-6 text-center">
        <Link
          to="/schedule"
          className="bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-blue-900 transition duration-300"
        >
          ➕ Add Schedule
        </Link>
      </div>
    </div>
  );
};

export default ListSchedule;
