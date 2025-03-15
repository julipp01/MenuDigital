// frontend/src/components/MenuViewer.jsx
import React, { useState, useEffect } from "react";
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
  console.log("[MenuViewer] Renderizando componente con restaurantId:", restaurantId);
  
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [logo, setLogo] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [menuSections, setMenuSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const { socket, isConnected } = useSocket();

  const fetchData = async () => {
    console.log("[MenuViewer] Iniciando fetch de datos para restaurantId:", restaurantId);
    setLoading(true);
    try {
      const menuResponse = await api.get(`/menu/${restaurantId}`);
      console.log("[MenuViewer] Datos recibidos:", menuResponse.data);
      
      const restaurantData = menuResponse.data.restaurant || {};
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(buildImageUrl(restaurantData.logo_url));
      setColors(restaurantData.colors || { primary: "#FF9800", secondary: "#4CAF50" });
      setMenuSections(restaurantData.sections || { "Platos Principales": [], "Postres": [], "Bebidas": [] });
      
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

  useEffect(() => {
    fetchData();
    if (isConnected && socket) {
      console.log("[MenuViewer] WebSocket conectado");
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[MenuViewer] Mensaje recibido por WebSocket:", message);
          if (message.type === "menu-changed") {
            fetchData();
          }
        } catch (error) {
          console.error("[MenuViewer] Error al procesar mensaje WebSocket:", error.message);
        }
      });
    } else {
      console.warn("[MenuViewer] WebSocket no conectado");
    }
  }, [restaurantId, isConnected, socket]);

  return loading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-6 z-20 flex items-center justify-center rounded-b-xl">
        {logo && <img src={logo} alt={restaurantName} className="w-16 h-16 rounded-full shadow-lg mr-4" />}
        <h1 className="text-4xl font-bold text-gray-900" style={{ color: colors.primary }}>{restaurantName}</h1>
      </header>
      <div className="pt-24 pb-12 max-w-6xl mx-auto px-6">
        {Object.entries(menuSections).map(([section, items]) => (
          <div key={section} className="mb-12">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-4 border-indigo-500 pb-2">{section}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter(item => item.category === section).map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl cursor-pointer" onClick={() => setSelectedItem(item)}>
                  {item.image_url.toLowerCase().endsWith(".glb") ? (
                    <ThreeDViewer modelUrl={item.image_url} autoRotate className="w-full h-40 rounded-md" />
                  ) : (
                    <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover rounded-md" onError={(e) => e.target.src = "/default-image.jpg"} />
                  )}
                  <h3 className="text-lg font-semibold mt-4 text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  <span className="text-lg font-bold text-indigo-600">S/. {item.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
          <div className="bg-white p-6 rounded-xl max-w-lg shadow-2xl transform scale-105 transition-all" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{selectedItem.name}</h2>
            {selectedItem.image_url.toLowerCase().endsWith(".glb") ? (
              <ThreeDViewer modelUrl={selectedItem.image_url} autoRotate className="w-full h-60 rounded-md" />
            ) : (
              <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-60 object-cover rounded-md shadow-md" />
            )}
            <p className="text-gray-600 text-sm mt-4">{selectedItem.description}</p>
            <span className="text-lg font-bold text-indigo-600 block mt-2">S/. {selectedItem.price}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuViewer;








