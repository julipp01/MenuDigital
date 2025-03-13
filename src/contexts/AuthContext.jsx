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

          // Verificar token con el backend
          await api.get("/auth/verify");
        }
      } catch (err) {
        console.error("[AUTH] Error al inicializar autenticación:", err);
        setError("Sesión expirada. Inicia sesión nuevamente.");
        logout(); // Cerrar sesión si el token no es válido
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // ?? Función para registrar usuario
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
      const errorMessage = err.response?.data?.error || "Error al registrarse. Verifica los datos.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ?? Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[AUTH] Iniciando sesión con:", { email, password });

      if (!email || !password) {
        throw new Error("Email y contraseña son obligatorios");
      }

      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("[AUTH] Login exitoso:", userData);
      navigate("/admin");
    } catch (err) {
      console.error("[AUTH] Error en login:", err);

      let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
      if (err.code === "ERR_NETWORK") {
        errorMessage = "No se pudo conectar al servidor. Verifica tu conexión.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ?? Función para cerrar sesión
  const logout = () => {
    console.log("[AUTH] Cerrando sesión");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    
    navigate("/login");
  };

  // Valor del contexto
  const value = {
    user,
    setUser,
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





