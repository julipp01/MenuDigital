import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaQrcode, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "@/services/api";
import ConfigEditor from "./MenuEditor/ConfigEditor";
import MenuSections from "./MenuEditor/MenuSections";
import MenuPreview from "./MenuEditor/MenuPreview";
import QRModal from "./MenuEditor/QRModal";
import ItemModal from "./MenuEditor/ItemModal";

const MenuManager = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState("add"); // "add" o "edit"
  const [editItem, setEditItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [nameFont, setNameFont] = useState("Lobster"); // Valor inicial igual que en ConfigEditor

  // Cargar datos iniciales del restaurante
  useEffect(() => {
    if (!restaurantId || restaurantId === "0") {
      setError("ID de restaurante inválido.");
      setLoading(false);
      return;
    }
    const fetchRestaurantData = async () => {
      try {
        const [restaurantResponse, itemsResponse] = await Promise.all([
          api.get(`/restaurantes/${restaurantId}`),
          api.get(`/restaurantes/${restaurantId}/items`),
        ]);
        const restaurant = restaurantResponse.data;
        const items = itemsResponse.data;
        const uniqueCategories = [...new Set(items.map((item) => item.category))];
        const colors = typeof restaurant.colors === "string"
          ? JSON.parse(restaurant.colors)
          : restaurant.colors || { primary: "#F97316", secondary: "#FF9800" };
        const sections = Array.isArray(restaurant.sections)
          ? restaurant.sections
          : typeof restaurant.sections === "string"
          ? JSON.parse(restaurant.sections)
          : [];
        setRestaurantData({
          ...restaurant,
          sections,
          categories: uniqueCategories.length > 0 ? uniqueCategories : restaurant.categories || [],
          colors,
          fontFamily: restaurant.fontFamily || "Roboto",
          templateId: restaurant.templateId || null,
        });
      } catch (error) {
        setError("No se pudo conectar al servidor. Por favor, revisa tu conexión o intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantData();
  }, [restaurantId]);

  // Funciones para manejar ítems
  const handleAddItem = (newItem) => {
    const updatedSections = restaurantData.sections.some((s) => s.section === newItem.category)
      ? restaurantData.sections.map((section) =>
          section.section === newItem.category
            ? { ...section, items: [...section.items, newItem] }
            : section
        )
      : [...restaurantData.sections, { section: newItem.category, items: [newItem] }];
    setRestaurantData((prev) => ({
      ...prev,
      sections: updatedSections,
      categories: [...new Set([...prev.categories, newItem.category])],
    }));
  };

  const handleEditItem = (sectionName, item) => {
    setEditItem({ ...item, section: sectionName });
    setItemModalMode("edit");
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (itemModalMode === "add") {
        const response = await api.post(`/restaurantes/${restaurantId}/items`, itemData);
        const newItem = { ...itemData, id: response.data.id };
        handleAddItem(newItem);
      } else if (itemModalMode === "edit") {
        const response = await api.put(`/restaurantes/${restaurantId}/items/${itemData.id}`, itemData);
        const updatedSections = restaurantData.sections.map((section) =>
          section.section === itemData.section
            ? {
                ...section,
                items: section.items.map((item) =>
                  item.id === itemData.id ? response.data : item
                ),
              }
            : section.section === editItem.section && section.section !== itemData.section
            ? { ...section, items: section.items.filter((item) => item.id !== itemData.id) }
            : section
        );
        if (!updatedSections.some((s) => s.section === itemData.section)) {
          updatedSections.push({ section: itemData.section, items: [response.data] });
        }
        setRestaurantData((prev) => ({
          ...prev,
          sections: updatedSections,
          categories: [...new Set([...prev.categories, itemData.section])],
        }));
      }
      setIsItemModalOpen(false);
    } catch (error) {
      console.error("Error al guardar ítem:", error);
      setError("No se pudo guardar el ítem. Intenta de nuevo.");
    }
  };

  const handleDeleteItem = async (sectionName, itemId) => {
    try {
      await api.delete(`/restaurantes/${restaurantId}/items/${itemId}`);
      setRestaurantData((prev) => ({
        ...prev,
        sections: prev.sections.map((section) =>
          section.section === sectionName
            ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
            : section
        ),
      }));
    } catch (error) {
      console.error("Error al eliminar ítem:", error);
      setError("No se pudo eliminar el ítem. Intenta de nuevo.");
    }
  };

  const handleLogoUpload = (logoUrl) => {
    setRestaurantData((prev) => ({ ...prev, logo_url: logoUrl }));
  };

  const setRestaurantName = (name) => {
    setRestaurantData((prev) => ({ ...prev, name }));
  };

  const setColors = (colors) => {
    setRestaurantData((prev) => ({ ...prev, colors }));
  };

  const setFontFamily = (fontFamily) => {
    setRestaurantData((prev) => ({ ...prev, fontFamily }));
  };

  const setTemplateId = (templateId) => {
    setRestaurantData((prev) => ({ ...prev, templateId }));
  };

  const saveConfig = async () => {
    try {
      const payload = {
        name: restaurantData.name || "Sin Nombre",
        logo: restaurantData.logo_url || null,
        colors: restaurantData.colors || { primary: "#F97316", secondary: "#FF9800" },
        sections: restaurantData.sections || [],
        templateId: restaurantData.templateId || null,
        fontFamily: restaurantData.fontFamily || "Roboto",
      };
      await api.put(`/restaurantes/${restaurantId}`, payload);
    } catch (error) {
      setError("Error al guardar la configuración. Por favor, intenta de nuevo.");
    }
  };

  if (loading) return <div className="text-center text-gray-600 py-10">Cargando datos...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 md:p-8"
      style={{ fontFamily: restaurantData?.fontFamily || "Roboto" }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.header className="bg-white p-4 md:p-6 rounded-xl shadow-lg text-center">
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ 
              color: restaurantData?.colors?.primary || "#F97316",
              fontFamily: nameFont // Usa la fuente del estado
            }}
          >
            {restaurantData?.name || "Gestión del Menú"}
          </h2>
        </motion.header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ConfigEditor (Menu Editor) */}
          <div className="lg:w-1/3 w-full p-4 md:p-6 bg-white rounded-xl shadow-lg">
            <ConfigEditor
              restaurantId={restaurantId}
              restaurantName={restaurantData.name || ""}
              setRestaurantName={setRestaurantName}
              logo={restaurantData.logo_url || ""}
              handleLogoUpload={handleLogoUpload}
              initialFontFamily={restaurantData.fontFamily || "Roboto"}
              initialColors={restaurantData.colors || { primary: "#F97316", secondary: "#FF9800" }}
              setColors={setColors}
              setTemplateId={setTemplateId}
              setFontFamily={setFontFamily}
              initialCategories={restaurantData.categories || []}
              initialTemplateId={restaurantData.templateId || null}
              setRestaurantData={setRestaurantData}
              nameFont={nameFont} // Pasa el valor actual
              setNameFont={setNameFont} // Pasa el setter
            />
          </div>

          {/* MenuSections */}
          <div className="lg:w-2/3 w-full p-4 md:p-6 bg-white rounded-xl shadow-lg relative">
            <MenuSections
              sections={restaurantData?.sections || []}
              restaurantId={restaurantId}
              onAddItem={() => {
                setItemModalMode("add");
                setIsItemModalOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              onEditItem={handleEditItem}
            />
          </div>
        </div>

        {/* Botón para vista previa */}
        <motion.div className="flex justify-center">
          <motion.button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPreviewOpen ? <FaEyeSlash /> : <FaEye />}
            {isPreviewOpen ? "Ocultar Vista Previa" : "Mostrar Vista Previa"}
          </motion.button>
        </motion.div>

        {/* Vista Previa en Drawer */}
        {isPreviewOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full md:w-1/2 lg:w-1/3 h-full bg-white shadow-lg p-6 overflow-y-auto z-50"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vista Previa</h3>
            <MenuPreview restaurantData={restaurantData} />
            <motion.button
              onClick={() => setIsPreviewOpen(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cerrar
            </motion.button>
          </motion.div>
        )}

        {/* Botón para QR */}
        <motion.button
          onClick={() => setIsQRModalOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full text-white shadow-lg"
          style={{ backgroundColor: restaurantData?.colors?.primary || "#F97316" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaQrcode size={24} />
        </motion.button>

        {/* Modales */}
        {isQRModalOpen && (
          <QRModal
            restaurantId={restaurantId}
            onClose={() => setIsQRModalOpen(false)}
            colors={restaurantData?.colors || {}}
          />
        )}

        {isItemModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-xl w-full md:w-1/2 h-[90vh] overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ItemModal
                show={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                item={itemModalMode === "edit" ? editItem : null}
                onSave={handleSaveItem}
                categories={restaurantData?.categories || []}
                mode={itemModalMode}
                restaurantId={restaurantId}
                sections={restaurantData?.sections || []}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MenuManager;








