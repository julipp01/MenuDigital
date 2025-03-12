// api.js (Corregido)
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,  // ✅ Apunta a Railway en producción o localhost en desarrollo
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("[API] Error en la respuesta:", error);
    throw error;
  }
};

export default api;
