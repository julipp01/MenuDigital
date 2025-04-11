import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { FaStore, FaPaintBrush, FaFileAlt, FaSave, FaSpinner } from "react-icons/fa";
import api from "@/services/api";
import PropTypes from "prop-types";

const ConfigEditor = React.memo(({
  restaurantId,
  restaurantData,
  onUpdate,
  nameFont,
  setNameFont,
  saveConfig,
  isLoading,
  setIsLoading,
}) => {
  const { theme } = useTheme() || {};
  const textColor = theme?.colors?.text || "#1F2937";
  const backgroundColor = theme?.colors?.background || "#FFFFFF";
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [localData, setLocalData] = useState(restaurantData);

  useEffect(() => {
    setLocalData(restaurantData);
    const selectedTemplate = templates.find(t => t.id === restaurantData.templateId);
    setSelectedTemplateName(selectedTemplate?.name || "");
  }, [restaurantData, templates]);

  const specialFonts = useMemo(() => [
    { name: "Lobster", style: "'Lobster', cursive" },
    { name: "Pacifico", style: "'Pacifico', cursive" },
    { name: "Great Vibes", style: "'Great Vibes', cursive" },
    { name: "Dancing Script", style: "'Dancing Script', cursive" },
  ], []);

  const selectedFontStyle = useMemo(() => {
    const font = specialFonts.find(f => f.name === nameFont);
    return font ? font.style : "'Roboto', sans-serif";
  }, [nameFont]);

  const dynamicBackground = useMemo(() => ({
    background: `linear-gradient(135deg, ${localData.colors?.primary || "#F97316"}20, ${localData.colors?.secondary || "#FF9800"}20), ${backgroundColor}`,
  }), [localData.colors, backgroundColor]);

  const fetchTemplates = useCallback(async () => {
    try {
      console.log("Fetching templates...");
      const response = await api.get(`/restaurantes/${restaurantId}/menu_templates`);
      const fetchedTemplates = response.data || [];
      setTemplates(fetchedTemplates);
      const selectedTemplate = fetchedTemplates.find(t => t.id === localData.templateId);
      setSelectedTemplateName(selectedTemplate?.name || "");
    } catch (err) {
      setError("No se pudieron cargar las plantillas.");
      console.error("Error al obtener plantillas:", err.response?.data || err.message);
    }
  }, [restaurantId, localData.templateId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const uploadToCloudinary = useCallback(async (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "model/gltf-binary"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".glb"];
    const maxSize = 10 * 1024 * 1024; // 10 MB en bytes

    if (!file) {
      setError("No se seleccionó ningún archivo. Por favor, elige un archivo.");
      return;
    }

    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
    if (!isValidType) {
      setError(`Tipo de archivo no permitido: "${fileExtension}". Solo se aceptan .jpg, .png o .glb.`);
      return;
    }

    if (file.size > maxSize) {
      setError(`El archivo "${file.name}" supera el límite de 10 MB (${(file.size / 1024 / 1024).toFixed(2)} MB).`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    formData.append("cloud_name", "delzhsy0h");

    try {
      setUploading(true);
      setError(null);
      const response = await fetch("https://api.cloudinary.com/v1_1/delzhsy0h/raw/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Error al subir el archivo al servidor.");
      const data = await response.json();
      setLocalData(prev => ({ ...prev, logo_url: data.secure_url }));
      onUpdate(prev => ({ ...prev, logo_url: data.secure_url }));
      setError("¡Archivo subido correctamente!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(`Error al subir "${file.name}": ${err.message}`);
      console.error("Error al subir a Cloudinary:", err);
    } finally {
      setUploading(false);
    }
  }, [onUpdate]);

  const handleTemplateChange = useCallback(async (e) => {
    const newTemplateId = parseInt(e.target.value, 10);
    if (!newTemplateId || newTemplateId === localData.templateId) return;

    setIsLoading(true);
    try {
      console.log("Changing template to:", newTemplateId);
      const response = await api.put(`/restaurantes/${restaurantId}/template`, { templateId: newTemplateId });
      const updatedRestaurant = response.data.restaurant || {};
      const newTemplateName = response.data.templateName || templates.find(t => t.id === newTemplateId)?.name || "";
      setSelectedTemplateName(newTemplateName);
      setLocalData(prev => ({
        ...prev,
        ...updatedRestaurant,
        sections: updatedRestaurant.sections || prev.sections,
        items: response.data.items || prev.items,
      }));
      onUpdate(prev => ({
        ...prev,
        ...updatedRestaurant,
        sections: updatedRestaurant.sections || prev.sections,
        items: response.data.items || prev.items,
      }));
      setError(null);
    } catch (err) {
      setError("No se pudo guardar la plantilla en el servidor: " + (err.response?.data?.error || err.message));
      console.error("Error al cambiar plantilla:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, localData.templateId, onUpdate, setIsLoading, templates]);

  const handleSaveConfig = useCallback(async () => {
    if (isSaving || isLoading) return;
    setIsSaving(true);
    try {
      await saveConfig();
      onUpdate(prev => ({ ...prev, nameFont }));
      setError("¡Configuración guardada correctamente!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Error al guardar la configuración: " + (err.response?.data?.error || err.message));
      console.error("Error al guardar:", err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, isLoading, saveConfig, nameFont, onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl shadow-xl bg-white bg-opacity-95 flex flex-col h-full"
      style={dynamicBackground}
    >
      <h3 className="text-xl font-bold mb-4 text-center" style={{ color: textColor, fontFamily: localData.fontFamily }}>
        Configuración del Restaurante
      </h3>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm mb-4 text-center p-2 rounded ${error.includes("correctamente") ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}
        >
          {error}
        </motion.p>
      )}

      <div className="flex-1 overflow-y-auto space-y-6">
        <section>
          <h4 className="text-md font-semibold flex items-center gap-2 mb-3" style={{ color: textColor }}>
            <FaStore /> Identidad
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Nombre</label>
              <input
                type="text"
                value={localData.name || ""}
                onChange={e => {
                  setLocalData(prev => ({ ...prev, name: e.target.value }));
                  onUpdate(prev => ({ ...prev, name: e.target.value }));
                }}
                className="w-full p-2 rounded-lg bg-gray-50 border focus:ring-2 focus:outline-none"
                style={{ borderColor: localData.colors?.primary, color: textColor }}
              />
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <p style={{ fontFamily: selectedFontStyle, color: localData.colors?.primary }}>
                  {localData.name || "Tu Restaurante"}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Estilo de Letra</label>
              <select
                value={nameFont}
                onChange={e => {
                  setNameFont(e.target.value);
                  onUpdate(prev => ({ ...prev, nameFont: e.target.value }));
                }}
                className="w-full p-2 rounded-lg bg-gray-50 border focus:ring-2 focus:outline-none"
                style={{ borderColor: localData.colors?.primary, color: textColor }}
              >
                {specialFonts.map(font => (
                  <option key={font.name} value={font.name} style={{ fontFamily: font.style }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                Logo o Modelo 3D
              </label>
              <motion.div
                className="relative w-full p-3 bg-gray-50 rounded-lg border-2 border-dashed cursor-pointer"
                style={{ borderColor: localData.colors?.primary }}
                whileHover={{ borderColor: localData.colors?.secondary }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,model/gltf-binary,.glb"
                  onChange={e => uploadToCloudinary(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <p className="text-center text-sm" style={{ color: textColor }}>
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" /> Cargando...
                    </span>
                  ) : (
                    "Arrastra o haz clic para subir un logo (.jpg, .png) o modelo 3D (.glb, máx. 10 MB)"
                  )}
                </p>
              </motion.div>
              {localData.logo_url && (
                localData.logo_url.endsWith('.glb') ? (
                  <p className="mt-2 text-sm" style={{ color: textColor }}>
                    Modelo 3D subido: <a href={localData.logo_url} target="_blank" style={{ color: localData.colors?.primary }}>Ver archivo</a>
                  </p>
                ) : (
                  <img
                    src={localData.logo_url}
                    alt="Logo"
                    className="mt-2 w-16 h-16 rounded-full object-cover border-2"
                    style={{ borderColor: localData.colors?.primary }}
                  />
                )
              )}
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-md font-semibold flex items-center gap-2 mb-3" style={{ color: textColor }}>
            <FaPaintBrush /> Estilo
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>Primario</label>
                <input
                  type="color"
                  value={localData.colors?.primary || "#F97316"}
                  onChange={e => {
                    setLocalData(prev => ({ ...prev, colors: { ...prev.colors, primary: e.target.value } }));
                    onUpdate(prev => ({ ...prev, colors: { ...prev.colors, primary: e.target.value } }));
                  }}
                  className="w-full h-8 rounded-lg border-2 cursor-pointer"
                  style={{ borderColor: localData.colors?.primary }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: textColor }}>Secundario</label>
                <input
                  type="color"
                  value={localData.colors?.secondary || "#FF9800"}
                  onChange={e => {
                    setLocalData(prev => ({ ...prev, colors: { ...prev.colors, secondary: e.target.value } }));
                    onUpdate(prev => ({ ...prev, colors: { ...prev.colors, secondary: e.target.value } }));
                  }}
                  className="w-full h-8 rounded-lg border-2 cursor-pointer"
                  style={{ borderColor: localData.colors?.secondary }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Tipografía</label>
              <select
                value={localData.fontFamily || "Roboto"}
                onChange={e => {
                  setLocalData(prev => ({ ...prev, fontFamily: e.target.value }));
                  onUpdate(prev => ({ ...prev, fontFamily: e.target.value }));
                }}
                className="w-full p-2 rounded-lg bg-gray-50 border focus:ring-2 focus:outline-none"
                style={{ borderColor: localData.colors?.primary, color: textColor }}
              >
                {["Roboto", "Playfair Display", "Montserrat", "Lora"].map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-md font-semibold flex items-center gap-2 mb-3" style={{ color: textColor }}>
            <FaFileAlt /> Plantilla
          </h4>
          <select
            value={localData.templateId || ""}
            onChange={handleTemplateChange}
            className="w-full p-2 rounded-lg bg-gray-50 border focus:ring-2 focus:outline-none"
            style={{ borderColor: localData.colors?.primary, color: textColor }}
            disabled={isLoading}
          >
            <option value="" disabled>Selecciona una plantilla</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.type})
              </option>
            ))}
          </select>
          {selectedTemplateName && (
            <p className="mt-2 text-sm" style={{ color: textColor }}>
              Plantilla seleccionada: <span style={{ color: localData.colors?.primary }}>{selectedTemplateName}</span>
            </p>
          )}
        </section>
      </div>

      <motion.button
        onClick={handleSaveConfig}
        className={`mt-6 flex items-center gap-2 px-4 py-2 text-white rounded-lg ${isSaving ? "opacity-75 cursor-not-allowed" : ""}`}
        style={{ backgroundColor: localData.colors?.primary }}
        whileHover={!isSaving ? { scale: 1.05 } : {}}
        whileTap={!isSaving ? { scale: 0.95 } : {}}
        disabled={isSaving || isLoading}
      >
        {isSaving ? "Guardando..." : (
          <>
            <FaSave /> Guardar
          </>
        )}
      </motion.button>
    </motion.div>
  );
});

ConfigEditor.displayName = "ConfigEditor";

ConfigEditor.propTypes = {
  restaurantId: PropTypes.number.isRequired,
  restaurantData: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  nameFont: PropTypes.string.isRequired,
  setNameFont: PropTypes.func.isRequired,
  saveConfig: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  setIsLoading: PropTypes.func.isRequired,
};

export default ConfigEditor;