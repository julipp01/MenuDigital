// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.18.22:5000/api", // Cambia de localhost a la IP del backend
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("[API] Solicitud enviada:", config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error("[API] Error en el interceptor de solicitud:", error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log("[API] Respuesta recibida:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("[API] Error en la respuesta:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api;
