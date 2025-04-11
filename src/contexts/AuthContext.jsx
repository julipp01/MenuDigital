// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login, fetchUserProfile } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      setError(null);
      const userData = await fetchUserProfile();
      console.log("[AuthContext] Usuario cargado desde fetchUserProfile:", userData);
      setUser(userData);
    } catch (error) {
      console.error("[AuthContext] Error al obtener datos del usuario:", error);
      setUser(null);
      setError("No se pudieron cargar los datos del usuario.");
      localStorage.removeItem("token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loginHandler = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const { token } = await login(credentials);
      localStorage.setItem("token", token);
      console.log("[AuthContext] Login exitoso, token guardado:", token);
      await fetchUserData();
      navigate("/dashboard"); // Redirigir siempre tras login exitoso
    } catch (error) {
      console.error("[AuthContext] Error en login:", error);
      setError("Credenciales incorrectas o error en el servidor.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    token ? fetchUserData() : setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <AuthContext.Provider value={{ user, login: loginHandler, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};









