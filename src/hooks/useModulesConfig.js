import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api"; // ✅ Importar API con axios configurado

export const useModulesConfig = (rango) => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id || !rango) return; // ✅ Evita llamadas innecesarias si no hay usuario o rango

    const fetchModules = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/modules-config/${rango}?user_id=${user.id}`); // ✅ Usa API con token automático
        setModules(data);
      } catch (err) {
        console.error("❌ [API] Error al obtener módulos:", err);
        setError(err.response?.data?.error || "Error al cargar los módulos");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [rango, user?.id]);

  return { modules, loading, error };
};

