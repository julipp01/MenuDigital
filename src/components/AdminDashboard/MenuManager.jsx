import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FaQrcode, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import ConfigEditor from "./MenuEditor/ConfigEditor";
import MenuPreview from "./MenuEditor/MenuPreview";
import QRModal from "./MenuEditor/QRModal";
import { MenuSections } from "./MenuEditor/MenuItems";
import { toast } from "react-toastify";

const safeParseJSON = (data, defaultValue) => {
  try {
    return typeof data === "string" ? JSON.parse(data) : data || defaultValue;
  } catch (e) {
    console.error("Error al parsear JSON:", e.message);
    return defaultValue;
  }
};

const normalizeSections = (sections, items) => {
  const sectionsArray = safeParseJSON(sections, []);
  const validItems = Array.isArray(items) ? items.filter(item => item?.id && item?.name) : [];
  const normalized = sectionsArray
    .filter(Boolean)
    .map(section => ({
      section: typeof section === "string" ? section : section.section || "Sin Nombre",
      items: validItems.filter(item => item.category === (typeof section === "string" ? section : section.section)),
    }));
  console.log("[MenuManager] Normalizando secciones - Entrada:", { sections, items }, "Salida:", normalized);
  return normalized;
};

const MenuManager = () => {
  const { restaurantId } = useParams();
  const [restaurantData, setRestaurantData] = useState({
    sections: [],
    items: [],
    name: "",
    logo_url: "",
    colors: { primary: "#F97316", secondary: "#FF9800" },
    fontFamily: "Roboto",
    nameFont: "Lobster",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) {
        setError("ID del restaurante no proporcionado");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [restaurantResponse, itemsResponse, templatesResponse] = await Promise.all([
          api.get(`/restaurantes/${restaurantId}`).catch(err => { throw new Error(`Error al cargar restaurante: ${err.message}`); }),
          api.get(`/restaurantes/${restaurantId}/items`).catch(() => ({ data: [] })),
          api.get(`/restaurantes/${restaurantId}/menu_templates`).catch(() => ({ data: [] })),
        ]);

        const restaurant = restaurantResponse.data || {};
        const items = itemsResponse.data || [];
        const templates = templatesResponse.data || [];
        const sections = normalizeSections(restaurant.sections, items);

        setRestaurantData({
          ...restaurant,
          sections,
          items,
          name: restaurant.name || "",
          logo_url: restaurant.logo_url || "",
          colors: restaurant.colors || { primary: "#F97316", secondary: "#FF9800" },
          fontFamily: restaurant.fontFamily || "Roboto",
          nameFont: restaurant.nameFont || "Lobster",
        });
        setTemplates(templates);
        console.log("[MenuManager] Datos inicial ETHes cargados:", { sections, items });
      } catch (err) {
        setError(err.message || "Error al cargar datos");
        console.error("[MenuManager] Error en fetchData:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const saveConfig = useCallback(async (currentData) => {
    try {
      const payload = { ...currentData, logo_url: currentData.logo_url || null };
      const response = await api.put(`/restaurantes/${restaurantId}`, payload);
      const serverData = response.data;
      console.log("[MenuManager] Respuesta del servidor al guardar:", serverData);

      // Si el servidor no devuelve secciones válidas, preservar las locales
      const serverSections = serverData.restaurant?.sections || serverData.sections || currentData.sections;
      const serverItems = serverData.restaurant?.items || serverData.items || currentData.items;
      const normalizedSections = normalizeSections(serverSections, serverItems);

      return { ...serverData, sections: normalizedSections, items: serverItems };
    } catch (err) {
      console.error("[MenuManager] Error al guardar configuración:", err);
      toast.error("Error al guardar configuración");
      return null;
    }
  }, [restaurantId]);

  const handleAddItem = useCallback((newItem) => {
    setRestaurantData(prev => {
      const updatedItems = [...prev.items, newItem];
      const updatedSections = prev.sections.some(s => s.section === newItem.category)
        ? prev.sections.map(s => s.section === newItem.category ? { ...s, items: [...s.items, newItem] } : s)
        : [...prev.sections, { section: newItem.category, items: [newItem] }];
      const newData = { ...prev, sections: updatedSections, items: updatedItems };
      console.log("[MenuManager] Ítem agregado localmente:", newItem);

      saveConfig(newData).then(serverData => {
        if (serverData) {
          setRestaurantData(prev => ({ ...prev, ...serverData }));
          toast.success("Ítem guardado y sincronizado");
        }
      });

      return newData;
    });
  }, [saveConfig]);

  const handleEditItem = useCallback((sectionName, updatedItem) => {
    setRestaurantData(prev => {
      const updatedItems = prev.items.map(i => i.id === updatedItem.id ? updatedItem : i);
      const updatedSections = prev.sections
        .map(s => s.section === updatedItem.category ? { ...s, items: s.items.map(i => i.id === updatedItem.id ? updatedItem : i) } : s)
        .filter(s => s.items.length);
      const finalSections = updatedSections.some(s => s.section === updatedItem.category)
        ? updatedSections
        : [...updatedSections, { section: updatedItem.category, items: [updatedItem] }];
      const newData = { ...prev, sections: finalSections, items: updatedItems };
      console.log("[MenuManager] Ítem editado localmente:", updatedItem);

      saveConfig(newData).then(serverData => {
        if (serverData) {
          setRestaurantData(prev => ({ ...prev, ...serverData }));
          toast.success("Ítem actualizado y sincronizado");
        }
      });

      return newData;
    });
  }, [saveConfig]);

  const handleDeleteItem = useCallback(async (sectionName, itemId) => {
    try {
      await api.delete(`/restaurantes/${restaurantId}/items/${itemId}`);
      setRestaurantData(prev => {
        const updatedItems = prev.items.filter(i => i.id !== itemId);
        const updatedSections = normalizeSections(prev.sections, updatedItems);
        console.log("[MenuManager] Ítem eliminado localmente:", itemId);
        return { ...prev, sections: updatedSections, items: updatedItems };
      });
      toast.success("Ítem eliminado");
    } catch (err) {
      console.error("[MenuManager] Error al eliminar ítem:", err);
      toast.error("Error al eliminar ítem");
    }
  }, [restaurantId]);

  const handleUpdateSections = useCallback((newSections) => {
    setRestaurantData(prev => {
      const newData = { ...prev, sections: newSections };
      console.log("[MenuManager] Secciones actualizadas localmente:", newSections);

      saveConfig(newData).then(serverData => {
        if (serverData) {
          setRestaurantData(prev => ({ ...prev, ...serverData }));
          toast.success("Secciones sincronizadas");
        }
      });

      return newData;
    });
  }, [saveConfig]);

  const handleOpenQRModal = useCallback(async () => {
    const serverData = await saveConfig(restaurantData);
    if (serverData) {
      setRestaurantData(prev => ({ ...prev, ...serverData }));
      setIsQRModalOpen(true);
    }
  }, [saveConfig, restaurantData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><FaSpinner size={40} className="animate-spin text-gray-600" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  const colors = restaurantData.colors || { primary: "#F97316", secondary: "#FF9800" };

  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex flex-col"
      style={{ fontFamily: restaurantData.fontFamily }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <motion.header
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 border-t-4 sticky top-0 z-10"
          style={{ borderColor: colors.primary }}
        >
          <h2
            className="text-xl sm:text-2xl font-bold truncate"
            style={{ color: colors.primary, fontFamily: restaurantData.nameFont }}
          >
            {restaurantData.name || "Gestión del Menú"}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <motion.button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPreviewOpen ? <FaEyeSlash /> : <FaEye />} {isPreviewOpen ? "Ocultar" : "Previa"}
            </motion.button>
            <motion.button
              onClick={handleOpenQRModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaQrcode /> QR
            </motion.button>
          </div>
        </motion.header>

        {!isPreviewOpen ? (
          <div className="flex flex-col lg:flex-row gap-6 w-full">
            <div className="lg:w-1/3 w-full">
              <ConfigEditor
                restaurantId={restaurantId}
                restaurantData={restaurantData}
                onUpdate={setRestaurantData}
                saveConfig={saveConfig}
                isLoading={loading}
                setIsLoading={setLoading}
                nameFont={restaurantData.nameFont}
                setNameFont={(font) => setRestaurantData(prev => ({ ...prev, nameFont: font }))}
              />
            </div>
            <div className="lg:w-2/3 w-full">
              <MenuSections
                sections={restaurantData.sections}
                restaurantId={restaurantId}
                fontFamily={restaurantData.fontFamily}
                colors={colors}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onEditItem={handleEditItem}
                onUpdateSections={handleUpdateSections}
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-[calc(100vh-120px)]"
          >
            <MenuPreview restaurantData={{ ...restaurantData, colors }} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isQRModalOpen && (
          <QRModal
            show={isQRModalOpen}
            restaurantId={restaurantId}
            restaurantData={restaurantData}
            onClose={() => setIsQRModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuManager;