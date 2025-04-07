import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AxiosInstance from "../component/AxiosInstances";
import { Trash2 } from "lucide-react"; // Importing Trash2 icon from lucide-react

const ListVideos = () => {
  const [videos, setVideos] = useState([]);
  const [classGrade, setClassGrade] = useState("");

  // ✅ Fetch Video Lectures
  useEffect(() => {
    fetchVideos();
  }, []); // ✅ Runs once on mount

  useEffect(() => {
    fetchVideos();
  }, [classGrade]); // ✅ Runs when classGrade changes

  const fetchVideos = async () => {
    try {
      console.log("📌 Fetching videos...");

      // ✅ Send classGrade as query param if selected
      const url = classGrade
        ? `admin/list-videos-lectures/?class_grade=${classGrade}`
        : "admin/list-videos-lectures/";
      const response = await AxiosInstance.get(url);

      console.log("✅ API Response:", response.data);
      setVideos(response.data);
    } catch (error) {
      console.error("❌ Error fetching videos:", error);
    }
  };

  // ✅ Handle Video Deletion
  const handleDelete = async (videoId) => {
    try {
      const response = await AxiosInstance.delete(
        `admin/delete-video/${videoId}/`
      );
      console.log("✅ Video deleted:", response.data);

      // Remove deleted video from state
      setVideos(videos.filter((video) => video.id !== videoId));
    } catch (error) {
      console.error("❌ Error deleting video:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
        🎥 Video Lectures
      </h2>

      {/* ✅ Class Filter with Dropdown */}
      <div className="flex justify-center mb-4">
        <select
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
          className="border p-2 rounded-lg shadow-md"
        >
          <option value="">All Classes</option>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Class {i + 1}
            </option>
          ))}
        </select>
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-500 text-center">No videos found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            <thead>
              <tr className="bg-green-600 text-white uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Title</th>
                {/* ✅ No spaces after */}
                <th className="py-3 px-6 text-left">Class</th>
                {/* ✅ No spaces after */}
                <th className="py-3 px-6 text-left">Video</th>
                <th className="py-3 px-6 text-left">PDF Notes</th>
                <th className="py-3 px-6 text-left">Description</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="text-gray-700 text-sm font-medium">
              {videos.map((video) => (
                <tr
                  key={video.id}
                  className="border-b border-gray-300 hover:bg-gray-100"
                >
                  <td className="py-3 px-6">{video.title}</td>
                  <td className="py-3 px-6">{video.class_grade}</td>
                  <td className="py-3 px-6">
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📺 Watch Video
                    </a>
                  </td>
                  <td className="py-3 px-6">
                    {video.pdf_url ? (
                      <a
                        href={video.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        📄 View PDF
                      </a>
                    ) : (
                      <span className="text-gray-400">No PDF</span>
                    )}
                  </td>
                  <td className="py-3 px-6">{video.description}</td>
                  <td className="py-3 px-6 cursor-pointer text-red-600 hover:text-red-800 transition duration-300">
                    <button onClick={() => handleDelete(video.id)}>
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Add Video Button */}
      <div className="mt-6 text-center">
        <Link
          to="/add-videos"
          className="bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-blue-900 transition duration-300"
        >
          ➕ Add Video
        </Link>
      </div>
    </div>
  );
};

export default ListVideos;
