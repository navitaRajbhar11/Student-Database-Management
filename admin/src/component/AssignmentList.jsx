import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react"; // Importing Trash2 icon from lucide-react
import AxiosInstance from "../component/AxiosInstances";

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [selectedClass, setSelectedClass] = useState(""); // ✅ Class selection required

  // ✅ Fetch Assignments from API when a class is selected
  useEffect(() => {
    let isMounted = true; // Flag to check if the component is mounted

    const fetchAssignments = async () => {
      try {
        const response = await AxiosInstance.get(
          `admin/list-assignment/?class_grade=${selectedClass}`
        );
        if (isMounted) {
          setAssignments(response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching assignments:", error);
      }
    };

    if (selectedClass) {
      fetchAssignments();
    }

    return () => {
      isMounted = false; // Cleanup flag to prevent setting state if the component is unmounted
    };
  }, [selectedClass]);

  // ✅ Handle Filters
  const handleFilterChange = (e) => setFilterDate(e.target.value);
  const handleClassChange = (e) => setSelectedClass(e.target.value);

  // ✅ Filter Assignments
  const filteredAssignments = assignments.filter((assignment) => {
    if (!filterDate) return true;
    return assignment.due_date.startsWith(filterDate); // This checks if the due_date starts with the selected filterDate
  });

  // ✅ Handle Delete Assignment
  const handleDelete = async (assignmentId) => {
    if (!assignmentId) {
      alert("⚠️ Assignment ID is missing!");
      return;
    }

    if (
      !window.confirm("⚠️ Are you sure you want to delete this assignment?")
    ) {
      return;
    }

    try {
      await AxiosInstance.delete(`admin/delete-assignment/${assignmentId}/`);
      alert("✅ Assignment Deleted Successfully!");
      setAssignments(assignments.filter((a) => a._id !== assignmentId)); // ✅ Remove from UI instantly
    } catch (error) {
      console.error(
        "❌ Error deleting assignment:",
        error.response?.data || error
      );
      alert("Failed to delete assignment! Check console for details.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        📄 Assignment List
      </h2>

      {/* ✅ Class Selection & Add Assignment Button */}
      <div className="flex justify-between mb-6">
        {/* ✅ Class Dropdown */}
        <select
          value={selectedClass}
          onChange={handleClassChange}
          className="border p-2 rounded-lg shadow-md"
        >
          <option value="">📚 Select a Class</option>
          {[...Array(10).keys()].map((i) => (
            <option key={i + 1} value={i + 1}>
              Class {i + 1}
            </option>
          ))}
        </select>

        {/* ✅ Add Assignment Button */}
        <Link
          to="/assignment-created"
          className="bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold shadow-md hover:bg-blue-900 transition duration-300"
        >
          ➕ Add Assignment
        </Link>
      </div>

      {/* ✅ Show Assignments Only After Class Selection */}
      {selectedClass ? (
        <>
          {/* ✅ Date Filter */}
          <div className="flex justify-center mb-4">
            <input
              type="date"
              value={filterDate}
              onChange={handleFilterChange}
              className="border p-2 rounded-lg shadow-md"
            />
          </div>

          {filteredAssignments.length === 0 ? (
            <p className="text-gray-500 text-center">No assignments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
                <thead>
                  <tr className="bg-green-600 text-white uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Sr No.</th>
                    <th className="py-3 px-6 text-left">Title</th>
                    <th className="py-3 px-6 text-left">Description</th>
                    <th className="py-3 px-6 text-left">Due Date</th>
                    <th className="py-3 px-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-medium">
                  {filteredAssignments.map((assignment, index) => (
                    <tr
                      key={assignment._id}
                      className="border-b border-gray-300 hover:bg-gray-100"
                    >
                      <td className="py-3 px-6">{index + 1}</td>
                      <td className="py-3 px-6">{assignment.title}</td>
                      <td className="py-3 px-6">{assignment.description}</td>
                      <td className="py-3 px-6">{assignment.due_date}</td>
                      <td className="py-3 px-6">
                        {/* ✅ Delete Button with Trash Icon */}
                        <button
                          onClick={() => handleDelete(assignment._id)}
                          className="cursor-pointer text-red-600 hover:text-red-800 transition duration-300"
                        >
                          <Trash2 size={20} /> {/* Trash Icon */}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center">
          Please select a class to view assignments.
        </p>
      )}
    </div>
  );
};

export default AssignmentList;
