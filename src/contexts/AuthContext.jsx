import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// Crear el contexto
const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado del usuario autenticado
  const [error, setError] = useState(null); // Estado para errores
  const [loading, setLoading] = useState(true); // Estado para indicar carga inicial
  const navigate = useNavigate();

  // Cargar usuario desde localStorage al montar el componente
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          // Opcional: Verificar token con el backend
          await api.get("/auth/verify"); // Ejemplo de endpoint para verificar token
        }
      } catch (err) {
        console.error("[AUTH] Error al inicializar autenticaci�n:", err);
        setError("Error al cargar sesi�n. Intenta iniciar sesi�n nuevamente.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Funci�n para registrar usuario
  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      console.log("[AUTH] Registrando usuario con datos:", formData);
      const response = await api.post("/auth/register", formData);
      console.log("[AUTH] Registro exitoso:", response.data);
      navigate("/login"); // Redirigir a login tras registro exitoso
      return response.data;
    } catch (err) {
      console.error("[AUTH] Error en registro:", err);
      const errorMessage = err.response?.data?.message || "Error al registrarse. Verifica tus datos.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Funci�n para iniciar sesi�n
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log("[AUTH] Iniciando sesi�n con:", { email, password });
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      console.log("[AUTH] Login exitoso:", userData);
      navigate("/admin");
    } catch (err) {
      console.error("[AUTH] Error en login:", err);
      const errorMessage = err.response?.data?.message || "Error al iniciar sesi�n. Verifica tus credenciales.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Funci�n para cerrar sesi�n
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[AUTH] Cerrando sesi�n");
      // Opcional: Llamar a un endpoint de logout en el backend si existe
      // await api.post("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("[AUTH] Error al cerrar sesi�n:", err);
      setError("Error al cerrar sesi�n. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Valor del contexto
  const value = {
    user,
    setUser, // �til para actualizar manualmente el usuario si es necesario
    register,
    login,
    logout,
    error,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};





