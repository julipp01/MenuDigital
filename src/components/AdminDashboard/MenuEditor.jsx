import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import Compressor from "compressorjs";
import ThreeDViewer from "@/components/ThreeDViewer";
import useSocket from "@/hooks/useSocket";

// Definición de FRONTEND_URL con fallback dinámico
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const MenuEditor = ({ restaurantId }) => {
  const { user } = useAuth();
  const { socket, isConnected, menuUpdate } = useSocket();
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    description: "",
    category: "Platos Principales",
    imageUrl: "",
  });
  const [editingItem, setEditingItem] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [colors, setColors] = useState({ primary: "#FF9800", secondary: "#4CAF50" });
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante");
  const [logo, setLogo] = useState(null);
  const [menuSections, setMenuSections] = useState({
    "Platos Principales": [],
    Postres: [],
    Bebidas: [],
  });
  const [planId, setPlanId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // Estado para la carga de archivos
  const qrRef = useRef(null);

  // Memoizar la URL base para evitar recalcularla innecesariamente
  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_URL, []);

  // Función para construir URLs de imágenes
  const buildImageUrl = useCallback((url) => {
    if (!url) return null;
    // Si la URL ya es absoluta, devolverla tal cual
    if (url.startsWith("http")) return url;
    // Si es relativa, concatenar con la URL base
    return `${apiBaseUrl}${url}`;
  }, [apiBaseUrl]);

  // Fetch inicial de datos
  const fetchData = useCallback(async () => {
    if (!user || !restaurantId) return;
    setLoading(true);
    try {
      const [templateResponse, restaurantResponse] = await Promise.all([
        api.get("/templates"),
        api.get(`/restaurantes/${restaurantId}`),
      ]);
      const templatesData = templateResponse.data || [];
      setTemplates(templatesData);
      const restaurantData = restaurantResponse.data[0] || {};
      const template =
        templatesData.find((t) => t.id === restaurantData.template_id) || templatesData[0];
      if (!template) throw new Error("No se encontró plantilla válida");
      setSelectedTemplate(template);
      setColors(restaurantData.colors || template.default_colors);
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(buildImageUrl(restaurantData.logo_url));
      setPlanId(restaurantData.plan_id || null);
      const loadedSections =
        restaurantData.sections ||
        template.fields || { "Platos Principales": [], Postres: [], Bebidas: [] };
      setMenuSections(loadedSections);

      const menuResponse = await api.get(`/menu/${restaurantId}`);
      const items = (menuResponse.data.items || []).map((item) => ({
        ...item,
        imageUrl: buildImageUrl(item.image_url),
      }));
      setMenuItems(items);
    } catch (error) {
      console.error("[MenuEditor] Error al cargar datos:", error.response?.data || error.message);
      toast.error("Error al cargar los datos del menú.");
      setMenuSections({ "Platos Principales": [], Postres: [], Bebidas: [] });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, user, buildImageUrl]);

  // Guardar secciones en el backend
  const saveSections = useCallback(
    async (updatedSections) => {
      try {
        await api.put(`/restaurantes/${restaurantId}`, {
          name: restaurantName,
          colors,
          logo,
          sections: updatedSections,
          plan_id: planId,
        });
        toast.success("Secciones actualizadas correctamente.");
      } catch (error) {
        console.error(
          "[MenuEditor] Error al actualizar secciones:",
          error.response?.data || error.message
        );
        toast.error("No se pudieron actualizar las secciones.");
      }
    },
    [restaurantId, restaurantName, colors, logo, planId]
  );

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actualizar en tiempo real con WebSocket
  useEffect(() => {
    if (menuUpdate && isConnected) {
      toast.info("Menú actualizado en tiempo real");
      fetchData();
    }
  }, [menuUpdate, isConnected, fetchData]);

  // Guardar configuración
  const handleSaveConfig = async () => {
    try {
      await api.put(`/restaurantes/${restaurantId}`, {
        name: restaurantName,
        colors,
        logo,
        sections: menuSections,
        plan_id: planId,
      });
      toast.success("Configuración guardada con éxito.");
      await fetchData();
    } catch (error) {
      console.error(
        "[MenuEditor] Error al guardar configuración:",
        error.response?.data || error.message
      );
      toast.error("No se pudo guardar la configuración.");
    }
  };

  // Subir logo con compresión
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !file.type.match(/image\/(jpeg|png)/)) {
      toast.error("Solo se permiten imágenes JPEG/PNG de hasta 5MB.");
      return;
    }
    setUploading(true);
    try {
      // Comprimir la imagen antes de subirla
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 800,
        maxHeight: 800,
        success: async (compressedFile) => {
          const formData = new FormData();
          formData.append("logo", compressedFile);
          const response = await api.post(`/restaurantes/${restaurantId}/upload-logo`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const logoUrl = buildImageUrl(response.data.logoUrl);
          console.log("[MenuEditor] Logo URL recibida del backend:", logoUrl);
          setLogo(logoUrl);
          toast.success("Logo subido con éxito.");
          await handleSaveConfig();
          setUploading(false);
        },
        error: (err) => {
          console.error("[MenuEditor] Error al comprimir imagen:", err);
          toast.error("Error al procesar la imagen.");
          setUploading(false);
        },
      });
    } catch (error) {
      console.error("[MenuEditor] Error al subir logo:", error.response?.data || error.message);
      toast.error("Error al subir el logo.");
      setUploading(false);
    }
  };

  // Cambiar plantilla
  const handleTemplateChange = (e) => {
    const type = e.target.value;
    const template = templates.find((t) => t.type === type) || templates[0];
    if (!template) return;
    setSelectedTemplate(template);
    setColors(template.default_colors);
    const newSections =
      template.fields || { "Platos Principales": [], Postres: [], Bebidas: [] };
    setMenuSections(newSections);
    setMenuItems(
      Object.entries(newSections).flatMap(([category, items]) =>
        items.map((item) => ({ ...item, category }))
      )
    );
  };

  // Agregar o actualizar ítem
  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Faltan campos obligatorios: nombre, precio o categoría.");
      return;
    }
    const url = editingItem ? `/menu/${restaurantId}/${editingItem.id}` : `/menu/${restaurantId}`;
    const method = editingItem ? "PUT" : "POST";
    try {
      console.log("Enviando solicitud:", { method, url, data: newItem });
      await api.request({ method, url, data: newItem });
      setNewItem({
        name: "",
        price: "",
        description: "",
        category: "Platos Principales",
        imageUrl: "",
      });
      setEditingItem(null);
      await fetchData();
      toast.success(`Ítem ${editingItem ? "actualizado" : "agregado"} con éxito.`);
      if (socket) {
        socket.emit("menu-updated", { restaurantId, item: newItem });
      }
    } catch (error) {
      console.error("[MenuEditor] Error al guardar ítem:", error.response?.data || error.message);
      const errorMsg = error.response?.status === 404 ? "Ítem no encontrado" : "Error del servidor";
      toast.error(`Error al guardar el ítem: ${errorMsg}`);
    }
  };

  // Subir imagen o modelo 3D con compresión
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return toast.error("No se seleccionó ningún archivo.");
    const is3DModel = file.type === "model/gltf-binary" || file.name.endsWith(".glb");
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo excede el límite de 10MB.");
      return;
    }
    setUploading(true);
    try {
      if (!is3DModel) {
        // Comprimir imágenes, pero no modelos 3D
        new Compressor(file, {
          quality: 0.6,
          maxWidth: 800,
          maxHeight: 800,
          success: async (compressedFile) => {
            const formData = new FormData();
            formData.append("file", compressedFile);
            const response = await api.post(`/menu/${restaurantId}/upload`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setNewItem((prev) => ({
              ...prev,
              imageUrl: buildImageUrl(response.data.fileUrl),
            }));
            toast.success("Archivo subido con éxito.");
            setUploading(false);
          },
          error: (err) => {
            console.error("[MenuEditor] Error al comprimir imagen:", err);
            toast.error("Error al procesar la imagen.");
            setUploading(false);
          },
        });
      } else {
        // Subir modelos 3D sin compresión
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post(`/menu/${restaurantId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNewItem((prev) => ({
          ...prev,
          imageUrl: buildImageUrl(response.data.fileUrl),
        }));
        toast.success("Archivo subido con éxito.");
        setUploading(false);
      }
    } catch (error) {
      console.error("[MenuEditor] Error al subir archivo:", error.response?.data || error.message);
      toast.error("Error al subir el archivo.");
      setUploading(false);
    }
  };

  // Eliminar ítem
  const handleDeleteItem = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ítem?")) return;
    try {
      await api.delete(`/menu/${restaurantId}/${id}`);
      await fetchData();
      toast.success("Ítem eliminado con éxito.");
      if (socket) {
        socket.emit("menu-updated", { restaurantId, deletedItemId: id });
      }
    } catch (error) {
      console.error("[MenuEditor] Error al eliminar ítem:", error.response?.data || error.message);
      toast.error("Error al eliminar el ítem.");
    }
  };

  // Renombrar sección
  const handleRenameSection = useCallback(
    (oldKey, newKey) => {
      if (!newKey.trim()) return toast.error("El nombre de la sección no puede estar vacío.");
      if (menuSections[newKey] && oldKey !== newKey)
        return toast.error("Ya existe una sección con ese nombre.");
      const updated = {};
      Object.entries(menuSections).forEach(([key, items]) => {
        updated[key === oldKey ? newKey : key] = items;
      });
      setMenuSections(updated);
      saveSections(updated);
      setEditingSection(null);
      setNewSectionName("");
    },
    [menuSections, saveSections]
  );

  // Eliminar sección
  const handleDeleteSection = useCallback(
    (key) => {
      if (!window.confirm("¿Seguro que quieres eliminar esta sección?")) return;
      const updated = { ...menuSections };
      delete updated[key];
      setMenuSections(updated);
      saveSections(updated);
    },
    [menuSections, saveSections]
  );

  // Agregar sección
  const handleAddSection = useCallback(
    (newName) => {
      if (!newName.trim()) return toast.error("Ingrese un nombre para la nueva sección.");
      if (menuSections[newName]) return toast.error("La sección ya existe.");
      const updated = { ...menuSections, [newName]: [] };
      setMenuSections(updated);
      saveSections(updated);
      setNewSectionName("");
    },
    [menuSections, saveSections]
  );

  // Descargar QR
  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current);
      const link = document.createElement("a");
      link.download = `qr_carta_${restaurantId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Código QR descargado con éxito.");
    } catch (error) {
      console.error("[MenuEditor] Error al descargar QR:", error);
      toast.error("Error al generar el código QR.");
    }
  };

  // Memoizar las secciones filtradas para mejorar el rendimiento
  const filteredSections = useMemo(() => {
    return Object.entries(menuSections).map(([section]) => ({
      section,
      items: menuItems.filter((item) => item.category === section),
    }));
  }, [menuSections, menuItems]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans">
      <ToastContainer />
      {(loading || uploading) && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      )}
      <motion.button
        onClick={() => setShowQRModal(true)}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs mx-auto py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md text-sm mb-6"
      >
        Generar QR
      </motion.button>
      <motion.h2
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-3xl font-bold text-center mb-6"
        style={{ color: colors.primary }}
      >
        {restaurantName || "Editor de Menú"}
      </motion.h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-4 rounded-lg shadow-lg lg:col-span-1 border border-gray-200"
        >
          <h3 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
            Configuración
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Nombre del Restaurante"
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            />
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogoUpload}
                className="w-full p-1 border rounded-lg text-xs"
                disabled={uploading}
              />
              {logo && (
                <img
                  src={logo}
                  alt="Logo"
                  className="mt-2 w-16 h-16 rounded-full object-cover mx-auto shadow-sm"
                  onError={(e) => {
                    console.error("[MenuEditor] Error al cargar el logo. URL intentada:", e.target.src);
                  }}
                />
              )}
            </div>
            <div className="flex gap-3">
              <div>
                <label className="text-sm text-gray-600">Color Primario</label>
                <input
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-full h-10 rounded-md border"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Color Secundario</label>
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-full h-10 rounded-md border"
                />
              </div>
            </div>
            <select
              value={selectedTemplate?.type || ""}
              onChange={handleTemplateChange}
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            >
              <option value="" disabled>
                Selecciona una plantilla
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.type}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveConfig}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              disabled={loading || uploading}
            >
              Guardar Configuración
            </button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-4 rounded-lg shadow-lg lg:col-span-2 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold" style={{ color: colors.primary }}>
              {showPreview ? "Vista Previa" : "Editar Carta"}
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
            >
              {showPreview ? "Volver a Editar" : "Previsualizar"}
            </button>
          </div>
          {showPreview ? (
            <div className="space-y-6">
              <header className="text-center mb-4">
                {logo && (
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-20 h-20 rounded-full mx-auto mb-2 shadow-md"
                    onError={(e) => {
                      console.error(
                        "[MenuEditor] Error al cargar el logo en vista previa. URL intentada:",
                        e.target.src
                      );
                    }}
                  />
                )}
                <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {restaurantName}
                </h1>
              </header>
              <div className="bg-gray-50 p-3 rounded-lg max-h-[500px] overflow-y-auto">
                {filteredSections.map(({ section, items }) => (
                  <div key={section} className="mb-4">
                    <h4
                      className="text-lg font-semibold mb-2 p-2 rounded-t-md text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {section}
                    </h4>
                    <ul className="grid grid-cols-1 gap-3">
                      {items.map((item) => (
                        <li
                          key={item.id || item.name}
                          className="flex items-center gap-4 p-3 bg-white rounded-md shadow-sm border border-gray-100"
                        >
                          {item.imageUrl ? (
                            item.imageUrl.endsWith(".glb") ? (
                              <div className="w-16 h-16">
                                <ThreeDViewer modelUrl={item.imageUrl} autoRotate />
                              </div>
                            ) : (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 rounded-md object-cover"
                                onError={(e) => {
                                  console.error(
                                    "[MenuEditor] Error al cargar imagen en vista previa. URL intentada:",
                                    e.target.src
                                  );
                                  e.target.src = "/placeholder-image.png";
                                }}
                              />
                            )
                          ) : (
                            <span className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md text-xs text-gray-500">
                              Sin Imagen
                            </span>
                          )}
                          <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <span
                              className="text-base font-medium"
                              style={{ color: colors.secondary }}
                            >
                              S/. {item.price}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleAddOrUpdateItem}
                className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-6"
              >
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Nombre del Plato"
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  required
                />
                <input
                  type="number"
                  name="price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="S/."
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  step="0.01"
                  min="0"
                  required
                />
                <select
                  name="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  required
                >
                  {Object.keys(menuSections).map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Descripción"
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 sm:col-span-3"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,model/gltf-binary,.glb"
                  onChange={handleImageUpload}
                  className="p-1 border rounded-lg text-xs sm:col-span-2"
                  disabled={uploading}
                />
                <button
                  type="submit"
                  className="py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  disabled={loading || uploading}
                >
                  {editingItem ? "Actualizar Plato" : "Agregar Plato"}
                </button>
              </form>
              <div className="bg-gray-50 p-3 rounded-lg max-h-[500px] overflow-y-auto">
                {filteredSections.map(({ section, items }) => (
                  <div key={section} className="mb-4">
                    <div
                      className="flex items-center justify-between p-2 rounded-t-md text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {editingSection === section ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            className="flex-1 p-1 border rounded-md text-sm focus:ring-1 focus:ring-indigo-400"
                            placeholder="Nuevo nombre"
                          />
                          <button
                            onClick={() => handleRenameSection(section, newSectionName)}
                            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSection(null)}
                            className="p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <>
                          <motion.h4
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-lg font-semibold flex-1 truncate"
                          >
                            {section}
                          </motion.h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingSection(section);
                                setNewSectionName(section);
                              }}
                              className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => {
                                setNewSectionName("");
                                setEditingSection(`new-${section}`);
                              }}
                              className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section)}
                              className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {editingSection === `new-${section}` && (
                      <div className="flex items-center gap-2 p-2 bg-gray-200 rounded-b-md">
                        <input
                          type="text"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          className="flex-1 p-1 border rounded-md text-sm focus:ring-1 focus:ring-indigo-400"
                          placeholder="Nueva sección"
                        />
                        <button
                          onClick={() => handleAddSection(newSectionName)}
                          className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                        >
                          ✗
                        </button>
                      </div>
                    )}
                    <ul className="grid grid-cols-1 gap-3 mt-2">
                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.li
                            key={item.id || item.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-4 p-3 bg-white rounded-md shadow-sm border border-gray-100"
                          >
                            {item.imageUrl ? (
                              item.imageUrl.endsWith(".glb") ? (
                                <div className="w-16 h-16">
                                  <ThreeDViewer modelUrl={item.imageUrl} autoRotate />
                                </div>
                              ) : (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-16 h-16 rounded-md object-cover"
                                  onError={(e) => {
                                    console.error(
                                      "[MenuEditor] Error al cargar imagen. URL intentada:",
                                      e.target.src
                                    );
                                    e.target.src = "/placeholder-image.png";
                                  }}
                                />
                              )
                            ) : (
                              <span className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md text-xs text-gray-500">
                                Sin Imagen
                              </span>
                            )}
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <span
                                className="text-base font-medium"
                                style={{ color: colors.secondary }}
                              >
                                S/. {item.price}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setNewItem({ ...item });
                                }}
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-4 rounded-xl w-full max-w-xs shadow-lg"
            >
              <h4 className="text-lg font-bold mb-3 text-gray-800">Código QR</h4>
              <div ref={qrRef} className="bg-white p-3 rounded-lg flex justify-center">
                <QRCodeCanvas
                  value={`${FRONTEND_URL}/menu/${restaurantId}`}
                  size={150}
                  fgColor={colors.primary}
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={handleDownloadQR}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Descargar
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuEditor;







