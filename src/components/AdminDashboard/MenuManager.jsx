// frontend/src/AdminDashboard/MenuManager.jsx
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import MenuEditor from "./MenuEditor";

const MenuManager = () => {
  const { user } = useAuth();

  if (!user || !user.restaurantId) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-4">Gestión de Menú</h2>
        <p className="text-red-600">Error: No se encontró el ID del restaurante o no estás autenticado.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Gestión de Menú</h2>
      <div className="mb-8">
        <MenuEditor restaurantId={user.restaurantId} />
      </div>
    </div>
  );
};

export default MenuManager;




