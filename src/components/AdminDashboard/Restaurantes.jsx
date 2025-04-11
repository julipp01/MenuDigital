import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const colors = {
  primary: "#ff4500",
  text: "#ffffff",
  hover: "#f7f7f7",
  active: "#e9eaec",
  accent: "#222222",
};

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Restaurantes = () => {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("[Restaurantes] Cargando restaurantes desde:", API_URL);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[Restaurantes] No se encontró token de autenticación.");
      setError("Acceso denegado: No hay token.");
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/restaurantes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("[Restaurantes] Respuesta de la API:", res);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json().catch(() => {
          throw new Error("La respuesta no es JSON válido.");
        });
      })
      .then((data) => {
        console.log("[Restaurantes] Datos recibidos:", data);
        if (!Array.isArray(data)) {
          throw new Error("La API no devolvió una lista válida de restaurantes.");
        }
        setRestaurantes(data.map(rest => ({ ...rest, estado: rest.estado || "activo" })));
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Restaurantes] Error al cargar restaurantes:", err);
        setError("Error al cargar restaurantes. Verifica la API.");
        setLoading(false);
      });
  }, []);

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "activo" ? "suspendido" : "activo";
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/restaurantes/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!response.ok) {
        throw new Error(`Error al actualizar estado. Status: ${response.status}`);
      }
      setRestaurantes((prev) => prev.map((rest) => (rest.id === id ? { ...rest, estado: nuevoEstado } : rest)));
    } catch (error) {
      console.error("[Restaurantes] Error al actualizar estado:", error);
    }
  };

  if (loading) return <p className="text-center text-gray-600">Cargando restaurantes...</p>;
  if (error) return <p className="text-red-500 font-bold">{error}</p>;

  return (
    <div className="p-6" style={{ backgroundColor: colors.hover }}>
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Gestión de Restaurantes</h1>
      <Link to="/admin/restaurantes/nuevo" className="px-4 py-2 rounded text-white shadow-lg hover:opacity-90" style={{ backgroundColor: colors.primary }}>
        + Nuevo Restaurante
      </Link>

      {restaurantes.length === 0 ? (
        <p className="mt-4 text-gray-600">No hay restaurantes disponibles.</p>
      ) : (
        <table className="w-full mt-4 border-collapse border border-gray-300 shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-200 text-gray-800">
              <th className="border p-3 text-left">ID</th>
              <th className="border p-3 text-left">Nombre</th>
              <th className="border p-3 text-left">Dueño</th>
              <th className="border p-3 text-left">Plan</th>
              <th className="border p-3 text-left">Registro</th>
              <th className="border p-3 text-left">Estado</th>
              <th className="border p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {restaurantes.map((rest) => (
              <tr key={rest.id} className="border hover:bg-gray-100 transition">
                <td className="border p-3">{rest.id}</td>
                <td className="border p-3 font-semibold text-gray-800 flex items-center gap-2">
                  {rest.logo_url ? <img src={rest.logo_url} alt={rest.name} className="w-10 h-10 rounded-full shadow-md" /> : "No Logo"}
                  {rest.name || "Sin nombre"}
                </td>
                <td className="border p-3">{rest.owner_id ? `Dueño ID: ${rest.owner_id}` : "No asignado"}</td>
                <td className="border p-3">{rest.plan_id ? `Plan ${rest.plan_id}` : "Sin plan"}</td>
                <td className="border p-3">{rest.created_at ? new Date(rest.created_at).toLocaleDateString() : "N/A"}</td>
                <td className="border p-3 flex items-center gap-2">
                  <button onClick={() => toggleEstado(rest.id, rest.estado)} className="text-lg">
                    {rest.estado === "activo" ? <FiToggleRight className="text-green-600" /> : <FiToggleLeft className="text-red-600" />}
                  </button>
                  <span className={rest.estado === "activo" ? "text-green-700" : "text-red-700"}>{rest.estado}</span>
                </td>
                <td className="border p-3 flex gap-4">
                  <Link to={`/admin/restaurantes/${rest.id}/editar`} className="text-blue-600 hover:text-blue-800 transition">
                    <FiEdit />
                  </Link>
                  <button className="text-red-600 hover:text-red-800 transition">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Restaurantes;







