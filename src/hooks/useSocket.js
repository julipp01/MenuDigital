import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [menuUpdate, setMenuUpdate] = useState(null);
  const socketRef = useRef(null); // Referencia para mantener el socket entre renders

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "ws://localhost:5000";
    const finalSocketUrl = import.meta.env.VITE_ENV === "development" ? socketUrl.replace("https://", "ws://") : socketUrl.replace("https://", "wss://");

    if (socketRef.current) return; // Evitar reiniciar el socket si ya existe

    console.log(`🔹 Conectando a WebSocket en: ${finalSocketUrl}`);

    const newSocket = io(finalSocketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Conectado al servidor WebSocket:", newSocket.id);
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠ WebSocket desconectado. Razón:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Error en WebSocket:", err.message);
      setError(`Error al conectar al WebSocket: ${err.message}`);
    });

    newSocket.on("menu-changed", (data) => {
      console.log("📩 Menú actualizado recibido:", data);
      setMenuUpdate(data);
    });

    return () => {
      console.log("🔹 Cerrando conexión WebSocket");
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("menu-changed");
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []); // Dependencias vacías para ejecutarse solo al montar

  return { socket: socketRef.current, isConnected, error, menuUpdate };
};

export default useSocket;








