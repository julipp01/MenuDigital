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

// Configuración de URLs
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Componente MediaViewer memoizado
const MediaViewer = React.memo(({ item }) => {
  if (!item.imageUrl) {
    return (
      <span className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md text-xs text-gray-500">
        Sin Imagen
      </span>
    );
  }
  if (item.imageUrl.endsWith(".glb")) {
    return (
      <div className="w-16 h-16">
        <ThreeDViewer
          modelUrl={item.imageUrl}
          autoRotate
          fallback={<div>Modelo no disponible</div>}
        />
      </div>
    );
  }
  return (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="w-16 h-16 rounded-md object-cover"
      onError={(e) => (e.target.src = "/placeholder-image.png")}
    />
  );
});

const MenuEditor = ({ restaurantId }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const qrRef = useRef(null);
  const urlCache = useRef(new Map());

  // Estados
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Validar URLs con caché
  const validateUrl = useCallback(async (url) => {
    if (!url) return false;
    if (urlCache.current.has(url)) return urlCache.current.get(url);
    try {
      console.log("[MenuEditor] Validando URL:", url); // Depuración
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const isValid = response.ok;
      urlCache.current.set(url, isValid);
      console.log(`[MenuEditor] URL procesada: ${url} - Válida: ${isValid}`);
      return isValid;
    } catch (err) {
      console.error(`[MenuEditor] Error al validar URL ${url}:`, err.message);
      urlCache.current.set(url, false);
      return false;
    }
  }, []);

  // Construir URLs
  const buildImageUrl = useCallback(
    (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url; // Si es una URL absoluta (como Cloudinary), usarla directamente
      // Si es una ruta relativa, evitar duplicar /uploads/
      const cleanUrl = url.startsWith("/uploads/") ? url : `/uploads/${url}`;
      const fullUrl = `${API_BASE_URL}${cleanUrl}`.replace(/\/+$/, "").replace(/\/uploads\/+/g, "/uploads/");
      console.log("[MenuEditor] Construyendo URL:", fullUrl); // Depuración
      return fullUrl;
    },
    [API_BASE_URL]
  );

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    if (!user || !restaurantId) {
      setError("Faltan datos de usuario o restaurante");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [templateResponse, restaurantResponse, menuResponse] = await Promise.all([
        api.get("/templates", { timeout: 20000 }),
        api.get(`/restaurantes/${restaurantId}`, { timeout: 20000 }),
        api.get(`/menu/${restaurantId}`, { timeout: 20000 }),
      ]);

      const templatesData = templateResponse.data || [];
      setTemplates(templatesData);

      const restaurantData = restaurantResponse.data[0] || {};
      const template = templatesData.find((t) => t.id === restaurantData.template_id) || templatesData[0] || {};
      setSelectedTemplate(template);
      setColors(restaurantData.colors || template.default_colors || { primary: "#FF9800", secondary: "#4CAF50" });
      setRestaurantName(restaurantData.name || "Mi Restaurante");

      const logoUrl = buildImageUrl(restaurantData.logo_url);
      setLogo(logoUrl && (await validateUrl(logoUrl)) ? logoUrl : null);

      setPlanId(restaurantData.plan_id || null);
      setMenuSections(
        restaurantData.sections || template.fields || {
          "Platos Principales": [],
          Postres: [],
          Bebidas: [],
        }
      );

      const items = (menuResponse.data.items || []).map((item) => ({
        ...item,
        imageUrl: buildImageUrl(item.image_url),
      }));
      const validatedItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          imageUrl: item.imageUrl && (await validateUrl(item.imageUrl)) ? item.imageUrl : null,
        }))
      );
      setMenuItems(validatedItems);
    } catch (err) {
      console.error("[MenuEditor] Error al cargar datos:", err.message);
      setError(`Error al cargar datos: ${err.message || "Intenta de nuevo"}`);
      setMenuSections({ "Platos Principales": [], Postres: [], Bebidas: [] });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, user, buildImageUrl, validateUrl]);

  // Manejar cambio de plantilla
  const handleTemplateChange = useCallback(
    async (e) => {
      const type = e.target.value;
      const template = templates.find((t) => t.type === type) || templates[0];
      if (!template) {
        toast.error("Plantilla no encontrada");
        return;
      }
      setSelectedTemplate(template);
      setColors(template.default_colors || { primary: "#FF9800", secondary: "#4CAF50" });
      const newSections = template.fields || { "Platos Principales": [], Postres: [], Bebidas: [] };
      setMenuSections(newSections);
      setMenuItems(
        Object.entries(newSections).flatMap(([category, items]) =>
          items.map((item) => ({ ...item, category }))
        )
      );

      // Guardar la nueva plantilla en el backend
      try {
        await api.put(`/restaurantes/${restaurantId}`, {
          template_id: template.id,
          colors: template.default_colors,
        });
        toast.success("Plantilla actualizada con éxito");
      } catch (err) {
        console.error("[MenuEditor] Error al actualizar plantilla:", err.message);
        toast.error("Error al actualizar la plantilla");
      }
    },
    [templates, restaurantId]
  );

  // Efectos combinados
  useEffect(() => {
    fetchData();

    if (isConnected && socket) {
      const handleMenuUpdate = () => {
        toast.info("Menú actualizado en tiempo real");
        fetchData();
      };
      socket.addEventListener("message", handleMenuUpdate);
      return () => socket.removeEventListener("message", handleMenuUpdate);
    }
  }, [fetchData, isConnected, socket]);

  // Guardar configuración
  const saveConfig = useCallback(async () => {
    try {
      await api.put(`/restaurantes/${restaurantId}`, {
        name: restaurantName,
        colors,
        logo,
        sections: menuSections,
        plan_id: planId,
      });
      toast.success("Configuración guardada con éxito");
      await fetchData();
    } catch (err) {
      console.error("[MenuEditor] Error al guardar configuración:", err.message);
      toast.error("No se pudo guardar la configuración");
    }
  }, [restaurantId, restaurantName, colors, logo, menuSections, planId, fetchData]);

  // Subir archivos
  const uploadFile = useCallback(
    async (file, endpoint, fieldName = "file") => {
      if (!file) return null;
      const isImage = file.type.match(/image\/(jpeg|png)/);
      const is3DModel = file.type === "model/gltf-binary" || file.name.endsWith(".glb");
      if (!isImage && !is3DModel) {
        toast.error("Solo se permiten imágenes JPEG, PNG o modelos GLB");
        return null;
      }
      if (file.size > (is3DModel ? 10 : 5) * 1024 * 1024) {
        toast.error(`El archivo excede el límite de ${is3DModel ? 10 : 5}MB`);
        return null;
      }

      setUploading(true);
      try {
        const compressedFile = isImage
          ? await new Promise((resolve, reject) => {
              new Compressor(file, {
                quality: 0.6,
                maxWidth: 800,
                maxHeight: 800,
                success: (result) => resolve(new File([result], file.name, { type: result.type })),
                error: reject,
              });
            })
          : file;

        const formData = new FormData();
        formData.append(fieldName, compressedFile);
        const response = await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 20000,
        });

        const fileUrl = buildImageUrl(response.data.fileUrl || response.data.logoUrl);
        if (await validateUrl(fileUrl)) {
          toast.success(`${fieldName === "logo" ? "Logo" : "Archivo"} subido con éxito`);
          return fileUrl;
        }
        throw new Error("El archivo subido no es accesible");
      } catch (err) {
        console.error(`[MenuEditor] Error al subir ${fieldName}:`, err.message);
        toast.error(`Error al subir ${fieldName}: ${err.message}`);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [buildImageUrl, validateUrl]
  );

  const handleLogoUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      const newLogoUrl = await uploadFile(file, `/restaurantes/${restaurantId}/upload-logo`, "logo");
      if (newLogoUrl) {
        setLogo(newLogoUrl);
        await saveConfig();
      }
    },
    [restaurantId, uploadFile, saveConfig]
  );

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      const newImageUrl = await uploadFile(file, `/menu/${restaurantId}/upload`);
      if (newImageUrl) {
        setNewItem((prev) => ({ ...prev, imageUrl: newImageUrl }));
      }
    },
    [restaurantId, uploadFile]
  );

  // Manejar ítems del menú
  const handleAddOrUpdateItem = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newItem.name || !newItem.price || !newItem.category) {
        toast.error("Faltan campos obligatorios");
        return;
      }
      const url = editingItem ? `/menu/${restaurantId}/${editingItem.id}` : `/menu/${restaurantId}`;
      const method = editingItem ? "PUT" : "POST";
      try {
        await api.request({ method, url, data: newItem, timeout: 20000 });
        setNewItem({ name: "", price: "", description: "", category: "Platos Principales", imageUrl: "" });
        setEditingItem(null);
        await fetchData();
        toast.success(`Ítem ${editingItem ? "actualizado" : "agregado"} con éxito`);
        if (socket) {
          socket.send(JSON.stringify({ type: "menu-updated", restaurantId, item: newItem }));
        }
      } catch (err) {
        console.error("[MenuEditor] Error al guardar ítem:", err.message);
        toast.error(`Error al guardar el ítem: ${err.message}`);
      }
    },
    [editingItem, newItem, restaurantId, fetchData, socket]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
    setNewItem({ name: "", price: "", description: "", category: "Platos Principales", imageUrl: "" });
  }, []);

  const handleDeleteItem = useCallback(
    async (id) => {
      if (!window.confirm("¿Seguro que quieres eliminar este ítem?")) return;
      try {
        await api.delete(`/menu/${restaurantId}/${id}`, { timeout: 20000 });
        await fetchData();
        toast.success("Ítem eliminado con éxito");
        if (socket) {
          socket.send(JSON.stringify({ type: "menu-updated", restaurantId, deletedItemId: id }));
        }
      } catch (err) {
        console.error("[MenuEditor] Error al eliminar ítem:", err.message);
        toast.error("Error al eliminar el ítem");
      }
    },
    [restaurantId, fetchData, socket]
  );

  // Manejar secciones
  const handleRenameSection = useCallback(
    (oldKey, newKey) => {
      if (!newKey.trim()) {
        toast.error("El nombre de la sección no puede estar vacío");
        return;
      }
      if (menuSections[newKey] && oldKey !== newKey) {
        toast.error("La sección ya existe");
        return;
      }
      const updated = Object.fromEntries(
        Object.entries(menuSections).map(([key, items]) => [key === oldKey ? newKey : key, items])
      );
      setMenuSections(updated);
      saveConfig();
      setEditingSection(null);
      setNewSectionName("");
    },
    [menuSections, saveConfig]
  );

  const handleDeleteSection = useCallback(
    (key) => {
      if (!window.confirm("¿Seguro que quieres eliminar esta sección?")) return;
      const updated = { ...menuSections };
      delete updated[key];
      setMenuSections(updated);
      saveConfig();
    },
    [menuSections, saveConfig]
  );

  const handleAddSection = useCallback(
    (newName) => {
      if (!newName.trim()) {
        toast.error("Ingrese un nombre para la nueva sección");
        return;
      }
      if (menuSections[newName]) {
        toast.error("La sección ya existe");
        return;
      }
      const updated = { ...menuSections, [newName]: [] };
      setMenuSections(updated);
      saveConfig();
      setNewSectionName("");
    },
    [menuSections, saveConfig]
  );

  // Descargar QR
  const handleDownloadQR = useCallback(async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current);
      const link = document.createElement("a");
      link.download = `qr_carta_${restaurantId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Código QR descargado con éxito");
    } catch (err) {
      console.error("[MenuEditor] Error al descargar QR:", err.message);
      toast.error("Error al generar el código QR");
    }
  }, [restaurantId]);

  // Filtrar secciones
  const filteredSections = useMemo(() => {
    return Object.entries(menuSections).map(([section]) => ({
      section,
      items: menuItems.filter((item) => item.category === section),
    }));
  }, [menuSections, menuItems]);

  // Renderizado
  if (!user || !restaurantId) {
    return <div className="p-4 text-red-600">Error: Faltan datos de usuario o restaurante</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
        <button
          onClick={fetchData}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />
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
        aria-label="Generar código QR"
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
        {/* Configuración */}
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
              aria-label="Nombre del restaurante"
            />
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogoUpload}
                className="w-full p-1 border rounded-lg text-xs"
                disabled={uploading}
                aria-label="Subir logo del restaurante"
              />
              {logo && (
                <img
                  src={logo}
                  alt="Logo del restaurante"
                  className="mt-2 w-16 h-16 rounded-full object-cover mx-auto shadow-sm"
                  onError={(e) => (e.target.src = "/placeholder-image.png")}
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
                  aria-label="Seleccionar color primario"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Color Secundario</label>
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-full h-10 rounded-md border"
                  aria-label="Seleccionar color secundario"
                />
              </div>
            </div>
            <select
              value={selectedTemplate?.type || ""}
              onChange={handleTemplateChange}
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
              aria-label="Seleccionar plantilla"
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
              onClick={saveConfig}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:bg-gray-400"
              disabled={loading || uploading}
              aria-label="Guardar configuración"
            >
              Guardar Configuración
            </button>
          </div>
        </motion.div>

        {/* Editor de Menú */}
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
              aria-label={showPreview ? "Volver a editar" : "Previsualizar"}
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
                    alt="Logo del restaurante"
                    className="w-20 h-20 rounded-full mx-auto mb-2 shadow-md"
                    onError={(e) => (e.target.src = "/placeholder-image.png")}
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
                          <MediaViewer item={item} />
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
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del Plato"
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  required
                  aria-label="Nombre del plato"
                />
                <input
                  type="number"
                  name="price"
                  value={newItem.price}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="S/."
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  step="0.01"
                  min="0"
                  required
                  aria-label="Precio del plato"
                />
                <select
                  name="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
                  required
                  aria-label="Categoría del plato"
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
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción"
                  className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 sm:col-span-3"
                  aria-label="Descripción del plato"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,model/gltf-binary,.glb"
                  onChange={handleImageUpload}
                  className="p-1 border rounded-lg text-xs sm:col-span-2"
                  disabled={uploading}
                  aria-label="Subir imagen o modelo 3D"
                />
                <div className="flex gap-2 sm:col-span-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:bg-gray-400"
                    disabled={loading || uploading}
                    aria-label={editingItem ? "Actualizar plato" : "Agregar plato"}
                  >
                    {editingItem ? "Actualizar Plato" : "Agregar Plato"}
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
                      aria-label="Cancelar edición"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
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
                            aria-label="Renombrar sección"
                          />
                          <button
                            onClick={() => handleRenameSection(section, newSectionName)}
                            className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                            aria-label="Confirmar renombramiento de sección"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSection(null)}
                            className="p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                            aria-label="Cancelar renombramiento de sección"
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
                              aria-label={`Editar sección ${section}`}
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => {
                                setNewSectionName("");
                                setEditingSection(`new-${section}`);
                              }}
                              className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                              aria-label={`Agregar nueva sección después de ${section}`}
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section)}
                              className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                              aria-label={`Eliminar sección ${section}`}
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
                          aria-label="Nombre de la nueva sección"
                        />
                        <button
                          onClick={() => handleAddSection(newSectionName)}
                          className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                          aria-label="Confirmar nueva sección"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                          aria-label="Cancelar nueva sección"
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
                            <MediaViewer item={item} />
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
                                aria-label={`Editar ítem ${item.name}`}
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                aria-label={`Eliminar ítem ${item.name}`}
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

      {/* Modal QR */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-4 rounded-xl w-full max-w-xs shadow-lg"
            >
              <h4 id="qr-modal-title" className="text-lg font-bold mb-3 text-gray-800">
                Código QR
              </h4>
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
                  aria-label="Descargar código QR"
                >
                  Descargar
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                  aria-label="Cerrar modal de código QR"
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







