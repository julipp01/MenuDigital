import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Planes = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/planes`)
      .then(response => {
        setPlans(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al obtener los planes:", error);
        setError("No se pudieron cargar los planes");
        setLoading(false);
      });
  }, []);

  const handleSubscribe = (planId) => {
    console.log("Redirigiendo al pago para el plan:", planId);
    // Aquí iría la integración con Yape, Plin o pasarelas de pago
  };

  if (loading) return <p className="text-center text-gray-500">Cargando planes...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Planes y Suscripciones</h1>
      {plans.length === 0 ? (
        <p className="text-center text-gray-600">No hay planes disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700 text-center">{plan.name}</h2>
              <p className="text-4xl font-bold text-green-500 text-center mt-2">S/.{plan.price}/mes</p>
              <ul className="mt-4 space-y-2 text-gray-600 text-center">
                {Array.isArray(plan.features) ? plan.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-600">✔ {feature}</li>
                )) : <li className="text-gray-400">Sin características</li>}
              </ul>
              <button 
                onClick={() => handleSubscribe(plan.id)} 
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Suscribirse
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Planes;


