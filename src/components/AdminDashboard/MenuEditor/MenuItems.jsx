import React, { useState, useCallback, useMemo, useEffect, useReducer, memo } from "react";
import { FaTimes, FaTrash, FaEdit, FaPlus, FaSpinner, FaGripVertical } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "@/services/api";
import { toast } from "react-toastify";
import ThreeDViewer from "@/components/ThreeDViewer";

// Estado inicial para ItemModal
const itemModalInitialState = {
  formData: { name: "", description: "", price: "", category: "", imageUrl: "" },
  imageFile: null,
  errors: {},
  isUploading: false,
  uploadProgress: 0,
  success: false,
};

// Reducer para ItemModal
const itemModalReducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM_DATA": return { ...state, formData: action.payload, errors: {}, success: false };
    case "UPDATE_FORM_FIELD": return { ...state, formData: { ...state.formData, [action.field]: action.value }, errors: { ...state.errors, [action.field]: null } };
    case "SET_IMAGE_FILE": return { ...state, imageFile: action.payload, formData: { ...state.formData, imageUrl: action.previewUrl } };
    case "CLEAR_IMAGE": return { ...state, imageFile: null, formData: { ...state.formData, imageUrl: "" } };
    case "SET_ERRORS": return { ...state, errors: action.payload };
    case "SET_UPLOADING": return { ...state, isUploading: action.payload };
    case "SET_PROGRESS": return { ...state, uploadProgress: action.payload };
    case "SET_SUCCESS": return { ...state, success: action.payload };
    case "RESET": return { ...itemModalInitialState, formData: { ...itemModalInitialState.formData, category: action.defaultCategory || "" } };
    default: return state;
  }
};

// Componente SortableItem optimizado
const SortableItem = memo(({ item, section, handleOpenModal, onDeleteItem, colors }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const is3DModel = item.image_url?.endsWith('.glb');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: isDragging ? "0 12px 24px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.05)",
  };

  console.log(`[SortableItem] Renderizando item: ${item.name}, URL: ${item.image_url}`);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-4 p-4 mb-3 cursor-grab"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      key={item.id}
    >
      <FaGripVertical className="text-gray-500" size={20} />
      {is3DModel ? (
        <div className="w-32 h-32 rounded-xl overflow-hidden shadow-md border border-gray-100 relative">
          <ThreeDViewer
            key={item.image_url}
            modelUrl={item.image_url}
            scale={[0.7, 0.7, 0.7]}
            backgroundColor="#f9fafb"
            autoRotate={true}
            onError={(err) => console.error(`[SortableItem] Error cargando modelo para ${item.name}:`, err)}
          />
        </div>
      ) : (
        <img
          src={item.image_url || "/placeholder-image.png"}
          alt={item.name}
          className="w-32 h-32 rounded-xl object-cover shadow-md border border-gray-100"
          onError={(e) => (e.target.src = "/placeholder-image.png")}
        />
      )}
      <div className="flex-1">
        <p className="text-xl font-bold" style={{ color: colors.primary }}>{item.name}</p>
        <p className="text-sm text-gray-600 line-clamp-2" style={{ color: colors.secondary }}>{item.description || "Sin descripción"}</p>
        <span className="text-lg font-semibold" style={{ color: colors.primary }}>S/. {Number(item.price).toFixed(2)}</span>
      </div>
      <div className="flex gap-3">
        <motion.button
          onClick={() => handleOpenModal("edit", section, item)}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaEdit size={18} />
        </motion.button>
        <motion.button
          onClick={() => window.confirm("¿Eliminar este ítem?") && onDeleteItem(section, item.id)}
          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-800"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaTrash size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.image_url === nextProps.item.image_url &&
         prevProps.section === nextProps.section &&
         JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors);
});

SortableItem.displayName = "SortableItem";

