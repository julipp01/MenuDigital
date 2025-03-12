import React, { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import useSocket from "../../hooks/useSocket";

const DashboardHome = () => {
  const [stats, setStats] = useState({ totalPlatos: 0, totalRestaurantes: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket, isConnected, error: socketError } = useSocket() || {
    socket: null,
    isConnected: false,
    error: null,
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data || { totalPlatos: 0, totalRestaurantes: 0 });
      setError(null);
    } catch (err) {
      console.error("Error al obtener estadísticas:", err);
      setError("No se pudieron cargar las estadísticas. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!isConnected || !socket) return;

    const handleMenuUpdate = () => {
      fetchStats();
    };

    socket.on("menu-updated", handleMenuUpdate);
    return () => socket.off("menu-updated", handleMenuUpdate);
  }, [socket, isConnected, fetchStats]);

  if (socketError) return <div className="text-red-600">Error de conexión: {socketError}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      {loading ? (
        <p className="text-gray-600">Cargando estadísticas...</p>
      ) : error ? (
        <p className="text-red-600 mb-4">{error}</p>
      ) : !isConnected ? (
        <p className="text-yellow-600">Conectando al servidor en tiempo real...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Total de Platillos</h3>
            <p className="text-3xl text-orange-600">{stats.totalPlatos ?? 0}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Total de Restaurantes</h3>
            <p className="text-3xl text-orange-600">{stats.totalRestaurantes ?? 0}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold">Estado del Socket</h3>
            <p className="text-green-600">
              {socket && socket.id ? `Conectado (ID: ${socket.id})` : "Desconectado"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;



