// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://taskpal-14oy.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  autoConnect: false, // we control when to connect
});
