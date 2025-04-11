import React, { useState, useEffect, useCallback, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaQrcode, FaEye, FaEyeSlash, FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import api from "@/services/api";
import ConfigEditor from "./MenuEditor/ConfigEditor";
import MenuPreview from "./MenuEditor/MenuPreview";
import QRModal from "./MenuEditor/QRModal";
import { FixedSizeList as List } from "react-window";
import { DragDropContext } from "@hello-pangea/dnd";

// Utilidades
const safeParseJSON = (data, defaultValue) => {
  if (!data) return defaultValue;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error al parsear JSON:", e.message);
      return defaultValue;
    }
  }
  return data;
};

const normalizeSections = (sections) => {
  if (!sections) return [];
  if (Array.isArray(sections)) return sections;
  return Object.entries(sections).map(([section, items]) => ({
    section,
    items: Array.isArray(items) ? items : [],
  }));
};

// Estado inicial y reducer para ItemModal
const itemModalInitialState = {
  formData: { name: "", description: "", price: "", category: "", imageUrl: "" },
  imageFile: null,
  errors: {},
  isUploading: false,
  newCategory: "", // Para agregar nuevas secciones
};

const itemModalReducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM_DATA":
      return { ...state, formData: action.payload, errors: {} };
    case "UPDATE_FORM_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: null },
      };
    case "SET_IMAGE_FILE":
      return { ...state, imageFile: action.payload, formData: { ...state.formData, imageUrl: action.previewUrl } };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "SET_UPLOADING":
      return { ...state, isUploading: action.payload };
    case "SET_NEW_CATEGORY":
      return { ...state, newCategory: action.payload };
    case "RESET":
      return { ...itemModalInitialState, formData: { ...itemModalInitialState.formData, category: action.defaultCategory || "" } };
    default:
      return state;
  }
};

