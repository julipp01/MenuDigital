import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import predefinedTemplates from './templates.json';

const MenuTemplates = ({ restaurantId, onTemplateSelected }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [restaurantName, setRestaurantName] = useState("");
  const [logo, setLogo] = useState(null);
  const [menuSections, setMenuSections] = useState({
    "Platos Principales": [],
    "Postres": [],
    "Bebidas": [],
  });
  const [loading, setLoading] = useState(false);
  const BASE_URL = "http://localhost:5000";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[MenuTemplates] Solicitando plantillas y datos del restaurante:", restaurantId);
      const templateResponse = await api.get("/templates");
      const restaurantResponse = await api.get(`/restaurantes/${restaurantId}`);
      const enrichedTemplates = templateResponse.data.map(template => ({
        ...template,
        ...predefinedTemplates[template.type],
      }));
      console.log("[MenuTemplates] Plantillas enriquecidas:", enrichedTemplates);
      setTemplates(enrichedTemplates);

      const restaurantData = restaurantResponse.data[0] || {};
      const selected = enrichedTemplates.find(t => t.id === restaurantData.template_id) || enrichedTemplates[0];
      console.log("[MenuTemplates] Plantilla seleccionada:", selected);

      setSelectedTemplate(selected);
      setColors(restaurantData.colors || selected.default_colors);
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(restaurantData.logo_url || null);
      setMenuSections(restaurantData.sections || selected.sections || {
        "Platos Principales": [],
        "Postres": [],
        "Bebidas": [],
      });
    } catch (error) {
      console.error("[MenuTemplates] Error al cargar datos:", error);
      toast.error("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      console.log("[MenuTemplates] Guardando plantilla:", { restaurantId, templateId: selectedTemplate.id, name: restaurantName, colors, logo, sections: menuSections });
      await api.put(`/restaurantes/${restaurantId}`, {
        template_id: selectedTemplate.id,
        name: restaurantName,
        colors,
        logo,
        sections: menuSections,
      });
      onTemplateSelected({ ...selectedTemplate, restaurantName, logo, sections: menuSections }, colors);
      toast.success("Carta guardada con éxito.");
    } catch (error) {
      console.error("[MenuTemplates] Error al guardar plantilla:", error);
      toast.error("Error al guardar la carta.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024 || !file.type.match(/image\/(jpeg|png)/)) {
      toast.error("Solo JPEG/PNG, máximo 5MB.");
      return;
    }
    console.log("[MenuTemplates] Subiendo logo:", { name: file.name, type: file.type, size: file.size });
    const formData = new FormData();
    formData.append("file", file); // Coincide con el backend
    try {
      const response = await api.post(`/restaurantes/${restaurantId}/upload-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("[MenuTemplates] Logo subido:", response.data.logoUrl);
      setLogo(response.data.logoUrl);
      toast.success("Logo subido correctamente.");
    } catch (error) {
      console.error("[MenuTemplates] Error al subir logo:", error);
      toast.error("Error al subir el logo.");
    }
  };

  const handleTemplateChange = (e) => {
    const type = e.target.value;
    const template = templates.find(t => t.type === type) || templates[0];
    console.log("[MenuTemplates] Cambiando a plantilla:", template);
    setSelectedTemplate(template);
    setColors(template.default_colors);
    setRestaurantName(template.name || "Mi Restaurante");
    setLogo(null);
    setMenuSections(template.sections || {
      "Platos Principales": [],
      "Postres": [],
      "Bebidas": [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <ToastContainer />
      {loading && <div className="absolute inset-0 bg-gray-200 opacity-50 flex items-center justify-center">Cargando...</div>}
      <motion.h3
        className="text-2xl sm:text-3xl font-serif font-bold text-center mb-6 sm:mb-8"
        style={{ color: colors.primary }}
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        Configurar Carta
      </motion.h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div>
          <label className="block mb-1 font-medium">Nombre del Restaurante</label>
          <input
            type="text"
            value={restaurantName}
            onChange={e => setRestaurantName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Mi Restaurante"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Logo</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleLogoUpload}
            className="w-full p-3 border rounded-lg"
          />
          {logo && (
            <img
              src={BASE_URL + logo}
              alt="Logo"
              className="mt-2 w-16 h-16 object-cover rounded-lg"
              onError={() => console.error("[MenuTemplates] Error al cargar logo:", BASE_URL + logo)}
            />
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">Plantilla</label>
          <select
            value={selectedTemplate?.type || ""}
            onChange={handleTemplateChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una plantilla</option>
            {templates.map(template => (
              <option key={template.id} value={template.type}>{template.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Colores</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={colors.primary}
              onChange={e => setColors({ ...colors, primary: e.target.value })}
              className="w-12 h-12 border rounded-lg"
            />
            <input
              type="color"
              value={colors.secondary}
              onChange={e => setColors({ ...colors, secondary: e.target.value })}
              className="w-12 h-12 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <motion.div
          className="p-4 sm:p-6 bg-gray-50 rounded-lg shadow-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-4">
            <h4 className="text-xl sm:text-2xl font-semibold" style={{ color: colors.primary }}>{restaurantName}</h4>
            {logo && (
              <img
                src={BASE_URL + logo}
                alt="Logo"
                className="mx-auto mt-2 w-20 h-20 object-cover rounded-full"
                onError={() => console.error("[MenuTemplates] Error al cargar logo en vista previa:", BASE_URL + logo)}
              />
            )}
          </div>
          {Object.entries(menuSections).map(([section, items]) => (
            <div key={section} className="mb-4">
              <h5 className="text-lg font-semibold mb-2 border-b-2 pb-1" style={{ color: colors.primary, borderColor: colors.secondary }}>{section}</h5>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span>{item.name} - {item.description}</span>
                    <span style={{ color: colors.secondary }}>S/. {item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button
            onClick={handleSaveTemplate}
            className="mt-4 w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Guardar Carta
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MenuTemplates;