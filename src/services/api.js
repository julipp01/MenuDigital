import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Permite cookies si es necesario
});

// 🔹 Interceptor para incluir automáticamente el token en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Obtener token almacenado
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Agregar token al header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔹 Interceptor para manejar errores 401 automáticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token inválido o expirado. Redirigiendo al login...");
      localStorage.removeItem("token"); // Eliminar token inválido
      localStorage.removeItem("user"); // Eliminar usuario
      window.location.href = "/login"; // Redirigir al login
    }
    return Promise.reject(error);
  }
);

export default api;