// Componente ItemModal optimizado
const ItemModal = memo(({ show, onClose, item, onSave, mode = "add", restaurantId, sections = [], colors, fontFamily }) => {
  const [state, dispatch] = useReducer(itemModalReducer, {
    ...itemModalInitialState,
    formData: { ...itemModalInitialState.formData, category: item?.category || (sections[0]?.section || "") },
  });

  useEffect(() => {
    if (item && mode === "edit") {
      dispatch({
        type: "SET_FORM_DATA",
        payload: { name: item.name || "", description: item.description || "", price: item.price?.toString() || "", category: item.category || "", imageUrl: item.image_url || item.imageUrl || "" }
      });
    } else {
      dispatch({ type: "RESET", defaultCategory: sections[0]?.section || "" });
    }
  }, [item, mode, sections]);

  const uploadToCloudinary = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const allowedTypes = ["image/jpeg", "image/png", "model/gltf-binary"];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".glb"];
      const maxSize = 10 * 1024 * 1024;

      if (!file) {
        dispatch({ type: "SET_ERRORS", payload: { image: "No se seleccionó ningún archivo." } });
        return reject(new Error("No file selected"));
      }

      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        dispatch({ type: "SET_ERRORS", payload: { image: `Tipo no permitido: "${fileExtension}". Usa .jpg, .png o .glb.` } });
        return reject(new Error("Invalid file type"));
      }

      if (file.size > maxSize) {
        dispatch({ type: "SET_ERRORS", payload: { image: `El archivo "${file.name}" excede 10 MB.` } });
        return reject(new Error("File too large"));
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      formData.append("cloud_name", "delzhsy0h");

      const xhr = new XMLHttpRequest();
      const endpoint = fileExtension === ".glb" ? "raw/upload" : "image/upload";
      xhr.open("POST", `https://api.cloudinary.com/v1_1/delzhsy0h/${endpoint}`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          dispatch({ type: "SET_PROGRESS", payload: percentComplete });
        }
      };

      xhr.onload = () => {
        dispatch({ type: "SET_UPLOADING", payload: false });
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          console.log(`[ItemModal] Archivo subido: ${data.secure_url}`);
          resolve(data.secure_url);
        } else {
          dispatch({ type: "SET_ERRORS", payload: { image: `Error al subir "${file.name}": ${xhr.statusText}` } });
          reject(new Error(xhr.statusText));
        }
      };

      xhr.onerror = () => {
        dispatch({ type: "SET_UPLOADING", payload: false });
        dispatch({ type: "SET_ERRORS", payload: { image: `Error de red al subir "${file.name}"` } });
        reject(new Error("Network error"));
      };

      console.log(`[ItemModal] Iniciando subida de ${file.name}`);
      dispatch({ type: "SET_UPLOADING", payload: true });
      xhr.send(formData);
    });
  }, []);

  const handleImageDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      dispatch({ type: "SET_IMAGE_FILE", payload: file, previewUrl });
    }
  }, []);

  const handleInputChange = useCallback((field, value) => {
    dispatch({ type: "UPDATE_FORM_FIELD", field, value });
    if (!value && field !== "description") {
      dispatch({ type: "SET_ERRORS", payload: { ...state.errors, [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} requerido` } });
    }
  }, [state.errors]);

  const handleSave = useCallback(async () => {
    const requiredFields = { name: "Nombre", price: "Precio", category: "Categoría" };
    const newErrors = Object.keys(requiredFields).reduce((acc, key) => (!state.formData[key] ? { ...acc, [key]: `${requiredFields[key]} requerido` } : acc), {});
    if (Object.keys(newErrors).length) {
      dispatch({ type: "SET_ERRORS", payload: newErrors });
      return;
    }

    try {
      let imageUrl = state.formData.imageUrl;
      if (state.imageFile) {
        imageUrl = await uploadToCloudinary(state.imageFile);
        if (!imageUrl) throw new Error("No se obtuvo URL de la imagen");
      }

      const itemData = {
        name: state.formData.name,
        description: state.formData.description || "",
        price: Number(state.formData.price),
        category: state.formData.category,
        image_url: imageUrl || state.formData.imageUrl,
      };

      const endpoint = mode === "edit" 
        ? `/restaurantes/${restaurantId}/items/${item.id}` 
        : `/restaurantes/${restaurantId}/items`;
      const response = await api[mode === "edit" ? "put" : "post"](endpoint, itemData);
      const finalItem = { ...itemData, id: response.data.id || (mode === "edit" ? item.id : `temp-${Date.now()}`) };

      console.log("[ItemModal] Ítem guardado:", finalItem);
      onSave(finalItem); // Solo llamamos a onSave una vez con el ítem final

      toast.success("¡Ítem guardado con éxito!");
      dispatch({ type: "SET_SUCCESS", payload: true });
      dispatch({ type: "SET_UPLOADING", payload: false });
      setTimeout(onClose, 1000);
    } catch (error) {
      console.error(`[ItemModal] Error al ${mode === "edit" ? "editar" : "agregar"} el ítem:`, error);
      dispatch({ type: "SET_ERRORS", payload: { general: `Error: ${error.response?.data?.error || error.message}` } });
      toast.error(`Error al guardar el ítem: ${error.response?.data?.error || error.message}`);
      dispatch({ type: "SET_UPLOADING", payload: false });
    }
  }, [state, mode, item, restaurantId, onSave, onClose, uploadToCloudinary]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-6 w-11/12 max-w-lg shadow-xl overflow-y-auto max-h-[90vh]"
        style={{ fontFamily }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold" style={{ color: colors.primary }}>{mode === "edit" ? "Editar Ítem" : "Agregar Ítem"}</h3>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} className="text-gray-600 hover:text-gray-800">
            <FaTimes size={24} />
          </motion.button>
        </div>
        <div className="space-y-5">
          {["name", "price", "description", "category"].map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-sm font-semibold" style={{ color: colors.primary }}>
                {field === "name" ? "Nombre" : field === "price" ? "Precio" : field === "description" ? "Descripción" : "Categoría"}
              </label>
              {field === "category" ? (
                <select
                  value={state.formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  style={{ borderColor: colors.secondary, color: colors.secondary }}
                >
                  {sections.map((s) => (
                    <option key={s.section} value={s.section} style={{ color: colors.primary }}>{s.section}</option>
                  ))}
                </select>
              ) : field === "description" ? (
                <textarea
                  value={state.formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm resize-none transition-all"
                  rows={3}
                  style={{ borderColor: colors.secondary, color: colors.secondary }}
                />
              ) : (
                <input
                  type={field === "price" ? "number" : "text"}
                  value={state.formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  step={field === "price" ? "0.01" : undefined}
                  min={field === "price" ? "0" : undefined}
                  style={{ borderColor: colors.secondary, color: colors.secondary }}
                />
              )}
              {state.errors[field] && <p className="text-red-500 text-xs">{state.errors[field]}</p>}
            </div>
          ))}
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative transition-all"
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{ borderColor: colors.secondary }}
          >
            {state.formData.imageUrl ? (
              <div className="relative">
                {state.formData.imageUrl.endsWith('.glb') ? (
                  <div className="w-32 h-32 mx-auto">
                    <ThreeDViewer
                      modelUrl={state.formData.imageUrl}
                      scale={[0.5, 0.5, 0.5]}
                      backgroundColor="#ffffff"
                      autoRotate={true}
                    />
                  </div>
                ) : (
                  <img src={state.formData.imageUrl} alt="Preview" className="w-32 h-32 mx-auto rounded-lg object-cover shadow-md" />
                )}
                <motion.button
                  onClick={() => dispatch({ type: "CLEAR_IMAGE" })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-sm"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes size={14} />
                </motion.button>
              </div>
            ) : (
              <label className="block text-gray-500 cursor-pointer">
                Arrastra una imagen (.jpg, .png) o modelo 3D (.glb) aquí o haz clic para subir
                <input
                  type="file"
                  accept="image/jpeg,image/png,model/gltf-binary,.glb"
                  onChange={handleImageDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            )}
            {state.isUploading && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${state.uploadProgress}%` }} />
                </div>
                <p className="text-sm text-gray-600 mt-1">Subiendo: {state.uploadProgress}%</p>
              </div>
            )}
            {state.errors.image && <p className="text-red-500 text-xs mt-2">{state.errors.image}</p>}
          </div>
        </div>
        {state.errors.general && <p className="text-red-500 text-sm mt-4">{state.errors.general}</p>}
        {state.success && <p className="text-green-500 text-sm mt-4">¡Ítem guardado con éxito!</p>}
        <motion.button
          onClick={handleSave}
          disabled={state.isUploading}
          className="w-full mt-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          style={{ backgroundColor: colors.secondary }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {state.isUploading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar</span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.show === nextProps.show &&
         prevProps.mode === nextProps.mode &&
         prevProps.item?.id === nextProps.item?.id &&
         prevProps.restaurantId === nextProps.restaurantId &&
         JSON.stringify(prevProps.sections) === JSON.stringify(nextProps.sections) &&
         JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors) &&
         prevProps.fontFamily === nextProps.fontFamily;
});

