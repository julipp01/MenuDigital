import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Determina la URL del backend según el entorno
const BACKEND_URL =
  import.meta.env.VITE_MODE === "production"
    ? import.meta.env.VITE_API_URL_PROD
    : import.meta.env.VITE_API_URL;

const AdminSuscripciones = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suscripciones, setSuscripciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoPlan, setNuevoPlan] = useState({
    name: "",
    price: "",
    benefits: "",
    limits: "",
    type: "premium", // Tipo de plan por defecto
  });

  // Verifica si el usuario es admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      console.warn("Acceso denegado: Usuario no autorizado");
      navigate("/login");
    }
  }, [user, navigate]);

  // Obtiene datos de suscripciones y planes activos desde la base de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Conectando al backend en:", BACKEND_URL);
        const [suscripcionesRes, planesRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/suscripciones`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${BACKEND_URL}/api/admin/subscription_plans`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
        setSuscripciones(suscripcionesRes.data);
        setPlanes(planesRes.data);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setError("No se pudieron cargar los datos. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Maneja la creación de un nuevo plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/subscription_plans`,
        nuevoPlan,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPlanes([...planes, response.data]);
      setNuevoPlan({ name: "", price: "", benefits: "", limits: "", type: "premium" });
    } catch (error) {
      console.error("Error al crear el plan:", error);
      setError("No se pudo crear el plan.");
    }
  };

  // Maneja la actualización de un plan
  const handleUpdatePlan = async (id, updatedPlan) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/subscription_plans/${id}`,
        updatedPlan,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPlanes(planes.map((plan) => (plan.id === id ? updatedPlan : plan)));
    } catch (error) {
      console.error("Error al actualizar el plan:", error);
      setError("No se pudo actualizar el plan.");
    }
  };

  // Maneja la eliminación de un plan
  const handleDeletePlan = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/subscription_plans/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPlanes(planes.filter((plan) => plan.id !== id));
    } catch (error) {
      console.error("Error al eliminar el plan:", error);
      setError("No se pudo eliminar el plan.");
    }
  };

  // Maneja los cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoPlan({ ...nuevoPlan, [name]: value });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-4">{error}</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-center mb-6">Administración de Suscripciones</h1>

      {/* Formulario para crear un nuevo plan */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Crear Nuevo Plan</h2>
        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            value={nuevoPlan.name}
            onChange={handleInputChange}
            placeholder="Nombre del plan"
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            name="price"
            value={nuevoPlan.price}
            onChange={handleInputChange}
            placeholder="Precio"
            className="border p-2 rounded"
            required
          />
          <textarea
            name="benefits"
            value={nuevoPlan.benefits}
            onChange={handleInputChange}
            placeholder="Beneficios (separados por comas)"
            className="border p-2 rounded col-span-2"
            required
          />
          <textarea
            name="limits"
            value={nuevoPlan.limits}
            onChange={handleInputChange}
            placeholder="Límites (separados por comas)"
            className="border p-2 rounded col-span-2"
            required
          />
          <select
            name="type"
            value={nuevoPlan.type}
            onChange={handleInputChange}
            className="border p-2 rounded"
          >
            <option value="free">Gratis</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Crear Plan
          </button>
        </form>
      </section>

      {/* Lista de planes de suscripción */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Planes Activos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planes.map((plan) => (
            <div key={plan.id} className="bg-gray-100 p-4 rounded-lg shadow">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p>Tipo: {plan.type}</p>
              <p>Precio: ${plan.price}</p>
              <p>Beneficios: {plan.benefits}</p>
              <p>Límites: {plan.limits}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    handleUpdatePlan(plan.id, { ...plan, price: parseFloat(plan.price) + 10 })
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Aumentar $10
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lista de suscripciones actuales */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Suscripciones Actuales</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Usuario</th>
                <th className="py-2 px-4 border-b">Plan</th>
                <th className="py-2 px-4 border-b">Estado</th>
                <th className="py-2 px-4 border-b">Fecha de Inicio</th>
                <th className="py-2 px-4 border-b">Fecha de Fin</th>
              </tr>
            </thead>
            <tbody>
              {suscripciones.map((suscripcion) => (
                <tr key={suscripcion.id}>
                  <td className="py-2 px-4 border-b">{suscripcion.user_name}</td>
                  <td className="py-2 px-4 border-b">{suscripcion.plan_name}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
                        suscripcion.status === "active" ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {suscripcion.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{suscripcion.start_date}</td>
                  <td className="py-2 px-4 border-b">{suscripcion.end_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sección para reportes y alertas */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Reportes y Alertas</h2>
        <p className="text-gray-500">
          Próximamente: reportes de facturación y alertas de vencimiento.
        </p>
      </section>
    </div>
  );
};

export default AdminSuscripciones;











