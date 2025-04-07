import React, { useEffect, useState } from "react";
import AxiosInstance from "../component/AxiosInstances";
import { Eye, Trash2, Check, X } from "lucide-react";

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [classGrade, setClassGrade] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, [classGrade]);

  const fetchSubmissions = async () => {
    try {
      const url = classGrade
        ? `admin/list-submissions/?class_grade=${classGrade}`
        : "admin/list-submissions/";
      const response = await AxiosInstance.get(url);
      setSubmissions(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      await AxiosInstance.patch(
        `admin/update-submission-status/${submissionId}/`,
        {
          status: newStatus,
        }
      );
      alert(`Submission marked as ${newStatus}`);
      fetchSubmissions();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this submission?"))
      return;

    try {
      await AxiosInstance.delete(`admin/delete-submission/${submissionId}/`);
      alert("Submission deleted!");
      setSubmissions(submissions.filter((s) => s._id !== submissionId));
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        📄 Student Submissions
      </h2>

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

      {submissions.length === 0 ? (
        <p className="text-gray-500 text-center">No submissions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-blue-600 text-white uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Student</th>
                <th className="py-3 px-6 text-left">Class</th>
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Submitted On</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm font-medium">
              {submissions.map((submission) => (
                <tr
                  key={submission._id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                >
                  <td className="py-3 px-6">{submission.student_name}</td>
                  <td className="py-3 px-6">Class {submission.class}</td>
                  <td className="py-3 px-6">{submission.assignment_title}</td>
                  <td className="py-3 px-6">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2 py-1 rounded ${
                        submission.status === "Approved"
                          ? "bg-green-500 text-white"
                          : submission.status === "Rejected"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 flex gap-3 justify-center mt-1">
                    {/* ✅ View PDF */}
                    <a
                      href={`http://localhost:8000/api/media/assignments/${submission.filename
                      .replace(/\\/g, "/")
                      .replace("media/", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      >
                      <Eye size={20} />
                    </a>
                    {/* ✅ Approve */}
                    {submission.status !== "Approved" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(submission._id, "Approved")
                        }
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check size={20} />
                      </button>
                    )}

                    {/* ✅ Reject */}
                    {submission.status !== "Rejected" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(submission._id, "Rejected")
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    )}

                    {/* ✅ Delete */}
                    <button
                      onClick={() => handleDelete(submission._id)}
                      className="text-gray-600 hover:text-gray-800"
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
    </div>
  );
};

export default AdminSubmissions;
