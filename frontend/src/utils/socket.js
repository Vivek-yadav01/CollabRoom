import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);

// Log when connected
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

// Log when there is a connection error
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

// Log when disconnected
socket.on("disconnect", (reason) => {
  console.warn("Disconnected from server:", reason);
});

export default socket;