ItemModal.displayName = "ItemModal";

// Componente SectionModal optimizado
const SectionModal = memo(({ show, onClose, onSave, colors, fontFamily }) => {
  const [sectionName, setSectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!sectionName.trim()) {
      toast.error("El nombre de la sección no puede estar vacío.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(sectionName);
      setSectionName("");
      onClose();
    } catch (error) {
      console.error("[SectionModal] Error al crear sección:", error);
      toast.error("Error al crear la sección.");
    } finally {
      setIsSaving(false);
    }
  }, [sectionName, onSave, onClose]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-xl"
        style={{ fontFamily }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold" style={{ color: colors.primary }}>Nueva Sección</h3>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} className="text-gray-600 hover:text-gray-800">
            <FaTimes size={24} />
          </motion.button>
        </div>
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="Nombre de la sección"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
        />
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          style={{ backgroundColor: colors.secondary }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSaving ? <FaSpinner className="animate-spin" /> : "Crear"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.show === nextProps.show &&
         JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors) &&
         prevProps.fontFamily === nextProps.fontFamily;
});

SectionModal.displayName = "SectionModal";

// Componente MenuSections controlado
export const MenuSections = memo(({
  sections = [],
  restaurantId,
  fontFamily = "Roboto",
  colors = { primary: "#F97316", secondary: "#FF9800" },
  onDeleteItem,
  onEditItem,
  onAddItem,
  onUpdateSections = () => console.warn("onUpdateSections no está definido"),
}) => {
  const [state, setState] = useState({
    modalState: { show: false, mode: "add", item: null, section: "" },
    searchQuery: "",
    editingSection: null,
    sectionName: "",
    isSaving: false,
    isNewSectionModalOpen: false,
  });

  useEffect(() => {
    console.log("[MenuSections] Props sections recibidas:", sections);
  }, [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleOpenModal = useCallback((mode, section, item = null) => {
    setState(prev => ({
      ...prev,
      modalState: { show: true, mode, item, section }
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      modalState: { show: false, mode: "add", item: null, section: "" },
      isNewSectionModalOpen: false,
    }));
  }, []);

  const handleSaveItem = useCallback((updatedItem) => {
    if (state.modalState.mode === "edit") {
      onEditItem(updatedItem.category, updatedItem);
    } else {
      onAddItem(updatedItem);
    }
  }, [state.modalState.mode, onEditItem, onAddItem]);

  const handleEditSection = useCallback((section) => {
    setState(prev => ({ ...prev, editingSection: section, sectionName: section }));
  }, []);

  const handleSaveSection = useCallback(async (oldSection) => {
    if (!state.sectionName.trim()) {
      toast.error("El nombre de la sección no puede estar vacío.");
      return;
    }
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const updatedSections = sections.map(s => 
        s.section === oldSection ? { ...s, section: state.sectionName } : s
      );
      onUpdateSections(updatedSections);
      toast.success("Sección actualizada con éxito.");
      setState(prev => ({ ...prev, editingSection: null, sectionName: "", isSaving: false }));
    } catch (error) {
      console.error("[MenuSections] Error al actualizar secciones:", error);
      toast.error("No se pudo actualizar la sección.");
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [sections, state.sectionName, onUpdateSections]);

  const handleAddSection = useCallback(async (newSectionName) => {
    if (!newSectionName.trim()) {
      toast.error("El nombre de la sección no puede estar vacío.");
      return;
    }
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      const newSection = { section: newSectionName, items: [] };
      const updatedSections = [...sections, newSection];
      onUpdateSections(updatedSections);
      toast.success("Sección creada con éxito.");
      setState(prev => ({ ...prev, isNewSectionModalOpen: false, isSaving: false }));
    } catch (error) {
      console.error("[MenuSections] Error al crear sección:", error);
      toast.error("No se pudo crear la sección.");
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [sections, onUpdateSections]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const updatedSections = [...sections];
    let sourceSectionIndex, destSectionIndex, sourceItemIndex, destItemIndex;

    updatedSections.forEach((section, i) => {
      const sourceIdx = section.items.findIndex(item => item.id === active.id);
      const destIdx = section.items.findIndex(item => item.id === over.id);
      if (sourceIdx !== -1) {
        sourceSectionIndex = i;
        sourceItemIndex = sourceIdx;
      }
      if (destIdx !== -1) {
        destSectionIndex = i;
        destItemIndex = destIdx;
      }
    });

    if (sourceSectionIndex === undefined || destSectionIndex === undefined) return;

    const sourceSection = updatedSections[sourceSectionIndex];
    const destSection = updatedSections[destSectionIndex];
    const [movedItem] = sourceSection.items.splice(sourceItemIndex, 1);

    if (sourceSectionIndex === destSectionIndex) {
      sourceSection.items = arrayMove(sourceSection.items, sourceItemIndex, destItemIndex);
    } else {
      movedItem.category = destSection.section;
      destSection.items.splice(destItemIndex, 0, movedItem);
    }

    onUpdateSections(updatedSections);
    toast.success("Ítem reordenado con éxito.");
  }, [sections, onUpdateSections]);

  const normalizedSections = useMemo(() => {
    if (!Array.isArray(sections)) return [];
    return sections.map(section => ({
      section: section.section || "Sin Nombre",
      items: (Array.isArray(section.items) ? section.items : []).filter(item => 
        item && typeof item === "object" && item.name && item.id && 
        item.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    }));
  }, [sections, state.searchQuery]);

  if (normalizedSections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md text-gray-500 text-center"
        style={{ fontFamily }}
      >
        No hay secciones disponibles. Agrega una sección para comenzar.
        <motion.button
          onClick={() => setState(prev => ({ ...prev, isNewSectionModalOpen: true }))}
          className="mt-4 px-4 py-2 text-white rounded-lg font-semibold shadow-md"
          style={{ backgroundColor: colors.secondary }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus size={16} /> Agregar Sección
        </motion.button>
      </motion.div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-6 bg-gray-50 rounded-2xl shadow-inner h-full overflow-y-auto"
        style={{ fontFamily }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Buscar ítems..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full sm:w-1/2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm bg-white transition-all"
            style={{ borderColor: colors.primary, color: colors.secondary }}
          />
          <motion.button
            onClick={() => setState(prev => ({ ...prev, isNewSectionModalOpen: true }))}
            className="w-full sm:w-auto px-4 py-2 text-white rounded-lg font-semibold shadow-md flex items-center gap-2"
            style={{ backgroundColor: colors.secondary }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Agregar nueva sección"
          >
            <FaPlus size={16} /> Nueva Sección
          </motion.button>
        </div>
        {normalizedSections.map(({ section, items = [] }, index) => (
          <div key={section + index} className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-200">
              {state.editingSection === section ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={state.sectionName}
                    onChange={(e) => setState(prev => ({ ...prev, sectionName: e.target.value }))}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: colors.primary, color: colors.secondary }}
                    placeholder="Nuevo nombre"
                  />
                  <motion.button
                    onClick={() => handleSaveSection(section)}
                    disabled={state.isSaving}
                    className="p-2 bg-green-500 text-white rounded-lg flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {state.isSaving ? <FaSpinner className="animate-spin" /> : "Guardar"}
                  </motion.button>
                </div>
              ) : (
                <>
                  <h4 className="text-2xl font-bold" style={{ color: colors.primary }}>{section}</h4>
                  <motion.button
                    onClick={() => handleEditSection(section)}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    whileHover={{ scale: 1.05 }}
                    title="Editar nombre de sección"
                  >
                    <FaEdit size={14} />
                  </motion.button>
                </>
              )}
            </div>
            {items.length ? (
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      section={section}
                      handleOpenModal={handleOpenModal}
                      onDeleteItem={onDeleteItem}
                      colors={colors}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <p className="text-sm italic" style={{ color: colors.secondary }}>No hay ítems en esta sección.</p>
            )}
            <motion.button
              onClick={() => handleOpenModal("add", section)}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold shadow-md hover:shadow-lg w-full sm:w-auto"
              style={{ backgroundColor: colors.secondary }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              title="Agregar nuevo ítem"
            >
              <FaPlus size={16} /> Agregar Ítem
            </motion.button>
          </div>
        ))}
        <AnimatePresence>
          {state.modalState.show && (
            <ItemModal
              show={state.modalState.show}
              onClose={handleCloseModal}
              item={state.modalState.item}
              onSave={handleSaveItem}
              mode={state.modalState.mode}
              restaurantId={restaurantId}
              sections={sections}
              colors={colors}
              fontFamily={fontFamily}
            />
          )}
          {state.isNewSectionModalOpen && (
            <SectionModal
              show={state.isNewSectionModalOpen}
              onClose={handleCloseModal}
              onSave={handleAddSection}
              colors={colors}
              fontFamily={fontFamily}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DndContext>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.sections) === JSON.stringify(nextProps.sections) &&
         prevProps.restaurantId === nextProps.restaurantId &&
         prevProps.fontFamily === nextProps.fontFamily &&
         JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors);
});

MenuSections.displayName = "MenuSections";

export default MenuSections;