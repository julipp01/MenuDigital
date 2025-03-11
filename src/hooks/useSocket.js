// frontend/src/hooks/useSocket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.18.22:5000"; // Ajusta según entorno

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 5000,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketIo.on("connect", () => {
      console.log("✅ Conectado a WebSocket:", socketIo.id);
      setIsConnected(true);
      setError(null);
    });

    socketIo.on("connect_error", (err) => {
      console.error("[Socket] Error de conexión:", err.message);
      setError("No se pudo conectar al servidor en tiempo real.");
      setIsConnected(false);
    });

    socketIo.on("disconnect", (reason) => {
      console.warn("❌ Desconectado de WebSocket. Razón:", reason);
      setIsConnected(false);
    });

    setSocket(socketIo);

    return () => {
      console.log("🔹 Desmontando socket...");
      socketIo.disconnect();
    };
  }, []);

  return { socket, isConnected, error };
};

export default useSocket;







