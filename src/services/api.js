import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://menudigital-backend-production.up.railway.app";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // Aumentado para evitar timeouts en producción
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para agregar token a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401 y redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token inválido o expirado. Redirigiendo al login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

