import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Permite enviar cookies si es necesario
});

export default api;
