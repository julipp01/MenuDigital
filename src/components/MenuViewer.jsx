// frontend/src/components/MenuViewer.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import ThreeDViewer from "@/components/ThreeDViewer";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.18.22:5000";

const MenuViewer = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [logo, setLogo] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [menuSections, setMenuSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tabsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const menuResponse = await api.get(`/menu/${restaurantId}`);
        console.log("Respuesta de /menu:", menuResponse.data);

        const restaurantData = menuResponse.data.restaurant || {};
        setRestaurantName(restaurantData.name || "Mi Restaurante");
        setLogo(restaurantData.logo_url || null);
        setColors(restaurantData.colors || { primary: "#FF9800", secondary: "#4CAF50" });
        const loadedSections = restaurantData.sections || { "Platos Principales": [], "Postres": [], "Bebidas": [] };
        setMenuSections(loadedSections);
        setActiveSection("Más Vendidos"); // Sección inicial

        const items = (menuResponse.data.items || []).map((item) => ({
          ...item,
          image_url: item.image_url && item.image_url.startsWith("http") ? item.image_url.replace(BACKEND_URL, "") : item.image_url,
          category: item.category || "Platos Principales"
        }));
        setMenuItems(items);
      } catch (error) {
        console.error("[MenuViewer] Error cargando datos:", error.response?.data || error.message);
        setMenuSections({ "Platos Principales": [], "Postres": [], "Bebidas": [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const openItemDetails = (item) => setSelectedItem(item);
  const closeItemDetails = () => setSelectedItem(null);

  const scrollToSection = (section) => {
    setActiveSection(section);
    document.getElementById(section.replace(/\s+/g, "-").toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  // Simulación de platos más vendidos (puedes ajustar esto con datos reales)
  const topItems = menuItems.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Encabezado */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-xl p-6 z-20">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center mb-2">
            {logo && (
              <img
                src={BACKEND_URL + logo}
                alt={restaurantName}
                className="w-16 h-16 rounded-full shadow-lg mr-4"
                onError={(e) => (e.target.src = "/fallback-logo.png")}
              />
            )}
            <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: colors.primary }}>
              {restaurantName}
            </h1>
          </div>
          {/* Reseñas y valoración */}
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.074 9.397c-.784-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 text-sm font-medium">
              4.8 (120 reseñas)
            </span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pestañas */}
        <nav
          ref={tabsRef}
          className={`fixed left-0 right-0 top-20 bg-white shadow-lg z-10 transition-all duration-300 ${
            isMenuOpen ? "block" : "hidden md:block"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex md:flex-row flex-col gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => scrollToSection("Más Vendidos")}
              className={`flex-shrink-0 px-6 py-2 text-base font-semibold rounded-full shadow-md transition-all duration-200 ${
                activeSection === "Más Vendidos"
                  ? "text-white scale-105"
                  : "text-gray-700 hover:text-white hover:bg-opacity-90"
              }`}
              style={{
                backgroundColor: activeSection === "Más Vendidos" ? colors.primary : colors.primary + "20",
              }}
            >
              Más Vendidos
            </button>
            {Object.keys(menuSections).map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`flex-shrink-0 px-6 py-2 text-base font-semibold rounded-full shadow-md transition-all duration-200 ${
                  activeSection === section
                    ? "text-white scale-105"
                    : "text-gray-700 hover:text-white hover:bg-opacity-90"
                }`}
                style={{
                  backgroundColor: activeSection === section ? colors.primary : colors.primary + "20",
                }}
              >
                {section}
              </button>
            ))}
          </div>
        </nav>

        {/* Botón de menú en móviles */}
        <button
          className="fixed top-20 right-4 md:hidden p-3 bg-white rounded-full shadow-lg z-20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Sección de Platos Más Vendidos */}
        <section id="mas-vendidos" className="mb-16 mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Más Vendidos</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {topItems.map((item) => {
              const imageSrc = item.image_url || item.imageUrl;
              return (
                <li
                  key={item.id || item.name}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                  onClick={() => openItemDetails(item)}
                >
                  <div className="relative">
                    {imageSrc ? (
                      imageSrc.endsWith(".glb") ? (
                        <div className="w-full h-48">
                          <ThreeDViewer modelUrl={BACKEND_URL + imageSrc} autoRotate={true} />
                        </div>
                      ) : (
                        <img
                          src={BACKEND_URL + imageSrc}
                          alt={item.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => (e.target.src = "/fallback-image.png")}
                        />
                      )
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500">
                        Sin Imagen
                      </div>
                    )}
                    <span
                      className="absolute top-2 right-2 px-3 py-1 text-sm font-medium text-white rounded-full shadow"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      S/. {item.price}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xl font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Otras secciones */}
        <main className="mt-8">
          {Object.keys(menuSections).map((section) => (
            <section
              key={section}
              id={section.replace(/\s+/g, "-").toLowerCase()}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6">{section}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {menuItems
                  .filter((item) => item.category === section)
                  .map((item) => {
                    const imageSrc = item.image_url || item.imageUrl;
                    return (
                      <li
                        key={item.id || item.name}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
                        onClick={() => openItemDetails(item)}
                      >
                        <div className="relative">
                          {imageSrc ? (
                            imageSrc.endsWith(".glb") ? (
                              <div className="w-full h-48">
                                <ThreeDViewer modelUrl={BACKEND_URL + imageSrc} autoRotate={true} />
                              </div>
                            ) : (
                              <img
                                src={BACKEND_URL + imageSrc}
                                alt={item.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => (e.target.src = "/fallback-image.png")}
                              />
                            )
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500">
                              Sin Imagen
                            </div>
                          )}
                          <span
                            className="absolute top-2 right-2 px-3 py-1 text-sm font-medium text-white rounded-full shadow"
                            style={{ backgroundColor: colors.secondary }}
                          >
                            S/. {item.price}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-xl font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </main>
      </div>

      {/* Modal de detalles */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
          onClick={closeItemDetails}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-102"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: colors.primary }}>
                {selectedItem.name}
              </h3>
              <button
                onClick={closeItemDetails}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            {selectedItem.image_url ? (
              selectedItem.image_url.endsWith(".glb") ? (
                <div className="w-full h-80">
                  <ThreeDViewer modelUrl={BACKEND_URL + selectedItem.image_url} autoRotate={true} />
                </div>
              ) : (
                <img
                  src={BACKEND_URL + selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-80 object-cover rounded-xl mb-6"
                  onError={(e) => (e.target.src = "/fallback-image.png")}
                />
              )
            ) : (
              <div className="w-full h-80 flex items-center justify-center bg-gray-200 rounded-xl text-gray-500">
                Sin Imagen
              </div>
            )}
            <p className="text-gray-700 text-base mb-6">{selectedItem.description}</p>
            <p className="text-xl font-semibold" style={{ color: colors.secondary }}>
              S/. {selectedItem.price}
            </p>
            <button
              onClick={() => alert(`Añadido al pedido: ${selectedItem.name}`)}
              className="mt-6 w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 text-lg font-medium"
            >
              Añadir al Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuViewer;