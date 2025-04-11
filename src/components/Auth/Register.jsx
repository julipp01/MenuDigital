import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiHome, FiLogIn, FiUsers } from "react-icons/fi"; // Cambié FiGenderMale por FiUsers
import MiniNavbar from "../common/MiniNavbar";
import Footer from "../common/Footer";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    role: "free"
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme() || {};

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "El nombre es obligatorio.";
    if (!formData.email) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo no es válido.";
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (!formData.gender) newErrors.gender = "Por favor, selecciona tu género.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData);
      navigate("/login", { state: { success: "¡Registro exitoso! Por favor, inicia sesión." } });
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || "Error durante el registro. Verifica los datos." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const inputVariants = {
    focus: {
      scale: 1.02,
      boxShadow: `0 0 8px ${theme?.colors?.primary || "rgba(255, 102, 0, 0.5)"}`,
      transition: { duration: 0.2 },
    },
    blur: {
      scale: 1,
      boxShadow: "none",
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-orange-100 font-roboto">
      <MiniNavbar />

      <div className="flex flex-grow items-center justify-center p-6">
        <motion.div
          className="p-8 rounded-3xl shadow-xl w-full max-w-md bg-white/95 backdrop-blur-md border"
          style={{ borderColor: theme?.colors?.primary || "#ff6600" }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2
            className="text-4xl font-extrabold text-center mb-6"
            style={{ color: theme?.colors?.text || "#1f2937" }}
          >
            Crear Cuenta
          </h2>

          {errors.submit && (
            <motion.p
              className="text-red-600 text-center mb-6 font-medium bg-red-50 p-3 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {errors.submit}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div className="relative group">
              <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <motion.input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-all bg-gray-50 hover:bg-white ${
                  errors.name ? "border-red-500" : ""
                }`}
                style={{ borderColor: errors.name ? "#ef4444" : theme?.colors?.primary || "#ff6600" }}
                placeholder="Ingresa tu nombre"
                variants={inputVariants}
                whileFocus="focus"
                initial="blur"
                animate="blur"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Correo */}
            <div className="relative group">
              <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <motion.input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-all bg-gray-50 hover:bg-white ${
                  errors.email ? "border-red-500" : ""
                }`}
                style={{ borderColor: errors.email ? "#ef4444" : theme?.colors?.primary || "#ff6600" }}
                placeholder="Ingresa tu email"
                variants={inputVariants}
                whileFocus="focus"
                initial="blur"
                animate="blur"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="relative group">
              <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <motion.input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-all bg-gray-50 hover:bg-white ${
                  errors.password ? "border-red-500" : ""
                }`}
                style={{ borderColor: errors.password ? "#ef4444" : theme?.colors?.primary || "#ff6600" }}
                placeholder="Ingresa tu contraseña"
                variants={inputVariants}
                whileFocus="focus"
                initial="blur"
                animate="blur"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Género */}
            <div className="relative group">
              <FiUsers className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-orange-500 transition-colors" />
              <motion.select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-all bg-gray-50 hover:bg-white ${
                  errors.gender ? "border-red-500" : ""
                }`}
                style={{ borderColor: errors.gender ? "#ef4444" : theme?.colors?.primary || "#ff6600" }}
                variants={inputVariants}
                whileFocus="focus"
                initial="blur"
                animate="blur"
              >
                <option value="" disabled>
                  Selecciona tu género
                </option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Otro</option>
              </motion.select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Botón de Registro */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 disabled:bg-gray-400"
              style={{ backgroundColor: loading ? "#9ca3af" : theme?.colors?.primary || "#ff6600" }}
              whileHover={!loading && { scale: 1.05, boxShadow: "0 4px 14px rgba(255, 102, 0, 0.3)" }}
              whileTap={!loading && { scale: 0.95 }}
            >
              {loading ? "Cargando..." : "Registrarse"}
            </motion.button>
          </form>

          {/* Botones Adicionales */}
          <div className="mt-6 flex justify-between gap-4">
            <Link to="/">
              <motion.button
                className="w-full py-2 rounded-xl text-gray-700 font-medium border border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiHome className="text-orange-500" />
                Home
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                className="w-full py-2 rounded-xl text-gray-700 font-medium border border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiLogIn className="text-orange-500" />
                Iniciar Sesión
              </motion.button>
            </Link>
          </div>

          {/* Términos y Condiciones */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Al registrarte, aceptas nuestros{" "}
            <Link to="/terms" className="text-orange-500 hover:underline">
              Términos y Condiciones
            </Link>
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;








