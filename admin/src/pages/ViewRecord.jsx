import { useEffect, useState } from "react";
import AxiosInstance from "../component/AxiosInstances"; // Axios instance for API calls
import { Trash2 } from "lucide-react"; // Trash icon for deleting students
import { Link } from "react-router-dom"; // Import Link from React Router

const ViewRecord = () => {
  const [studentList, setStudentList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await AxiosInstance.get("admin/views-student/");
        console.log("Fetched students:", response.data);
        setStudentList(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const response = await AxiosInstance.delete(
        `admin/delete-student/${studentId}/`
      );
      if (response.status === 200) {
        alert("✅ Student Deleted Successfully!");
        setStudentList((prev) => prev.filter((s) => s.id !== studentId)); // Remove deleted student from the list
      } else {
        alert("❌ Failed to delete student!");
      }
    } catch (error) {
      console.error(
        "❌ Error deleting student:",
        error.response?.data || error
      );
      alert("An error occurred while deleting the student.");
    }
  };

  const filteredStudents = selectedClass
    ? studentList.filter((s) => s.class_grade === parseInt(selectedClass))
    : studentList;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          📋 Student Records
        </h2>

        {/* Add Student Link */}
        <div className="flex justify-between items-center mb-4">
          <Link
            to="/student-created"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Add Student
          </Link>

          <div className="flex justify-end">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border p-2 rounded-md shadow-sm text-gray-700 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">📚 All Classes</option>
              {[...Array(10).keys()].map((i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}th Standard
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-gray-500 text-center">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
              <thead>
                <tr className="bg-blue-500 text-white uppercase text-sm">
                  <th className="py-3 px-6 text-left">Sr No.</th>
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Username</th>
                  <th className="py-3 px-6 text-left">Password</th>
                  <th className="py-3 px-6 text-left">Class</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {filteredStudents.map((s, index) => (
                  <tr
                    key={s.id || index}
                    className="border-b border-gray-300 hover:bg-gray-100"
                  >
                    <td className="py-3 px-6">{index + 1}</td>
                    <td className="py-3 px-6">{s.name}</td>
                    <td className="py-3 px-6">{s.username}</td>
                    <td className="py-3 px-6">{s.password}</td>
                    <td className="py-3 px-6">{s.class_grade}th</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleDeleteStudent(s.id)}
                        className="cursor-pointer text-red-600 hover:text-red-800 transition duration-300"
                      >
                        <Trash2 size={18} className="inline-block mr-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewRecord;
