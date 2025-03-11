import React, { useState } from "react";
import api from "@/services/api"; // Asegúrate de que este servicio incluya el token en las cabeceras
import { useAuth } from "@/contexts/AuthContext";

const UpdatePlan = () => {
  const { user, setUser } = useAuth(); // setUser para actualizar el usuario en el contexto
  const [plan, setPlan] = useState("plata");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/auth/update-plan", { plan });
      setMessage(response.data.message);
      // Actualiza el usuario en el contexto con el nuevo plan
      setUser({ ...user, role: response.data.plan });
    } catch (error) {
      setMessage("Error al actualizar el plan.");
      console.error("Error al actualizar el plan:", error.response?.data || error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Actualizar Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="plan" className="block text-gray-800 font-medium">
          Selecciona tu nuevo plan:
        </label>
        <select
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full px-4 py-3 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="plata">Plata</option>
          <option value="oro">Oro</option>
          <option value="premium">Premium</option>
        </select>
        <button
          type="submit"
          className="w-full bg-orange-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300"
        >
          Actualizar Plan
        </button>
      </form>
      {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
    </div>
  );
};

export default UpdatePlan;
