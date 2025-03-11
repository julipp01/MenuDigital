import React from "react";
import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { GiKnifeFork } from "react-icons/gi";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHome from "./AdminDashboard/DashboardHome";
import MenuManager from "./AdminDashboard/MenuManager";
import Analytics from "./AdminDashboard/Analytics";
import QRGenerator from "./AdminDashboard/QRGenerator";
import UpdatePlan from "./AdminDashboard/UpdatePlan";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirigir si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hasAccess = (allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 font-sans">
      <nav className="bg-white shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }} className="text-orange-600">
              <GiKnifeFork className="text-4xl" />
            </motion.div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Panel Administrativo
            </span>
          </div>

          <div className="flex space-x-6">
            <Link to="dashboard" className="text-gray-800 font-medium hover:text-orange-600 transition">
              Inicio
            </Link>
            {hasAccess(["plata", "oro", "premium", "admin"]) && (
              <Link to="menu" className="text-gray-800 font-medium hover:text-orange-600 transition">
                Gestión del Menú
              </Link>
            )}
            {hasAccess(["oro", "premium", "admin"]) && (
              <Link to="analytics" className="text-gray-800 font-medium hover:text-orange-600 transition">
                Análisis
              </Link>
            )}
            <Link to="qr" className="text-gray-800 font-medium hover:text-orange-600 transition">
              Generador de QR
            </Link>
            {user.role !== "admin" && (
              <Link to="update-plan" className="text-gray-800 font-medium hover:text-orange-600 transition">
                Actualizar Plan
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-800 font-medium">
              {user.name} ({user.email})
            </span>
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "#D4AF37", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-600 text-white px-6 py-2 rounded-full shadow-md transition duration-300 font-semibold"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              Cerrar Sesión
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-6">
        <Routes>
          <Route path="dashboard" element={<DashboardHome />} />
          {hasAccess(["plata", "oro", "premium", "admin"]) && (
            <Route path="menu" element={<MenuManager />} />
          )}
          {hasAccess(["oro", "premium", "admin"]) && (
            <Route path="analytics" element={<Analytics />} />
          )}
          <Route path="qr" element={<QRGenerator />} />
          <Route path="update-plan" element={<UpdatePlan />} />
          <Route path="*" element={<Navigate to="dashboard" />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;






