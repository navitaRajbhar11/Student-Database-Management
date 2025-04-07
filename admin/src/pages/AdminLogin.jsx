import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to get CSRF token from the browser cookies
  const getCsrfToken = () => {
    const csrfToken = document.cookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith("csrftoken="))
      ?.split("=")[1];
    return csrfToken;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true); // Start loading state

    const csrfToken = getCsrfToken(); // Get CSRF token

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/admin/login/", // API endpoint
        {
          email,
          password,
        },
        {
          headers: {
            "X-CSRFToken": csrfToken, // Add CSRF token to the headers
          },
        }
      );

      console.log("✅ Login Successful:", response.data);

      // Store login status (example: token or flag)
      localStorage.setItem("isAuthenticated", "true");

      // Redirect to home page after successful login
      navigate("/home");
    } catch (error) {
      console.error("❌ Error Response:", error.response?.data);
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border rounded-md mb-4"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-md mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 cursor-pointer"
            disabled={loading} // Disable button when loading
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;
