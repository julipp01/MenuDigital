// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useModulesConfig } from "../hooks/useModulesConfig";
import { useState, useEffect } from "react";
import * as Icons from "react-icons/fi";
import { FiMenu, FiLogOut, FiSettings } from "react-icons/fi";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const { modules, loading, error } = useModulesConfig(user?.role?.toLowerCase() || "free");

  useEffect(() => {
    const handleResize = () => setIsOpen(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getModulePath = (module) => {
    if (!module.path) return "";

    // Paso 1: Limpieza básica del path
    let cleanPath = module.path
      .replace(/^\/+|\/+$/g, '')  // Elimina barras al inicio/final
      .replace('dashboard/', '')   // Elimina dashboard/ si ya está presente
      .replace('dashboard-home', 'home');  // Normaliza nombre

    // Paso 2: Manejo de rutas especiales
    if (cleanPath.includes(":restaurantId")) {
      return user?.restaurantId 
        ? `/dashboard/restaurantes/${user.restaurantId}/menu`
        : "";
    }

    // Paso 3: Construcción final del path
    return `/dashboard/${cleanPath}`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#222222] text-[#ffffff] transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } overflow-y-auto max-h-screen scrollbar-hide`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white text-2xl p-3 focus:outline-none"
        aria-label="Toggle menu"
      >
        <FiMenu />
      </button>

      <nav className="flex-grow p-2">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading modules...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">Error: {error}</p>
        ) : (
          <div className="space-y-2">
            {modules.map((module) => {
              const IconComponent = Icons[module.icon] || FiSettings;
              const fullPath = getModulePath(module);

              if (!fullPath) return null;

              return (
                <Link
                  key={module.id}
                  to={getModulePath(module)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                    location.pathname === getModulePath(module)
                      ? "bg-[#f7f7f7] text-[#222222]"
                      : "hover:bg-[#333333]"
                  }`}
                >
                  <span className="text-xl">
                    <IconComponent />
                  </span>
                  <span className={`${isOpen ? "block" : "hidden"} text-sm`}>
                    {module.module_name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 mt-6 rounded-md hover:bg-[#333333] transition-all w-full"
      >
        <span className="text-xl">
          <FiLogOut />
        </span>
        <span className={`${isOpen ? "block" : "hidden"} text-sm`}>Log Out</span>
      </button>
    </aside>
  );
};

export default Sidebar;







