// frontend/src/components/MenuViewer.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import ThreeDViewer from "@/components/ThreeDViewer";
import useSocket from "@/hooks/useSocket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const MenuViewer = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [logo, setLogo] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [menuSections, setMenuSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeSection, setActiveSection] = useState("Más Vendidos");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { socket, isConnected } = useSocket();

  const fetchData = async () => {
    setLoading(true);
    try {
      const menuResponse = await api.get(`/menu/${restaurantId}`);
      const restaurantData = menuResponse.data.restaurant || {};
      
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(restaurantData.logo_url ? `${BACKEND_URL}${restaurantData.logo_url}` : null);
      setColors(restaurantData.colors || { primary: "#FF9800", secondary: "#4CAF50" });
      setMenuSections(restaurantData.sections || { "Platos Principales": [], "Postres": [], "Bebidas": [] });
      setMenuItems(menuResponse.data.items || []);
      setActiveSection("Más Vendidos");
    } catch (error) {
      console.error("[MenuViewer] Error cargando datos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isConnected && socket) {
      socket.on("menu-updated", fetchData);
      return () => socket.off("menu-updated", fetchData);
    }
  }, [restaurantId, isConnected, socket]);

  return loading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white shadow p-6 z-20 flex items-center justify-center">
        {logo && <img src={logo} alt={restaurantName} className="w-16 h-16 rounded-full shadow-lg mr-4" />}
        <h1 className="text-4xl font-extrabold" style={{ color: colors.primary }}>{restaurantName}</h1>
      </header>
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4">
        <nav className="bg-white shadow-md p-3 rounded-lg flex gap-2 overflow-x-auto scrollbar-hide">
          {["Más Vendidos", ...Object.keys(menuSections)].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                activeSection === section ? "text-white bg-indigo-600" : "text-gray-700 bg-gray-200"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
        <section className="mt-6">
          {Object.entries(menuSections).map(([section, items]) => (
            <div key={section} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{section}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.filter(item => item.category === section).map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-4">
                    <img src={BACKEND_URL + item.image_url} alt={item.name} className="w-full h-40 object-cover rounded-md" />
                    <h3 className="text-lg font-semibold mt-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <span className="text-lg font-bold text-indigo-600">S/. {item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default MenuViewer;

