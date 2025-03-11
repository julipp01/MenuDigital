import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import ThreeDViewer from "@/components/ThreeDViewer";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <h2>Algo salió mal:</h2>
          <p>{this.state.error?.message || "Error desconocido"}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 p-2 bg-red-600 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://192.168.18.26:5000";

const EditableSections = React.memo(({ sections, setSections, onSaveSections }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [newName, setNewName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");

  const handleRename = useCallback((oldKey, newKey) => {
    if (!newKey.trim()) return toast.error("El nombre no puede estar vacío.");
    if (sections[newKey] && oldKey !== newKey) return toast.error("Ya existe una sección con ese nombre.");
    const updated = {};
    Object.entries(sections).forEach(([key, items]) => {
      updated[key === oldKey ? newKey : key] = items;
    });
    setSections(updated);
    onSaveSections(updated);
    setEditingKey(null);
    setNewName("");
  }, [sections, setSections, onSaveSections]);

  const handleDelete = useCallback((key) => {
    if (window.confirm("¿Seguro que quieres eliminar esta sección?")) {
      const updated = { ...sections };
      delete updated[key];
      setSections(updated);
      onSaveSections(updated);
    }
  }, [sections, setSections, onSaveSections]);

  const handleAddSection = useCallback(() => {
    if (!newSectionName.trim()) return toast.error("Ingrese el nombre de la nueva sección.");
    if (sections[newSectionName]) return toast.error("La sección ya existe.");
    const updated = { ...sections, [newSectionName]: [] };
    setSections(updated);
    onSaveSections(updated);
    setNewSectionName("");
  }, [newSectionName, sections, setSections, onSaveSections]);

  return (
    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-xl font-bold mb-2">Editar Secciones</h3>
      <ul>
        {Object.keys(sections).map((key) => (
          <li key={key} className="flex items-center mb-2">
            {editingKey === key ? (
              <>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="p-2 border rounded flex-1"
                  placeholder="Nuevo nombre"
                />
                <button onClick={() => handleRename(key, newName)} className="ml-2 text-green-600">
                  Guardar
                </button>
                <button onClick={() => setEditingKey(null)} className="ml-2 text-gray-600">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span
                  className="flex-1 cursor-pointer"
                  onDoubleClick={() => {
                    setEditingKey(key);
                    setNewName(key);
                  }}
                >
                  {key}
                </span>
                <button
                  onClick={() => {
                    setEditingKey(key);
                    setNewName(key);
                  }}
                  className="ml-2 text-blue-600"
                >
                  Editar
                </button>
                <button onClick={() => handleDelete(key)} className="ml-2 text-red-600">
                  Eliminar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex mt-2">
        <input
          type="text"
          placeholder="Nueva sección"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          className="p-2 border rounded flex-1"
        />
        <button onClick={handleAddSection} className="ml-2 bg-green-600 text-white p-2 rounded">
          Agregar
        </button>
      </div>
    </div>
  );
});

const MenuEditor = ({ restaurantId }) => {
  const { user } = useAuth();
  const [menuSections, setMenuSections] = useState({
    "Platos Principales": [],
    "Postres": [],
    "Bebidas": [],
  });
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
  const [planId, setPlanId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loading, setLoading] = useState({ fetch: false, save: false, upload: false });
  const qrRef = React.useRef(null);

  const menuItems = React.useMemo(
    () =>
      Object.entries(menuSections).flatMap(([category, items]) =>
        items.map((item) => ({ ...item, category }))
      ),
    [menuSections]
  );

  const fetchTemplates = async () => {
    const response = await api.get("/templates");
    return response.data;
  };

  const fetchRestaurant = async () => {
    const response = await api.get(`/restaurantes/${restaurantId}`);
    return response.data[0] || {};
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get(`/menu/${restaurantId}`);
      return response.data.items || [];
    } catch (error) {
      console.warn("No se encontraron ítems:", error);
      return [];
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const [templates, restaurantData, items] = await Promise.all([
        fetchTemplates(),
        fetchRestaurant(),
        fetchMenuItems(),
      ]);
      const template = templates.find((t) => t.id === restaurantData.template_id) || templates[0];
      setTemplates(templates);
      setSelectedTemplate(template);
      setColors(restaurantData.colors || template.default_colors);
      setRestaurantName(restaurantData.name || "Mi Restaurante");
      setLogo(restaurantData.logo_url || null);
      setPlanId(restaurantData.plan_id || null);
      const initialSections = restaurantData.sections || template.fields || {
        "Platos Principales": [],
        "Postres": [],
        "Bebidas": [],
      };
      const updatedSections = { ...initialSections };
      items.forEach((item) => {
        if (!updatedSections[item.category]) updatedSections[item.category] = [];
        updatedSections[item.category].push({
          ...item,
          imageUrl: item.imageUrl || item.image_url || "",
        });
      });
      setMenuSections(updatedSections);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar datos.");
    } finally {
      setLoading((prev) => ({ ...prev, fetch: false }));
    }
  }, [restaurantId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSections = async (updatedSections) => {
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      await api.put(`/restaurantes/${restaurantId}`, {
        name: restaurantName,
        colors,
        logo,
        sections: updatedSections,
        plan_id: planId,
      });
      toast.success("Secciones actualizadas.");
    } catch (error) {
      console.error("Error actualizando secciones:", error);
      toast.error("Error al actualizar secciones.");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleSaveConfig = async () => {
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      await api.put(`/restaurantes/${restaurantId}`, {
        name: restaurantName,
        colors,
        logo,
        sections: menuSections,
        plan_id: planId,
      });
      toast.success("Configuración guardada con éxito.");
    } catch (error) {
      console.error("Error guardando configuración:", error);
      toast.error("Error al guardar la configuración.");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024 || !file.type.match(/image\/(jpeg|png)/)) {
      toast.error("Solo se permiten imágenes JPEG/PNG, máximo 5MB.");
      return;
    }
    const formData = new FormData();
    formData.append("logo", file);
    setLoading((prev) => ({ ...prev, upload: true }));
    try {
      const response = await api.post(`/restaurantes/${restaurantId}/upload-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const logoUrl = response.data.logoUrl || response.data.imageUrl || "";
      console.log("Logo URL:", `${BASE_URL}${logoUrl}`);
      setLogo(logoUrl);
      toast.success("Logo subido con éxito.");
    } catch (error) {
      console.error("Error subiendo logo:", error);
      toast.error("Error al subir el logo.");
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  const handleTemplateChange = useCallback((e) => {
    const type = e.target.value;
    const template = templates.find((t) => t.type === type) || templates[0];
    setSelectedTemplate(template);
    setColors(template.default_colors);
    setMenuSections(template.fields || { "Platos Principales": [], "Postres": [], "Bebidas": [] });
  }, [templates]);

  const handleAddOrUpdateItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Faltan campos obligatorios.");
      return;
    }
    const url = editingItem ? `/menu/${restaurantId}/${editingItem.id}` : `/menu/${restaurantId}`;
    const method = editingItem ? "PUT" : "POST";
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      const response = await api.request({ method, url, data: newItem });
      const updatedItem = { ...response.data, imageUrl: response.data.imageUrl || response.data.image_url || "" };
      const updatedSections = { ...menuSections };
      if (!updatedSections[newItem.category]) updatedSections[newItem.category] = [];
      if (editingItem) {
        updatedSections[newItem.category] = updatedSections[newItem.category].map((item) =>
          item.id === editingItem.id ? updatedItem : item
        );
      } else {
        updatedSections[newItem.category].push(updatedItem);
      }
      setMenuSections(updatedSections);
      setNewItem({ name: "", price: "", description: "", category: "Platos Principales", imageUrl: "" });
      setEditingItem(null);
      setShowEditModal(false);
      toast.success(`Ítem ${editingItem ? "actualizado" : "agregado"} con éxito.`);
    } catch (error) {
      console.error("Error guardando ítem:", error);
      toast.error("Error al guardar el ítem.");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("No se seleccionó ningún archivo.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo demasiado grande (máx. 10MB).");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "model/gltf-binary"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".glb")) {
      toast.error("Solo se permiten JPEG, PNG o GLB.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setLoading((prev) => ({ ...prev, upload: true }));
    try {
      const response = await api.post(`/menu/${restaurantId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = response.data.fileUrl || response.data.imageUrl || "";
      console.log("Archivo subido URL:", `${BASE_URL}${fileUrl}`);
      setNewItem((prev) => ({ ...prev, imageUrl: fileUrl }));
      toast.success("Archivo subido con éxito.");
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast.error("Error al subir el archivo.");
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ítem?")) return;
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      await api.delete(`/menu/${restaurantId}/${id}`);
      const updatedSections = { ...menuSections };
      Object.keys(updatedSections).forEach((category) => {
        updatedSections[category] = updatedSections[category].filter((item) => item.id !== id);
      });
      setMenuSections(updatedSections);
      toast.success("Ítem eliminado con éxito.");
    } catch (error) {
      console.error("Error eliminando ítem:", error);
      toast.error("Error al eliminar el ítem.");
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current);
      const link = document.createElement("a");
      link.download = `qr_carta_${restaurantId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR descargado con éxito.");
    } catch (error) {
      console.error("Error descargando QR:", error);
      toast.error("Error al descargar el QR.");
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <ToastContainer />
        {loading.fetch && (
          <div className="absolute inset-0 bg-gray-200 opacity-50 flex items-center justify-center">
            Cargando datos...
          </div>
        )}

        {/* Configuración del restaurante */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h3 className="text-3xl font-serif font-bold text-center mb-6" style={{ color: colors.primary }}>
            Configurar Restaurante
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block mb-1 font-medium">Nombre</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {loading.upload && <p className="text-sm text-gray-500">Subiendo...</p>}
              {logo && (
                <img
                  src={`${BASE_URL}${logo}`}
                  alt="Logo"
                  className="mt-2 w-16 h-16 rounded-full object-cover"
                  onError={(e) => (e.target.src = "/fallback-logo.png")}
                />
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Colores</label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors((prev) => ({ ...prev, primary: e.target.value }))}
                  className="w-12 h-12 border rounded-lg"
                />
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors((prev) => ({ ...prev, secondary: e.target.value }))}
                  className="w-12 h-12 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Plantilla</label>
              <select
                value={selectedTemplate?.type || ""}
                onChange={handleTemplateChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.type}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={loading.save}
            className="mt-4 w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading.save ? "Guardando..." : "Guardar Configuración"}
          </button>
        </motion.section>

        {/* Edición dinámica de secciones */}
        <EditableSections sections={menuSections} setSections={setMenuSections} onSaveSections={saveSections} />

        {/* Edición de la carta */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h3 className="text-3xl font-serif font-bold text-center mb-6" style={{ color: colors.primary }}>
            Editar Carta
          </h3>
          <form onSubmit={handleAddOrUpdateItem} className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre del plato"
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="number"
              name="price"
              value={newItem.price}
              onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Precio (S/.)"
              className="p-3 border rounded-lg"
              step="0.01"
              required
            />
            <input
              type="text"
              name="description"
              value={newItem.description}
              onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción"
              className="p-3 border rounded-lg col-span-2"
            />
            <select
              name="category"
              value={newItem.category}
              onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
              className="p-3 border rounded-lg"
              required
            >
              {Object.keys(menuSections).map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/jpeg,image/png,model/gltf-binary,.glb"
              onChange={handleImageUpload}
              className="p-3 border rounded-lg"
            />
            {newItem.imageUrl && (
              <div className="col-span-2">
                {newItem.imageUrl.endsWith(".glb") ? (
                  <ThreeDViewer modelUrl={`${BASE_URL}${newItem.imageUrl}`} autoRotate={true} />
                ) : (
                  <img
                    src={`${BASE_URL}${newItem.imageUrl}`}
                    alt="Vista previa"
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => (e.target.src = "/fallback-image.png")}
                  />
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={loading.save}
              className="col-span-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading.save ? "Guardando..." : editingItem ? "Actualizar" : "Agregar"} Ítem
            </button>
          </form>

          <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-serif font-bold" style={{ color: colors.primary }}>
                {restaurantName}
              </h2>
              {logo && (
                <img
                  src={`${BASE_URL}${logo}`}
                  alt="Logo"
                  className="mx-auto mt-4 w-24 h-24 rounded-full object-cover"
                  onError={(e) => (e.target.src = "/fallback-logo.png")}
                />
              )}
            </div>
            {Object.entries(menuSections).map(([section, items]) => (
              <div key={section} className="mb-6">
                <h3
                  className="text-2xl font-semibold mb-4 border-b-2 pb-2"
                  style={{ color: colors.primary, borderColor: colors.secondary }}
                >
                  {section}
                </h3>
                <ul className="space-y-4">
                  {items.map((item) => {
                    const imageSrc = item.imageUrl || item.image_url || "";
                    console.log(`Rendering item ${item.name} with image: ${imageSrc ? `${BASE_URL}${imageSrc}` : "Sin imagen"}`);
                    return (
                      <li key={item.id || item.name} className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center space-x-4">
                          {imageSrc ? (
                            imageSrc.endsWith(".glb") ? (
                              <div className="w-20 h-20">
                                <ThreeDViewer modelUrl={`${BASE_URL}${imageSrc}`} autoRotate={true} />
                              </div>
                            ) : (
                              <img
                                src={`${BASE_URL}${imageSrc}`}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => (e.target.src = "/fallback-image.png")}
                              />
                            )
                          ) : (
                            <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-xs text-gray-500">
                              Sin imagen
                            </span>
                          )}
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.description || "Sin descripción"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span style={{ color: colors.secondary }}>S/. {item.price}</span>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setNewItem({ ...item, imageUrl: imageSrc });
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Modal de edición de ítems */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div className="bg-white p-6 rounded-lg w-full max-w-lg" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h4 className="text-xl font-bold mb-4">Editar {editingItem?.name || "Ítem"}</h4>
              <form onSubmit={handleAddOrUpdateItem} className="grid gap-4">
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  className="p-3 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  name="price"
                  value={newItem.price}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                  className="p-3 border rounded-lg"
                  step="0.01"
                  required
                />
                <input
                  type="text"
                  name="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  className="p-3 border rounded-lg"
                />
                <select
                  name="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                  className="p-3 border rounded-lg"
                  required
                >
                  {Object.keys(menuSections).map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  accept="image/jpeg,image/png,model/gltf-binary,.glb"
                  onChange={handleImageUpload}
                  className="p-3 border rounded-lg"
                />
                {newItem.imageUrl && (
                  <div>
                    {newItem.imageUrl.endsWith(".glb") ? (
                      <ThreeDViewer modelUrl={`${BASE_URL}${newItem.imageUrl}`} autoRotate={true} />
                    ) : (
                      <img
                        src={`${BASE_URL}${newItem.imageUrl}`}
                        alt="Vista previa"
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => (e.target.src = "/fallback-image.png")}
                      />
                    )}
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    disabled={loading.save}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {loading.save ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal de código QR */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div className="bg-white p-6 rounded-lg w-full max-w-sm" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h4 className="text-xl font-bold mb-4">Código QR</h4>
              <div ref={qrRef} className="bg-white p-4 rounded-lg flex justify-center">
                <QRCodeCanvas
                  value={`${BASE_URL}/menu/${restaurantId}`}
                  size={200}
                  fgColor={colors.primary}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Escanea para ver el menú en: {BASE_URL}/menu/{restaurantId}
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={handleDownloadQR}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Descargar QR
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <button
          onClick={() => setShowQRModal(true)}
          className="mt-6 w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Generar Código QR
        </button>
      </div>
    </ErrorBoundary>
  );
};

export default MenuEditor;




