import axios from "axios";

// ✅ Fix CSRF handling
const AxiosInstances = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Allow cookies (for CSRF)
});

// ✅ Attach JWT token dynamically
AxiosInstances.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default AxiosInstances;
