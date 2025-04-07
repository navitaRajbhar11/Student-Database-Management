import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../component/AxiosInstances";

const Assignment = () => {
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    class_grade: "", // ✅ Added class selection
  });

  const navigate = useNavigate();

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setAssignment({ ...assignment, [e.target.name]: e.target.value });
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !assignment.title ||
      !assignment.description ||
      !assignment.due_date ||
      !assignment.class_grade
    ) {
      alert("❌ Please fill all fields!");
      return;
    }

    console.log("📌 Sending Data to API:", assignment); // ✅ Log request data

    try {
      const response = await AxiosInstance.post(
        "admin/create-assignment/",
        assignment
      );
      console.log("✅ API Response:", response.data); // ✅ Log API response

      alert("✅ Assignment Created Successfully!");
      navigate("/assignment-list", { replace: true });
    } catch (error) {
      console.error("❌ API Error:", error.response?.data || error.message);
      alert(
        `Failed to create assignment! Error: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          📄 Create Assignment
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <label className="text-sm font-semibold">Title:</label>
          <input
            type="text"
            name="title"
            value={assignment.title}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter assignment title"
          />

          <label className="text-sm font-semibold">Description:</label>
          <textarea
            name="description"
            value={assignment.description}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter description"
          />

          <label className="text-sm font-semibold">Class:</label>
          <select
            name="class_grade"
            value={assignment.class_grade}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">📚 Select Class</option>
            {[...Array(10).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                Class {i + 1}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold">Due Date:</label>
          <input
            type="date"
            name="due_date"
            value={assignment.due_date}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-900 cursor-pointer"
          >
            ➕ Add Assignment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assignment;
