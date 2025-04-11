import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WEB_NAME } from "../../config";
import MiniNavbar from "../common/MiniNavbar";
import Sidebar from "../Sidebar";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const colors = {
    primary: "#ff4500",
    secondary: "#333333",
    text: "#ffffff",
    contentText: "#333333",
    hover: "#444444",
    active: "#555555",
    background: "#f7f7f7",
  };

  useEffect(() => {
    // Verificar autenticación
    if (!user) {
      navigate("/login");
      return;
    }

    // Actualizar título del documento
    const userName = user?.name || "Usuario";
    const userEmail = user?.email || "correo@ejemplo.com";
    document.title = `${userName} - ${userEmail}`;
    console.log("Título actualizado:", document.title);
    console.log("Datos del usuario:", { name: userName, email: userEmail });

    // Manejar el tamaño de la pantalla
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 768;
      setIsSidebarOpen(isLargeScreen);
    };

    // Establecer estado inicial y escuchar cambios de tamaño
    handleResize();
    window.addEventListener("resize", handleResize);

    // Limpieza del evento
    return () => window.removeEventListener("resize", handleResize);
  }, [user, navigate]);

  // Ajustar padding según el estado del sidebar
  const contentPadding = isSidebarOpen ? "pl-64" : "pl-20";

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Sidebar */}
      <Sidebar setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

      {/* Contenido principal */}
      <div className={`flex-1 transition-all duration-300 ${contentPadding}`}>
        {/* MiniNavbar */}
        <motion.div
          className="fixed top-0 left-0 w-full z-40 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MiniNavbar />
        </motion.div>

        {/* Área principal */}
        <main
          className="pt-14 p-4 md:p-6 min-h-[calc(100vh-56px)] overflow-y-auto"
          style={{ backgroundColor: colors.background }}
        >
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
























































