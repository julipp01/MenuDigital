import { useEffect, useState, useRef } from "react";

const useSocket = (url = "wss://menudigital-backend-production.up.railway.app") => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [menuUpdate, setMenuUpdate] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000;
  const pingInterval = useRef(null);

  const connectWebSocket = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error(`❌ Máximo de intentos de reconexión alcanzado (${maxReconnectAttempts}).`);
      return;
    }

    console.log(`🔹 Conectando a WebSocket en: ${url}`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`✅ Conectado al servidor WebSocket: ${ws._socket?.remoteAddress || "ID no disponible"}`);
      setIsConnected(true);
      setSocket(ws);
      reconnectAttempts.current = 0;

      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
          console.log("📡 Ping enviado al servidor");
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📩 Mensaje recibido:", message);
        if (message.type === "menu-changed") {
          setMenuUpdate(message.data);
        } else if (message.type === "pong") {
          console.log("📡 Pong recibido del servidor");
        }
      } catch (error) {
        console.error("❌ Error al parsear mensaje WebSocket:", error.message);
      }
    };

    ws.onclose = (event) => {
      console.log(`🔹 Cerrando conexión WebSocket - Código: ${event.code}, Razón: ${event.reason || "Desconocida"}`);
      setIsConnected(false);
      setSocket(null);
      clearInterval(pingInterval.current);

      if (document.visibilityState === "visible") {
        reconnectAttempts.current += 1;
        console.log(`🔄 Intentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts}) en ${reconnectInterval / 1000}s...`);
        setTimeout(connectWebSocket, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error.message || error);
      ws.close();
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socket) {
        console.log("🔹 Cerrando conexión WebSocket al desmontar");
        socket.close();
        clearInterval(pingInterval.current);
      }
    };
  }, [url]);

  return { socket, isConnected, menuUpdate };
};

export default useSocket;








