// src/components/Auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiHome, FiUserPlus } from "react-icons/fi";
import MiniNavbar from "../common/MiniNavbar";
import Footer from "../common/Footer";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Temporizador de inactividad
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => navigate("/"), INACTIVITY_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError("⚠ Por favor, completa todos los campos.");
      return;
    }

    try {
      await login(formData); // loginContext ya redirige
    } catch (err) {
      setError(authError || "❌ Error al iniciar sesión. Verifica tus credenciales.");
      console.error("Login error:", err);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(""); // Limpia el error al escribir
  };

  const inputStyles = "w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-gray-50 hover:bg-white disabled:bg-gray-200";
  const buttonStyles = "w-full py-2 rounded-xl text-gray-700 font-medium border border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2 transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-100 font-roboto">
      <MiniNavbar />
      <main className="flex flex-grow items-center justify-center p-6">
        <motion.div
          className="p-8 rounded-3xl shadow-xl w-full max-w-md bg-white/90 backdrop-blur-md border border-orange-200"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-4xl font-extrabold text-center mb-6" style={{ color: theme?.colors?.text || "#1f2937" }}>
            {theme?.siteName || "Iniciar Sesión"}
          </h2>

          {error && (
            <motion.p
              className="text-red-600 text-center mb-6 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="Correo electrónico"
                disabled={authLoading}
                aria-label="Correo electrónico"
              />
            </div>

            <div className="relative group">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="Contraseña"
                disabled={authLoading}
                aria-label="Contraseña"
              />
            </div>

            <motion.button
              type="submit"
              disabled={authLoading}
              className={`w-full py-3 rounded-xl text-white font-semibold shadow-md transition-all duration-200 ${authLoading ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
              whileHover={!authLoading && { scale: 1.05, boxShadow: "0 4px 14px rgba(255, 102, 0, 0.3)" }}
              whileTap={!authLoading && { scale: 0.95 }}
            >
              {authLoading ? "Cargando..." : "Iniciar Sesión"}
            </motion.button>
          </form>

          <div className="mt-6 flex justify-between gap-4">
            <Link to="/">
              <motion.button className={buttonStyles} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiHome className="text-orange-500" /> Home
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button className={buttonStyles} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiUserPlus className="text-orange-500" /> Registrarse
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;