// Componente ItemModal optimizado y con diseño mejorado
const ItemModal = ({
  show,
  onClose,
  item,
  onSave,
  categories = [],
  mode = "add",
  restaurantId,
  sections = [],
  colors = { primary: "#F97316", secondary: "#FF9800" },
  templateData = {},
}) => {
  const [state, dispatch] = useReducer(itemModalReducer, itemModalInitialState);
  const availableSections = sections.map((s) => s.section); // Usar secciones actuales

  useEffect(() => {
    const defaultCategory = availableSections.length > 0 ? availableSections[0] : "";
    if (mode === "edit" && item) {
      dispatch({
        type: "SET_FORM_DATA",
        payload: {
          name: item.name || "",
          description: item.description || "",
          price: item.price || "",
          category: item.category || defaultCategory,
          imageUrl: item.imageUrl || "",
        },
      });
    } else if (mode === "add" && templateData.fields) {
      const firstSection = Object.entries(templateData.fields).find(([_, items]) => items.length > 0);
      const defaultItem = firstSection ? firstSection[1][0] : {};
      dispatch({
        type: "SET_FORM_DATA",
        payload: {
          name: defaultItem.name || "",
          description: defaultItem.description || "",
          price: defaultItem.price || "",
          category: firstSection ? firstSection[0] : defaultCategory,
          imageUrl: defaultItem.imageUrl || "",
        },
      });
    } else {
      dispatch({ type: "RESET", defaultCategory });
    }
  }, [item, mode, templateData, availableSections]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: "UPDATE_FORM_FIELD", field: name, value: name === "price" ? Number(value) : value });
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      dispatch({ type: "SET_IMAGE_FILE", payload: file, previewUrl });
    }
  }, []);

  const handleNewCategoryChange = useCallback((e) => {
    dispatch({ type: "SET_NEW_CATEGORY", payload: e.target.value });
  }, []);

  const addNewCategory = useCallback(() => {
    if (state.newCategory && !availableSections.includes(state.newCategory)) {
      dispatch({ type: "UPDATE_FORM_FIELD", field: "category", value: state.newCategory });
      dispatch({ type: "SET_NEW_CATEGORY", payload: "" });
    }
  }, [state.newCategory, availableSections]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!state.formData.name) newErrors.name = "El nombre es obligatorio";
    if (state.formData.name.length > 50) newErrors.name = "Máximo 50 caracteres";
    if (!state.formData.price || state.formData.price <= 0) newErrors.price = "El precio debe ser mayor a 0";
    if (state.formData.price > 10000) newErrors.price = "Máximo 10,000";
    if (!state.formData.category) newErrors.category = "La sección es obligatoria";
    dispatch({ type: "SET_ERRORS", payload: newErrors });
    return Object.keys(newErrors).length === 0;
  }, [state.formData]);

  const uploadImage = useCallback(async (file) => {
    dispatch({ type: "SET_UPLOADING", payload: true });
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", "menu_items");
    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/delzhsy0h/image/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      dispatch({ type: "SET_ERRORS", payload: { submit: "Error al subir la imagen" } });
      return null;
    } finally {
      dispatch({ type: "SET_UPLOADING", payload: false });
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      let imageUrl = state.formData.imageUrl;
      if (state.imageFile) {
        imageUrl = await uploadImage(state.imageFile);
        if (!imageUrl) return;
      }

      const itemToSave = {
        ...state.formData,
        imageUrl: imageUrl || state.formData.imageUrl || "",
        id: mode === "edit" ? item?.id : undefined,
      };
      onSave(itemToSave);
      onClose();
    },
    [state.formData, state.imageFile, mode, item, onSave, onClose, validateForm, uploadImage]
  );

  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
        style={{ backgroundColor: colors.secondary }}
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <header className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ color: colors.primary }}>
            {mode === "add" ? "Agregar Platillo" : "Editar Platillo"}
          </h3>
          <motion.button
            onClick={onClose}
            style={{ color: colors.primary }}
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTimes size={24} />
          </motion.button>
        </header>

        <form className="flex-1 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
              Nombre
            </label>
            <input
              type="text"
              name="name"
              value={state.formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ borderColor: colors.primary, focusRingColor: colors.primary }}
              placeholder="Ej. Ceviche Clásico"
            />
            {state.errors.name && <p className="text-red-500 text-xs">{state.errors.name}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
              Descripción
            </label>
            <textarea
              name="description"
              value={state.formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ borderColor: colors.primary }}
              rows={3}
              placeholder="Ej. Ceviche fresco con pescado del día..."
            />
          </div>

          {/* Precio */}
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
              Precio (S/.)
            </label>
            <input
              type="number"
              name="price"
              value={state.formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ borderColor: colors.primary }}
              placeholder="Ej. 35.50"
            />
            {state.errors.price && <p className="text-red-500 text-xs">{state.errors.price}</p>}
          </div>

          {/* Sección */}
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
              Sección
            </label>
            <div className="relative">
              <select
                name="category"
                value={state.formData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-all appearance-none bg-white"
                style={{ borderColor: colors.primary }}
              >
                <option value="">Selecciona una sección</option>
                {availableSections.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={state.newCategory}
                onChange={handleNewCategoryChange}
                placeholder="Nueva sección"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ borderColor: colors.primary }}
              />
              <motion.button
                type="button"
                onClick={addNewCategory}
                className="p-2 text-white rounded-lg"
                style={{ backgroundColor: colors.primary }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!state.newCategory || availableSections.includes(state.newCategory)}
              >
                <FaPlus />
              </motion.button>
            </div>
            {state.errors.category && <p className="text-red-500 text-xs">{state.errors.category}</p>}
          </div>

          {/* Imagen */}
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
              Imagen
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all"
              style={{ borderColor: colors.primary }}
            />
            {state.formData.imageUrl && (
              <motion.img
                src={state.formData.imageUrl}
                alt="Vista previa"
                className="mt-2 w-24 h-24 object-cover rounded-lg shadow-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>
        </form>

        <footer className="mt-6 flex gap-3">
          <motion.button
            onClick={handleSubmit}
            className="flex-1 py-2 text-white rounded-lg font-medium shadow-md flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            whileHover={{ scale: 1.05, boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            disabled={state.isUploading}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {state.isUploading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              </svg>
            ) : null}
            {state.isUploading ? "Subiendo..." : mode === "add" ? "Agregar" : "Guardar"}
          </motion.button>
          <motion.button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium shadow-md"
            whileHover={{ scale: 1.05, boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Cancelar
          </motion.button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

// Componente MenuSections (sin cambios significativos aquí por ahora)
const MenuSections = React.memo(({
  sections = [],
  restaurantId,
  fontFamily = "Roboto",
  colors = {},
  onDeleteItem,
  onEditItem,
  onAddItem,
  templateSections = [],
}) => {
  const primaryColor = colors.primary || "#FF9800";
  const secondaryColor = colors.secondary || "#4CAF50";
  const [state, setState] = useState({
    activeSection: null,
    newItem: { name: "", price: "", description: "", section: "" },
    error: null,
  });

  const handleAddItem = useCallback((section) => {
    setState({ activeSection: section, newItem: { name: "", price: "", description: "", section }, error: null });
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, newItem: { ...prev.newItem, [name]: value } }));
  }, []);

  const handleSaveNewItem = useCallback(async () => {
    if (!state.newItem.name || !state.newItem.price) {
      setState((prev) => ({ ...prev, error: "Nombre y Precio son obligatorios." }));
      return;
    }

    const itemToAdd = {
      name: state.newItem.name,
      price: Number(state.newItem.price),
      description: state.newItem.description || "",
      category: state.newItem.section,
    };

    try {
      const response = await api.post(`/restaurantes/${restaurantId}/items`, itemToAdd);
      const itemWithId = { ...itemToAdd, id: response.data.id };
      onAddItem(itemWithId);
      setState({ activeSection: null, newItem: { name: "", price: "", description: "", section: "" }, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Error al agregar el ítem." }));
    }
  }, [state.newItem, restaurantId, onAddItem]);

  const allSections = sections.length > 0 ? sections : templateSections;

  if (!allSections.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md text-gray-500 text-center"
      >
        No hay secciones disponibles.
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 bg-gray-50 rounded-xl shadow-lg h-full overflow-y-auto"
    >
      {allSections.map(({ section, items = [] }) => (
        <div key={section} className="bg-white rounded-lg p-6 shadow-md">
          <h4
            className="text-xl font-semibold mb-4 sticky top-0 bg-white z-10 pb-2 border-b"
            style={{ color: primaryColor, fontFamily }}
          >
            {section}
          </h4>

          {items.length ? (
            <List height={400} itemCount={items.length} itemSize={130} width="100%">
              {({ index, style }) => {
                const item = items[index];
                return (
                  <motion.div
                    style={style}
                    className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg mb-2 shadow-sm hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={item.imageUrl || "/placeholder-image.png"}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover shadow-sm"
                      onError={(e) => (e.target.src = "/placeholder-image.png")}
                    />
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description || "Sin descripción"}
                      </p>
                      <span className="text-base font-medium text-gray-900">
                        S/. {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => onEditItem(section, item)}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Editar ${item.name}`}
                      >
                        <FaEdit />
                      </motion.button>
                      <motion.button
                        onClick={() => onDeleteItem(section, item.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              }}
            </List>
          ) : (
            <p className="text-sm text-gray-500 italic">No hay ítems en esta sección.</p>
          )}

          <motion.button
            onClick={() => handleAddItem(section)}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
            style={{ backgroundColor: secondaryColor }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlus /> Agregar Ítem
          </motion.button>

          {state.activeSection === section && (
            <motion.div
              className="mt-4 p-4 bg-gray-100 rounded-lg space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {[
                { name: "name", label: "Nombre", type: "text" },
                { name: "price", label: "Precio", type: "number", step: "0.01", min: "0" },
                { name: "description", label: "Descripción", type: "textarea" },
              ].map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700" style={{ color: primaryColor }}>
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      placeholder={field.label}
                      value={state.newItem[field.name]}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.label}
                      value={state.newItem[field.name]}
                      onChange={handleChange}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      step={field.step}
                      min={field.min}
                    />
                  )}
                </div>
              ))}
              <motion.button
                onClick={handleSaveNewItem}
                className="w-full py-3 text-white rounded-lg font-medium"
                style={{ backgroundColor: primaryColor }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Guardar Ítem
              </motion.button>
              {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
});

// Componente principal MenuManager
const MenuManager = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState("add");
  const [editItem, setEditItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [nameFont, setNameFont] = useState("Lobster");
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (isItemModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isItemModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || restaurantId === "0") {
        setError("ID de restaurante inválido.");
        setLoading(false);
        return;
      }
      try {
        const [restaurantResponse, itemsResponse, templatesResponse] = await Promise.all([
          api.get(`/restaurantes/${restaurantId}`),
          api.get(`/restaurantes/${restaurantId}/items`),
          api.get("/templates"),
        ]);
        const restaurant = restaurantResponse.data;
        const items = itemsResponse.data;
        const uniqueCategories = [...new Set(items.map((item) => item.category))];
        const colors = safeParseJSON(restaurant.colors, { primary: "#F97316", secondary: "#FF9800" });
        const sections = normalizeSections(safeParseJSON(restaurant.sections, []));
        setRestaurantData({
          ...restaurant,
          sections,
          categories: uniqueCategories.length > 0 ? uniqueCategories : restaurant.categories || [],
          colors,
          fontFamily: restaurant.font_family || "Roboto",
          templateId: restaurant.template_id || null,
          name: restaurant.name || "",
          logo_url: restaurant.logo_url || "",
          nameFont: restaurant.name_font || "Lobster",
        });
        setTemplates(templatesResponse.data);
        console.log("📋 Datos iniciales cargados - Secciones normalizadas:", sections);
        console.log("📋 Plantillas cargadas:", templatesResponse.data);
      } catch (error) {
        setError("No se pudo conectar al servidor. Por favor, revisa tu conexión o intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleAddItem = useCallback((newItem) => {
    const updatedSections = restaurantData.sections.some((s) => s.section === newItem.category)
      ? restaurantData.sections.map((section) =>
          section.section === newItem.category ? { ...section, items: [...section.items, newItem] } : section
        )
      : [...restaurantData.sections, { section: newItem.category, items: [newItem] }];
    setRestaurantData((prev) => ({
      ...prev,
      sections: updatedSections,
      categories: [...new Set([...prev.categories, newItem.category])],
    }));
  }, [restaurantData]);

  const handleEditItem = useCallback((sectionName, item) => {
    setEditItem({ ...item, section: sectionName });
    setItemModalMode("edit");
    setIsItemModalOpen(true);
  }, []);

  const handleSaveItem = useCallback(
    async (itemData) => {
      try {
        let updatedItem;
        if (itemModalMode === "add") {
          const response = await api.post(`/restaurantes/${restaurantId}/items`, itemData);
          updatedItem = { ...itemData, id: response.data.id };
          handleAddItem(updatedItem);
        } else if (itemModalMode === "edit") {
          const response = await api.put(`/restaurantes/${restaurantId}/items/${itemData.id}`, itemData);
          updatedItem = response.data;
          const updatedSections = restaurantData.sections.map((section) => {
            if (section.section === editItem.section) {
              // Eliminar el ítem de la sección original si cambió de sección
              const items = section.items.filter((item) => item.id !== itemData.id);
              return { ...section, items };
            }
            if (section.section === itemData.category) {
              // Agregar o actualizar el ítem en la nueva sección
              const items = section.items.some((item) => item.id === itemData.id)
                ? section.items.map((item) => (item.id === itemData.id ? updatedItem : item))
                : [...section.items, updatedItem];
              return { ...section, items };
            }
            return section;
          });
          // Si la sección no existe, crearla
          if (!updatedSections.some((s) => s.section === itemData.category)) {
            updatedSections.push({ section: itemData.category, items: [updatedItem] });
          }
          setRestaurantData((prev) => ({
            ...prev,
            sections: updatedSections,
            categories: [...new Set([...prev.categories, itemData.category])],
          }));
        }
        setIsItemModalOpen(false);
      } catch (error) {
        console.error("Error al guardar ítem:", error);
        setError("No se pudo guardar el ítem. Intenta de nuevo.");
      }
    },
    [itemModalMode, restaurantId, restaurantData, editItem, handleAddItem]
  );

  const handleDeleteItem = useCallback(
    async (sectionName, itemId) => {
      try {
        await api.delete(`/restaurantes/${restaurantId}/items/${itemId}`);
        setRestaurantData((prev) => ({
          ...prev,
          sections: prev.sections.map((section) =>
            section.section === sectionName ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section
          ),
        }));
      } catch (error) {
        console.error("Error al eliminar ítem:", error);
        setError("No se pudo eliminar el ítem. Intenta de nuevo.");
      }
    },
    [restaurantId]
  );

  const saveConfig = useCallback(async () => {
    try {
      const payload = {
        name: restaurantData.name || "Sin Nombre",
        logo_url: restaurantData.logo_url || null,
        colors: restaurantData.colors || { primary: "#F97316", secondary: "#FF9800" },
        sections: restaurantData.sections || [],
        templateId: restaurantData.templateId || null,
        fontFamily: restaurantData.fontFamily || "Roboto",
        nameFont: restaurantData.nameFont || "Lobster",
      };
      const response = await api.put(`/restaurantes/${restaurantId}`, payload);
      const updatedRestaurant = response.data.restaurant;
      setRestaurantData((prev) => ({
        ...prev,
        ...updatedRestaurant,
        colors: safeParseJSON(updatedRestaurant.colors, prev.colors),
        sections: normalizeSections(safeParseJSON(updatedRestaurant.sections, prev.sections)),
      }));
      console.log("✅ Configuración guardada:", response.data);
    } catch (error) {
      setError("Error al guardar la configuración. Por favor, intenta de nuevo.");
      console.error("❌ Error al guardar configuración:", error);
    }
  }, [restaurantId, restaurantData]);

  const handleUpdateSections = useCallback((updatedSections) => {
    setRestaurantData((prev) => ({
      ...prev,
      sections: updatedSections,
    }));
  }, []);

  if (loading) return <div className="text-center text-gray-600 py-10">Cargando datos...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  console.log("📋 Renderizando MenuSections con secciones:", restaurantData.sections);

  const selectedTemplate = templates.find((t) => t.id === restaurantData?.templateId) || {};
  const templateSections = selectedTemplate.fields ? normalizeSections(selectedTemplate.fields) : [];

  return (
    <DragDropContext>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-2 sm:p-4 md:p-6 flex flex-col"
        style={{ fontFamily: restaurantData?.fontFamily || "Roboto" }}
      >
        <div className="w-full mx-auto flex-grow space-y-4">
          <motion.header className="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
            <h2
              className="text-lg sm:text-xl md:text-2xl font-bold truncate"
              style={{ color: restaurantData?.colors?.primary || "#F97316", fontFamily: nameFont }}
            >
              {restaurantData?.name || "Gestión del Menú"}
            </h2>
            <div className="flex gap-2 sm:gap-3">
              <motion.button
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPreviewOpen ? <FaEyeSlash /> : <FaEye />}
                {isPreviewOpen ? "Ocultar" : "Previa"}
              </motion.button>
              <motion.button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaQrcode />
                QR
              </motion.button>
            </div>
          </motion.header>

          <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-120px)] w-full">
            <div className="lg:w-1/3 w-full p-4 bg-white rounded-xl shadow-lg flex-shrink-0 min-h-0 h-full">
              <ConfigEditor
                restaurantId={restaurantId}
                restaurantData={restaurantData}
                onUpdate={setRestaurantData}
                nameFont={nameFont}
                setNameFont={setNameFont}
                saveConfig={saveConfig}
                isLoading={loading}
                setIsLoading={setLoading}
              />
            </div>
            <div className="lg:w-2/3 w-full p-4 bg-white rounded-xl shadow-lg flex-grow min-h-0 h-full">
              <MenuSections
                sections={restaurantData?.sections || []}
                restaurantId={restaurantId}
                fontFamily={restaurantData?.fontFamily || "Roboto"}
                colors={restaurantData?.colors || selectedTemplate.default_colors || { primary: "#F97316", secondary: "#FF9800" }}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onEditItem={handleEditItem}
                templateSections={templateSections}
                onUpdateSections={handleUpdateSections}
              />
            </div>
          </div>
        </div>

        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto"
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

        <motion.button
          onClick={() => setIsQRModalOpen(true)}
          className="fixed bottom-4 right-4 p-3 rounded-full text-white shadow-lg"
          style={{ backgroundColor: restaurantData?.colors?.primary || "#F97316" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaQrcode size={20} />
        </motion.button>

        {isQRModalOpen && (
          <QRModal restaurantId={restaurantId} onClose={() => setIsQRModalOpen(false)} colors={restaurantData?.colors || {}} />
        )}

        {isItemModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
              colors={restaurantData?.colors || selectedTemplate.default_colors || { primary: "#F97316", secondary: "#FF9800" }}
              templateData={selectedTemplate}
            />
          </motion.div>
        )}
      </motion.div>
    </DragDropContext>
  );
};

export default MenuManager;




