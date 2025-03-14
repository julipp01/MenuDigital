import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const { register, error: authError } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    console.log(`[REGISTER] Cambio de campo: ${e.target.name} -> ${e.target.value}`);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);

    try {
      console.log("[REGISTER] Enviando formulario con datos:", formData);
      await register(formData); // El registro ahora autentica automáticamente y redirige
      console.log("[REGISTER] Registro exitoso");
    } catch (err) {
      console.error("[REGISTER] Error durante el registro:", err);
      setLocalError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 font-sans">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Registrarse</h2>
        {localError && <p className="text-red-500 text-center mb-4">{localError}</p>}
        {authError && <p className="text-red-500 text-center mb-4">{authError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-800 font-medium mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-800 font-medium mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-800 font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Tu contraseña"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#D4AF37" }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full bg-orange-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Cargando..." : "Registrarse"}
          </motion.button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;





