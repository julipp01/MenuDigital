
// useSocket.js (Corregido)
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socketIo = io(SOCKET_URL, {
  reconnectionAttempts: 5,
  timeout: 5000,
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export default socketIo;







