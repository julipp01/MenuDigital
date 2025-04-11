import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaTimes, FaHome } from "react-icons/fa";
import api, { fetchPublicMenu } from "@/services/api";
import ThreeDViewer from "@/components/ThreeDViewer";

const ItemCard = React.memo(({ item, fontFamily, colors, onAddToCart, onViewDetails, cartItems }) => {
  const quantityInCart = cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0;
  const is3DModel = item.image_url?.endsWith('.glb');

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onViewDetails(item)}
    >
      {is3DModel ? (
        <div className="w-full h-48 rounded-t-2xl overflow-hidden">
          <ThreeDViewer
            modelUrl={item.image_url}
            scale={[0.8, 0.8, 0.8]}
            backgroundColor="#f9fafb"
            autoRotate={true}
            onError={() => console.error(`Error cargando modelo 3D para ${item.name}`)}
          />
        </div>
      ) : (
        <img
          src={item.image_url || "/placeholder-image.png"}
          alt={item.name}
          className="w-full h-48 object-cover rounded-t-2xl"
          onError={(e) => (e.target.src = "/placeholder-image.png")}
        />
      )}
      <div className="p-4">
        <p className="text-lg font-bold truncate" style={{ fontFamily, color: colors.primary }}>{item.name}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1" style={{ fontFamily }}>{item.description || "Sin descripción"}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-lg font-semibold" style={{ color: colors.secondary }}>S/. {Number(item.price).toFixed(2)}</span>
          {quantityInCart > 0 ? (
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full" style={{ color: colors.primary }}>
              {quantityInCart} en carrito
            </span>
          ) : (
            <motion.button
              onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
              className="px-4 py-1 text-white rounded-full text-sm"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
              whileHover={{ scale: 1.1 }}
            >
              <FaPlus size={12} /> Añadir
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const ItemDetailModal = ({ item, onClose, onAddToCart, onRemoveFromCart, cartItems, colors, fontFamily }) => {
  const quantityInCart = cartItems.find(cartItem => cartItem.id === item.id)?.quantity || 0;
  const is3DModel = item.image_url?.endsWith('.glb');

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-bold" style={{ color: colors.primary, fontFamily }}>{item.name}</h4>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }}><FaTimes size={20} /></motion.button>
        </div>
        {is3DModel ? (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-4">
            <ThreeDViewer
              modelUrl={item.image_url}
              scale={[1, 1, 1]}
              backgroundColor="#f9fafb"
              autoRotate={true}
              ar
            />
          </div>
        ) : (
          <img src={item.image_url || "/placeholder-image.png"} alt={item.name} className="w-full h-64 object-cover rounded-xl mb-4" />
        )}
        <p className="text-sm text-gray-600 mb-4" style={{ fontFamily }}>{item.description || "Sin descripción"}</p>
        <p className="text-xl font-bold mb-4" style={{ color: colors.secondary }}>S/. {Number(item.price).toFixed(2)}</p>
        <div className="flex items-center gap-4">
          {quantityInCart > 0 ? (
            <div className="flex items-center gap-3">
              <motion.button onClick={() => onRemoveFromCart(item)} className="p-2 bg-gray-200 rounded-full" whileHover={{ scale: 1.1 }}>
                <FaMinus size={16} />
              </motion.button>
              <span className="text-lg">{quantityInCart}</span>
              <motion.button onClick={() => onAddToCart(item)} className="p-2 bg-gray-200 rounded-full" whileHover={{ scale: 1.1 }}>
                <FaPlus size={16} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={() => onAddToCart(item)}
              className="px-6 py-2 text-white rounded-full text-lg"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
              whileHover={{ scale: 1.05 }}
            >
              Añadir al carrito
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const MenuPreview = React.memo(({ restaurantData: propRestaurantData }) => {
  const { restaurantId } = useParams();
  const [restaurantData, setRestaurantData] = useState(propRestaurantData || null);
  const [loading, setLoading] = useState(!propRestaurantData);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const normalizeSections = useCallback((sections) => {
    console.log("Normalizando - Secciones crudas:", sections);

    const sectionsArray = Array.isArray(sections) ? sections : [];
    const normalized = sectionsArray
      .filter(section => section && (typeof section === "string" || section.section))
      .map(section => {
        const sectionName = typeof section === "string" ? section : section.section || "Sin Nombre";
        const sectionItems = Array.isArray(section.items) ? section.items.filter(item => item?.id && item?.name) : [];
        return {
          section: sectionName,
          items: sectionItems,
        };
      });

    console.log("Secciones normalizadas:", normalized);
    return normalized.length ? normalized : [{ section: "Menú", items: [] }];
  }, []);

  const fetchRestaurantData = useCallback(async () => {
    if (!propRestaurantData && restaurantId) {
      try {
        setLoading(true);
        const restaurant = await fetchPublicMenu(restaurantId);
        console.log("Datos crudos del restaurante desde fetchPublicMenu:", restaurant);

        if (!restaurant?.id) throw new Error("Datos del restaurante no válidos");

        const sections = normalizeSections(restaurant.sections || []);
        const finalData = {
          id: restaurant.id,
          name: restaurant.name || "Menú sin nombre",
          logo_url: restaurant.logo_url || "/placeholder-image.png",
          colors: restaurant.colors || { primary: "#FF9800", secondary: "#4CAF50" },
          fontFamily: restaurant.fontFamily || "Roboto",
          nameFont: restaurant.nameFont || "Roboto",
          sections,
          items: restaurant.items || [], // Mantenemos esto por compatibilidad con MenuManager
        };

        setRestaurantData(finalData);
        console.log("Datos aplicados en MenuPreview:", finalData);
      } catch (err) {
        setError("No se pudo cargar el menú: " + (err.message || "Error desconocido"));
        console.error("Error en fetchRestaurantData:", err);
      } finally {
        setLoading(false);
      }
    } else if (propRestaurantData) {
      const sections = normalizeSections(propRestaurantData.sections || []);
      setRestaurantData({ ...propRestaurantData, sections });
      setLoading(false);
    }
  }, [propRestaurantData, restaurantId, normalizeSections]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  const colors = restaurantData?.colors || { primary: "#FF9800", secondary: "#4CAF50" };
  const fontFamily = restaurantData?.fontFamily || "Roboto";
  const nameFont = restaurantData?.nameFont || fontFamily;
  const name = restaurantData?.name || "Mi Restaurante";
  const logo_url = restaurantData?.logo_url || "/placeholder-image.png";
  const sections = restaurantData?.sections || [];

  const handleAddToCart = useCallback((item) => {
    setCartItems(prev => prev.some(i => i.id === item.id)
      ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { ...item, quantity: 1 }]);
  }, []);

  const handleRemoveFromCart = useCallback((item) => {
    setCartItems(prev => prev.map(i => i.id === item.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  }, []);

  const handleViewDetails = useCallback((item) => setSelectedItem(item), []);
  const handleCloseDetails = useCallback(() => setSelectedItem(null), []);
  const handleOrder = useCallback(() => {
    alert("¡Pedido confirmado!");
    setCartItems([]);
    setIsCartOpen(false);
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-600" style={{ fontFamily }}>Cargando...</div>;
  if (error) return <div className="text-center py-20 text-red-600" style={{ fontFamily }}>{error}</div>;

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10), #f9fafb`, fontFamily }}>
      <motion.header
        className="bg-white shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-20 border-b-4"
        style={{ borderColor: colors.primary }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={logo_url} alt={name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 object-cover" style={{ borderColor: colors.primary }} />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: colors.primary, fontFamily: nameFont }}>{name}</h1>
        </div>
        <div className="flex gap-3 sm:gap-4 mt-3 sm:mt-0">
          <motion.button className="p-2 rounded-full bg-gray-100" style={{ color: colors.primary }} whileHover={{ scale: 1.1 }}>
            <FaHome size={16} />
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r text-white rounded-lg text-sm"
            style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
            onClick={() => setIsCartOpen(!isCartOpen)}
            whileHover={{ scale: 1.05 }}
          >
            <FaShoppingCart size={16} /> {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </motion.button>
        </div>
      </motion.header>

      <motion.nav
        className="bg-white shadow-md py-3 sm:py-4 px-4 sm:px-6 sticky top-[calc(4rem+4px)] sm:top-[calc(5rem+4px)] z-10 border-b"
        style={{ borderColor: colors.primary }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto overflow-x-auto">
          <motion.button onClick={() => setSelectedSection(prev => Math.max(0, prev - 1))} disabled={selectedSection === 0} className="p-2 disabled:opacity-50" style={{ color: colors.primary }}>
            <FaChevronLeft size={16} />
          </motion.button>
          <div className="flex gap-2 sm:gap-3 px-2 whitespace-nowrap">
            {sections.map((sectionData, index) => (
              <motion.button
                key={sectionData.section || `section-${index}`}
                className="px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold"
                style={{
                  background: selectedSection === index ? colors.primary : "white",
                  color: selectedSection === index ? "white" : colors.primary,
                  border: `2px solid ${colors.primary}`,
                }}
                onClick={() => setSelectedSection(index)}
                whileHover={{ scale: 1.05 }}
              >
                {sectionData.section}
              </motion.button>
            ))}
          </div>
          <motion.button onClick={() => setSelectedSection(prev => Math.min(sections.length - 1, prev + 1))} disabled={selectedSection === sections.length - 1} className="p-2 disabled:opacity-50" style={{ color: colors.primary }}>
            <FaChevronRight size={16} />
          </motion.button>
        </div>
      </motion.nav>

      <motion.div className="flex-1 w-full p-4 sm:p-6 lg:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {sections.length ? (
          <AnimatePresence mode="wait">
            <motion.div key={selectedSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6" style={{ color: colors.primary, fontFamily }}>{sections[selectedSection].section}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {sections[selectedSection].items.length ? (
                  sections[selectedSection].items.map(item => (
                    <ItemCard
                      key={item.id || item.name}
                      item={item}
                      fontFamily={fontFamily}
                      colors={colors}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                      cartItems={cartItems}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6 col-span-full" style={{ fontFamily }}>No hay ítems en esta sección.</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-gray-500 text-center py-6" style={{ fontFamily }}>No hay secciones disponibles.</p>
        )}
      </motion.div>

      <AnimatePresence>
        {isCartOpen && cartItems.length > 0 && (
          <motion.div
            className="fixed bottom-4 right-4 w-full sm:w-80 max-h-[50vh] overflow-y-auto p-4 bg-white rounded-lg shadow-lg z-30"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: 20 }}
          >
            <h5 className="text-base sm:text-lg font-bold" style={{ color: colors.primary, fontFamily }}>Carrito</h5>
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between py-2 text-sm">
                <span style={{ fontFamily }}>{item.name} x{item.quantity}</span>
                <span style={{ color: colors.secondary }}>S/. {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <motion.button
              onClick={handleOrder}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r text-white rounded-lg text-sm"
              style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
              whileHover={{ scale: 1.05 }}
            >
              Confirmar Pedido
            </motion.button>
          </motion.div>
        )}
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            onClose={handleCloseDetails}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            cartItems={cartItems}
            colors={colors}
            fontFamily={fontFamily}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default MenuPreview;