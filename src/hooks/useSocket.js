import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Conectado al servidor WebSocket");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      console.warn("⚠ WebSocket desconectado");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Error en WebSocket:", err);
      setError("Error al conectar al WebSocket");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected, error };
};

export default useSocket;








