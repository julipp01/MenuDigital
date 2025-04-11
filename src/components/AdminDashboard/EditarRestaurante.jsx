import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const EditarRestaurante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    colors: { primary: "#ff4500", secondary: "#222222" },
    logo: "",
    sections: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/restaurantes/${id}`)
      .then(response => {
        setForm(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al obtener el restaurante", error);
        setError("No se pudo cargar la información del restaurante.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/restaurantes/${id}`, form);
      navigate("/admin/restaurantes");
    } catch (error) {
      console.error("Error al actualizar el restaurante", error);
      setError("No se pudo actualizar el restaurante. Inténtalo nuevamente.");
    }
  };

  if (loading) return <p className="text-center text-gray-600">Cargando...</p>;
  if (error) return <p className="text-red-500 font-bold">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Editar Restaurante</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-lg rounded-lg w-full max-w-lg space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold">Nombre:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            placeholder="Nombre del Restaurante"
            className="border p-2 w-full rounded"
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">URL del Logo:</label>
          <input
            type="text"
            name="logo"
            value={form.logo}
            placeholder="URL del Logo"
            className="border p-2 w-full rounded"
            onChange={handleChange}
          />
        </div>
        <div className="flex justify-between">
          <button type="button" onClick={() => navigate("/admin/restaurantes")} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarRestaurante;

