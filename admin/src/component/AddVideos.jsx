import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../component/AxiosInstances";

const AddVideos = () => {
  const [video, setVideo] = useState({
    title: "",
    class_grade: "",
    video_url: "",
    description: "",
    pdf_url: "", // ✅ New field for PDF
  });

  const navigate = useNavigate();

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setVideo({ ...video, [e.target.name]: e.target.value });
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const classGrade = parseInt(video.class_grade, 10);

    if (!video.title || !classGrade || !video.video_url) {
      alert("❌ Please fill all required fields!");
      return;
    }

    try {
      const response = await AxiosInstance.post("admin/create-video-lecture/", {
        ...video,
        class_grade: classGrade,
      });

      console.log("✅ API Response:", response.data);
      alert("✅ Video Lecture Created Successfully!");
      navigate("/list-videos", { replace: true });
    } catch (error) {
      console.error("❌ API Error:", error);

      if (error.response) {
        console.log("🚨 Response Data:", error.response.data);
        console.log("🚨 Status Code:", error.response.status);
        console.log("🚨 Headers:", error.response.headers);
      }

      alert(
        `Failed to create video lecture! 🚨 Error: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          🎥 Create Video Lecture
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <label className="text-sm font-semibold">Title:</label>
          <input
            type="text"
            name="title"
            value={video.title}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter video title"
          />

          <label className="text-sm font-semibold">Class Grade:</label>
          <select
            name="class_grade"
            value={video.class_grade}
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

          <label className="text-sm font-semibold">Video URL:</label>
          <input
            type="text"
            name="video_url"
            value={video.video_url}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter video URL"
          />

          <label className="text-sm font-semibold">Description:</label>
          <textarea
            name="description"
            value={video.description}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter description (optional)"
          />
          <label className="text-sm font-semibold">Upload PDF:</label>
          <input
            type="text"
            name="pdf_url"
            value={video.pdf_url}
            onChange={handleChange}
            className="border p-2 rounded"
            placeholder="Enter PDF URL"
          />

          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-900 cursor-pointer"
          >
            ➕ Add Video
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVideos;
