import axios from "axios";

// 🔹 Configuración de URL base según entorno
const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL_PROD || "https://menudigital-backend-production.up.railway.app"
    : import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("🌐 Environment:", import.meta.env.MODE);
console.log("🔌 API Base URL:", BASE_URL);

// 🔹 Crear instancias de Axios
const api = axios.create({ baseURL: BASE_URL, timeout: 20000, withCredentials: true });
const publicApi = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// 🔹 Interceptor de solicitudes (solo para api autenticada)
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  console.log("🔹 [API] Enviando token:", token || "No token encontrado");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else console.warn("⚠️ [API] No hay token en localStorage");
  return config;
});

// 🔹 Interceptor de respuestas (manejo de errores unificado)
const handleError = error => {
  const { response } = error;
  const status = response?.status;
  const data = response?.data;

  console.error("❌ [API] Error:", { status, data, message: error.message });

  if (status === 401) {
    console.warn("⚠️ [API] Token inválido/expirado. Cerrando sesión...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  } else if (status === 403) {
    console.error("🔒 [API] Acceso prohibido:", data?.message || "Sin permisos");
    return Promise.reject(new Error(data?.message || "No tienes permisos"));
  }

  return Promise.reject(error);
};

api.interceptors.response.use(response => response, handleError);
publicApi.interceptors.response.use(response => response, handleError);

// 🔹 Función genérica para solicitudes
const apiRequest = async (instance, method, url, data = null) => {
  try {
    const response = await instance[method](url, data);
    console.log(`✅ [API] ${url} obtenido:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ [API] Error en ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// 🔹 Rutas públicas
export const fetchPublicMenu = restaurantId => apiRequest(publicApi, "get", `/restaurantes/${restaurantId}/public`);
export const fetchPublicMenuItems = restaurantId => apiRequest(publicApi, "get", `/restaurantes/${restaurantId}/public/items`);

// 🔹 Rutas autenticadas
export const fetchDashboardStats = () => apiRequest(api, "get", "/dashboard/stats").catch(() => ({ platillos: 0, restaurantes: 0 }));
export const fetchUserProfile = () => apiRequest(api, "get", "/users/info");
export const fetchUserPlan = () => apiRequest(api, "get", "/users/plan").catch(() => null);
export const updateUserProfile = (userId, userData) => apiRequest(api, "put", `/users/${userId}`, userData).catch(() => null);
export const login = credentials => apiRequest(api, "post", "/auth/login", credentials);
export const register = data => apiRequest(api, "post", "/auth/register", data);
export const getRestaurants = () => apiRequest(api, "get", "/restaurantes");
export const getUsers = () => apiRequest(api, "get", "/users");
export const getUser = id => apiRequest(api, "get", `/users/${id}`);
export const createUser = userData => apiRequest(api, "post", "/users", userData);
export const updateUser = (id, userData) => apiRequest(api, "put", `/users/${id}`, userData);

// 🔹 Actualización de plantilla con manejo de errores personalizado
export const updateRestaurantTemplate = async (restaurantId, templateId) => {
  try {
    console.log("🔹 [API] Actualizando plantilla:", { restaurantId, templateId });
    const response = await api.put(`/restaurantes/${restaurantId}/template`, { templateId });
    console.log("✅ [API] Plantilla actualizada:", response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.response?.data?.details || "Error al cambiar plantilla";
    console.error("❌ [API] Error detallado:", { status: error.response?.status, data: error.response?.data });
    throw new Error(errorMessage);
  }
};

export const fetchTemplates = () => apiRequest(api, "get", "/templates");

export default api;






