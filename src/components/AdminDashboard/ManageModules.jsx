// src/components/AdminDashboard/ManageModules.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config";
import { useModulesConfig } from "../../hooks/useModulesConfig"; // Importar el nuevo hook

const ManageModules = () => {
  const { user } = useAuth();
  const { modules, loading, error } = useModulesConfig(user?.role, user?.id)?.map(module => ({
    ...module,
    path: module.path.replace(/^\/|\/$/g, "").replace("/admin/", "")
  })); // Asegurar paths relativos
  const [newModule, setNewModule] = useState({
    rango: "free",
    module_name: "",
    path: "",
    icon: "",
    orden: 99,
    enabled: true,
  });
  const [assignModule, setAssignModule] = useState({
    user_id: "",
    module_id: "",
    enabled: true,
  });

  // Utility function for authenticated fetch
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });
    const text = await response.text(); // Get raw text first
    try {
      const data = JSON.parse(text); // Attempt to parse as JSON
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      return data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`Respuesta no válida del servidor: ${response.status} ${response.statusText}`);
      }
      throw err;
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const cleanPath = newModule.path.replace(/^\/|\/$/g, "").replace("/admin/", "");
      const moduleToAdd = { ...newModule, path: cleanPath };
      await fetchWithAuth(`${API_URL}/modules-config`, {
        method: "POST",
        body: JSON.stringify(moduleToAdd),
      });
      setNewModule({ rango: "free", module_name: "", path: "", icon: "", orden: 99, enabled: true });
    } catch (err) {
      console.error("Add module error:", err);
      setError(err.message || "Error de conexión con el servidor");
    }
  };

  const handleAssignModule = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`${API_URL}/modules-config/assign-to-user`, {
        method: "POST",
        body: JSON.stringify(assignModule),
      });
      alert("Módulo asignado correctamente");
      setAssignModule({ user_id: "", module_id: "", enabled: true });
    } catch (err) {
      console.error("Assign module error:", err);
      setError(err.message || "Error de conexión con el servidor");
    }
  };

  const handleDeleteModule = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este módulo?")) return;
    try {
      await fetchWithAuth(`${API_URL}/modules-config/${id}`, {
        method: "DELETE",
      });
      await fetchModules();
    } catch (err) {
      console.error("Delete module error:", err);
      setError(err.message || "Error de conexión con el servidor");
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (user?.role !== "admin") return <div className="p-4 text-red-500 text-center">Acceso denegado. Solo para administradores.</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Módulos</h1>

      {/* Add New Module */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Añadir Nuevo Módulo</h2>
        <form onSubmit={handleAddModule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Rango:</label>
            <select
              value={newModule.rango}
              onChange={(e) => setNewModule({ ...newModule, rango: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Nombre del Módulo:</label>
            <input
              type="text"
              value={newModule.module_name}
              onChange={(e) => setNewModule({ ...newModule, module_name: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Ruta:</label>
            <input
              type="text"
              value={newModule.path}
              onChange={(e) => setNewModule({ ...newModule, path: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Icono:</label>
            <input
              type="text"
              value={newModule.icon}
              onChange={(e) => setNewModule({ ...newModule, icon: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Orden:</label>
            <input
              type="number"
              value={newModule.orden}
              onChange={(e) => setNewModule({ ...newModule, orden: parseInt(e.target.value) || 99 })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-600">Habilitado:</label>
            <input
              type="checkbox"
              checked={newModule.enabled}
              onChange={(e) => setNewModule({ ...newModule, enabled: e.target.checked })}
              className="h-5 w-5 text-orange-500"
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              Añadir Módulo
            </button>
          </div>
        </form>
      </div>

      {/* Assign Module to User */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Asignar Módulo a un Usuario</h2>
        <form onSubmit={handleAssignModule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">ID del Usuario:</label>
            <input
              type="number"
              value={assignModule.user_id}
              onChange={(e) => setAssignModule({ ...assignModule, user_id: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Módulo:</label>
            <select
              value={assignModule.module_id}
              onChange={(e) => setAssignModule({ ...assignModule, module_id: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            >
              <option value="">Selecciona un módulo</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.module_name} ({module.rango})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-600">Habilitado:</label>
            <input
              type="checkbox"
              checked={assignModule.enabled}
              onChange={(e) => setAssignModule({ ...assignModule, enabled: e.target.checked })}
              className="h-5 w-5 text-orange-500"
            />
          </div>
          <div className="col-span-3">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Asignar Módulo
            </button>
          </div>
        </form>
      </div>

      {/* Module List */}
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Lista de Módulos</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left font-semibold">ID</th>
                <th className="border p-3 text-left font-semibold">Rango</th>
                <th className="border p-3 text-left font-semibold">Nombre</th>
                <th className="border p-3 text-left font-semibold">Ruta</th>
                <th className="border p-3 text-left font-semibold">Icono</th>
                <th className="border p-3 text-left font-semibold">Orden</th>
                <th className="border p-3 text-left font-semibold">Habilitado</th>
                <th className="border p-3 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="border p-3">{module.id}</td>
                  <td className="border p-3">{module.rango}</td>
                  <td className="border p-3">{module.module_name}</td>
                  <td className="border p-3">{module.path}</td>
                  <td className="border p-3">{module.icon}</td>
                  <td className="border p-3">{module.orden}</td>
                  <td className="border p-3">{module.enabled ? "Sí" : "No"}</td>
                  <td className="border p-3">
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageModules;