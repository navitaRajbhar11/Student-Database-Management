import React, { useEffect, useState } from "react";
import AxiosInstance from "../component/AxiosInstances";
import { Trash2 } from "lucide-react";

const Home = () => {
  const [queries, setQueries] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    fetchQueries();
  }, [selectedClass]);

  const fetchQueries = async () => {
    try {
      let url = "admin/view-queries/";
      if (selectedClass) {
        url += `?class_grade=${selectedClass}`;
      }

      const response = await AxiosInstance.get(url);
      setQueries(response.data);
    } catch (error) {
      console.error("❌ Error fetching queries:", error);
    }
  };

  const handleDeleteQuery = async (queryId) => {
    try {
      await AxiosInstance.delete(`admin/delete-query/${queryId}/`);
      setQueries(queries.filter((query) => query.id !== queryId));
    } catch (error) {
      console.error("❌ Error deleting query:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          📌 Student Queries
        </h2>

        {/* ✅ Class Filter */}
        <div className="flex justify-end mb-4">
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

        {queries.length === 0 ? (
          <p className="text-gray-500 text-center">No queries submitted.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-blue-500 text-white uppercase text-sm">
                <th className="py-3 px-6 text-left">Student Name</th>
                <th className="py-3 px-6 text-left">Class</th>
                <th className="py-3 px-6 text-left">Query</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {queries.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                >
                  <td className="py-3 px-6">{q.studentName}</td>
                  <td className="py-3 px-6">{q.class_grade}th</td>
                  <td className="py-3 px-6">{q.query}</td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => handleDeleteQuery(q.id)}
                      className="text-red-600 hover:text-red-800 transition duration-300 cursor-pointer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Home;
