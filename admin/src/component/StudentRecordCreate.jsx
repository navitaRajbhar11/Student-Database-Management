import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../component/AxiosInstances"; // ✅ Ensure this import

const StudentRecordCreate = ({ students = [], setStudents }) => {
  const [newStudent, setNewStudent] = useState({
    name: "", // ✅ Replace email with name
    username: "",
    password: "",
    class_grade: "1",
  });

  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newStudent.name || !newStudent.username || !newStudent.password) {
      setError("Please fill all fields!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await AxiosInstance.post(
        "admin/create-student/",
        newStudent
      );

      if (response.status === 201) {
        alert("✅ Student Created Successfully!");
        setRedirect(true);
      } else {
        setError("❌ Failed to create student");
      }
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error);
      setError(
        "❌ Error: " + (error.response?.data?.error || "Something went wrong")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (redirect) {
      navigate("/student-record");
      setRedirect(false);
    }
  }, [redirect, navigate]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">👨‍🎓 Add Student</h2>
        {error && (
          <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <label className="text-sm font-semibold">Name:</label>
          <input
            type="text"
            name="name"
            value={newStudent.name}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter student name"
          />

          <label className="text-sm font-semibold">Username:</label>
          <input
            type="text"
            name="username"
            value={newStudent.username}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter username"
          />

          <label className="text-sm font-semibold">Password:</label>
          <input
            type="password"
            name="password"
            value={newStudent.password}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter password"
          />

          <label className="text-sm font-semibold">Select Class:</label>
          <select
            name="class_grade"
            value={newStudent.class_grade}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            {[...Array(10).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}th Standard
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-gray-400" : "bg-blue-600"
            } text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-800 cursor-pointer`}
          >
            {loading ? "Adding..." : "Add Student"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRecordCreate;
