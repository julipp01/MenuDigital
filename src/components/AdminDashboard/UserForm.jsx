// src/components/AdminDashboard/UserForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserForm = () => {
  const [user, setUser] = useState({ name: "", email: "", password: "", role: "free", restaurant_id: "" });
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
      .catch((err) => {
        console.error("Error al obtener restaurantes:", err);
        setError("No se pudieron cargar los restaurantes.");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.name || !user.email || !user.password) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      navigate("/admin/usuarios");
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setError("No se pudo guardar el usuario.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Nuevo Usuario</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Nombre" className="block w-full border p-2" onChange={(e) => setUser({ ...user, name: e.target.value })} />
        <input type="email" placeholder="Email" className="block w-full border p-2" onChange={(e) => setUser({ ...user, email: e.target.value })} />
        <input type="password" placeholder="Contraseña" className="block w-full border p-2" onChange={(e) => setUser({ ...user, password: e.target.value })} />
        <select className="block w-full border p-2" onChange={(e) => setUser({ ...user, role: e.target.value })}>
          {["free", "plata", "oro", "premium", "admin"].map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select className="block w-full border p-2" onChange={(e) => setUser({ ...user, restaurant_id: e.target.value })}>
          <option value="">Sin Restaurante</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Guardar Usuario</button>
      </form>
    </div>
  );
};

export default UserForm;

