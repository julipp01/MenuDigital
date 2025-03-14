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

  // Cargar usuario desde localStorage al montar el componente y verificar token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // Verificar token con el backend para asegurarnos de que sigue siendo v�lido
          const response = await api.get("/auth/verify", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          // Actualizar el estado del usuario con la informaci�n m�s reciente del backend
          setUser({
            id: response.data.id,
            email: response.data.email,
            name: response.data.name,
            role: response.data.role,
            restaurantId: response.data.restaurantId, // Aseg�rate de incluir restaurantId
          });
          localStorage.setItem("user", JSON.stringify(response.data)); // Actualizar localStorage
          console.log("[AUTH] Sesi�n verificada y usuario actualizado:", response.data);
        }
      } catch (err) {
        console.error("[AUTH] Error al inicializar autenticaci�n:", err);
        setError("Sesi�n expirada o token inv�lido. Inicia sesi�n nuevamente.");
        logout(); // Cerrar sesi�n si el token no es v�lido
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

      // Iniciar sesi�n autom�ticamente despu�s del registro
      await login({ email: formData.email, password: formData.password });

      return response.data; // Devolver la respuesta para uso en el componente
    } catch (err) {
      console.error("[AUTH] Error en registro:", err);
      const errorMessage = err.response?.data?.error || "Error al registrarse. Verifica los datos.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Funci�n para iniciar sesi�n
  const login = async ({ email, password }) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[AUTH] Iniciando sesi�n con:", { email, password });

      if (!email || !password) {
        throw new Error("Email y contrase�a son obligatorios");
      }

      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;

      // Guardar token y datos del usuario en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("[AUTH] Login exitoso:", userData);

      // Redirigir al dashboard del restaurante usando el restaurantId
      navigate(`/dashboard/restaurant/${userData.restaurantId}`);
    } catch (err) {
      console.error("[AUTH] Error en login:", err);

      let errorMessage = "Error al iniciar sesi�n. Verifica tus credenciales.";
      if (err.code === "ERR_NETWORK") {
        errorMessage = "No se pudo conectar al servidor. Verifica tu conexi�n.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Funci�n para cerrar sesi�n
  const logout = () => {
    console.log("[AUTH] Cerrando sesi�n");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);

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





