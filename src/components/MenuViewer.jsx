// frontend/src/components/MenuViewer.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import ThreeDViewer from "@/components/ThreeDViewer";
import useSocket from "@/hooks/useSocket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.endsWith("/") 
  ? import.meta.env.VITE_BACKEND_URL
  : `${import.meta.env.VITE_BACKEND_URL}/` || "http://localhost:5000/";

const buildImageUrl = (url) => {
  if (!url) return "/default-image.jpg";
  if (url.startsWith("http")) return url;
  const cleanUrl = url.startsWith("/uploads/") ? url : `/uploads/${url}`;
  return `${BACKEND_URL}${cleanUrl}`.replace(/\/+/g, "/");
};

const MenuViewer = ({ restaurantId }) => {
  if (!restaurantId) {
    console.error("⚠️ restaurantId no está definido");
    return <div className="text-center text-red-600 font-bold">Error: No se encontró el menú</div>;
  }

  console.log("[MenuViewer] Renderizando componente con restaurantId:", restaurantId);
  
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Cargando...");
  const [logo, setLogo] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [menuSections, setMenuSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});
  const { socket, isConnected } = useSocket();
  const scrollTopRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const menuResponse = await api.get(`/menu/${restaurantId}`);
      const restaurantData = menuResponse.data.restaurant || {};
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(buildImageUrl(restaurantData.logo_url));
      setColors(restaurantData.colors || { primary: "#FF9800", secondary: "#4CAF50" });
      setMenuSections(restaurantData.sections || {});
      setActiveSection(Object.keys(restaurantData.sections)[0] || null);
      
      const processedItems = (menuResponse.data.items || []).map((item) => ({
        ...item,
        image_url: buildImageUrl(item.image_url)
      }));
      setMenuItems(processedItems);
    } catch (error) {
      console.error("[MenuViewer] Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => {
    scrollTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addToCart = (item) => {
    setCart((prevCart) => [...prevCart, item]);
    setShowCart(true);
  };

  useEffect(() => {
    fetchData();
    if (isConnected && socket) {
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "menu-changed") {
            fetchData();
          }
        } catch (error) {
          console.error("[MenuViewer] Error al procesar mensaje WebSocket:", error.message);
        }
      });
    }
  }, [restaurantId, isConnected, socket]);

  return loading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
    </div>
  ) : (
    <div ref={scrollTopRef} className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 font-sans relative">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-6 z-20 flex items-center justify-between rounded-b-xl">
        {logo && <img src={logo} alt={restaurantName} className="w-16 h-16 rounded-full shadow-lg" />}
        <h1 className="text-4xl font-bold text-gray-900" style={{ color: colors.primary }}>{restaurantName}</h1>
      </header>
      <div className="pt-24 pb-12 max-w-6xl mx-auto px-6">
        <nav className="bg-white shadow-md rounded-xl p-4 mb-6 flex gap-4 overflow-x-auto scrollbar-hide justify-center">
          {Object.keys(menuSections).map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow hover:scale-110 hover:bg-opacity-90 hover:shadow-lg ${activeSection === section ? "bg-["+colors.primary+"] text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {section}
            </button>
          ))}
        </nav>
        {Object.entries(menuSections).map(([section, items]) => (
          <div key={section} ref={(el) => (sectionRefs.current[section] = el)} className="mb-12">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-4 border-indigo-500 pb-2 transition-all duration-300 hover:scale-105 hover:text-["+colors.primary+"]">{section}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter(item => item.category === section).map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover rounded-md" />
                  <h3 className="text-lg font-semibold mt-4 text-gray-900">{item.name}</h3>
                  <button className="mt-2 px-4 py-2 w-full rounded-lg text-white transition-all duration-200 hover:scale-105 shadow-lg" style={{ backgroundColor: colors.primary }} onClick={(e) => { e.stopPropagation(); addToCart(item); }}>Añadir al pedido</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={scrollToTop} className="fixed bottom-6 right-6 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-900 transition-all">
        ⬆️
      </button>
    </div>
  );
};

export default MenuViewer;














