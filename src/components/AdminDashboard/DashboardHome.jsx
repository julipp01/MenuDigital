// frontend/src/components/AdminDashboard/DashboardHome.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import useSocket from "../../hooks/useSocket";

const DashboardHome = () => {
  const [stats, setStats] = useState({ totalPlatos: 0, totalRestaurantes: 0 });
  const [error, setError] = useState(null);
  const { socket, isConnected, error: socketError } = useSocket() || {}; // ✅ Asegurar que `useSocket` siempre retorne un objeto

  // Definir fetchStats como callback reutilizable
  const fetchStats = useCallback(async () => {
    console.log("📩 Solicitando estadísticas...");
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data || { totalPlatos: 0, totalRestaurantes: 0 }); // ✅ Evitar valores undefined
      setError(null);
      console.log("✅ Datos recibidos:", response.data);
    } catch (err) {
      console.error("❌ Error al obtener estadísticas:", err);
      setError("No se pudieron cargar las estadísticas. Intenta de nuevo más tarde.");
    }
  }, []);

  // Cargar estadísticas iniciales
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Manejar eventos de socket
  useEffect(() => {
    if (!isConnected || !socket) return; // ✅ Validar `socket` antes de usarlo

    const handleMenuUpdate = (data) => {
      console.log("📢 Evento de menú actualizado:", data);
      fetchStats(); // Refrescar estadísticas cuando el menú se actualiza
    };

    socket.on("menu-updated", handleMenuUpdate);

    return () => {
      console.log("🔹 Eliminando suscripción a eventos...");
      socket.off("menu-updated", handleMenuUpdate);
    };
  }, [socket, isConnected, fetchStats]);

  // Mostrar error de socket si existe
  if (socketError) return <div className="text-red-600">{socketError}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      {error ? (
        <p className="text-red-600 mb-4">{error}</p>
      ) : !isConnected ? (
        <p>Conectando al servidor en tiempo real...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Total de Platillos</h3>
            <p className="text-3xl text-orange-600">{stats.totalPlatos ?? 0}</p> {/* ✅ Evitar undefined */}
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Total de Restaurantes</h3>
            <p className="text-3xl text-orange-600">{stats.totalRestaurantes ?? 0}</p> {/* ✅ Evitar undefined */}
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Estado del Socket</h3>
            <p className="text-green-600">
              {socket && socket.id ? `Conectado (ID: ${socket.id})` : "Desconectado"} {/* ✅ Evitar errores */}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;


