import { io } from "socket.io-client";
import { BASE_URL } from "@/config";

let socket;
let isInitialized = false;

export const initializeSocket = (userId) => {
  if (!isInitialized) {
    try {
      // Connect to the socket server with explicit path and connection options
      socket = io(BASE_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      // Log connection events for debugging
      socket.on("connect", () => {
        console.log("Socket connected successfully", socket.id);

        // Join room with userId for private messaging
        if (userId) {
          socket.emit("join", userId);
          console.log(`User ${userId} attempting to join room`);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err);
      });

      isInitialized = true;
      console.log("Socket connection initialized");
    } catch (err) {
      console.error("Error initializing socket:", err);
    }
  }

  return socket;
};

export const getSocket = () => {
  if (!isInitialized) {
    console.warn("Socket not initialized. Call initializeSocket first.");
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && isInitialized) {
    socket.disconnect();
    isInitialized = false;
    console.log("Socket disconnected");
  }
};

// Send a private message
export const sendPrivateMessage = (sender, receiver, message, token) => {
  if (!socket || !isInitialized) {
    console.error("Socket not initialized");
    return false;
  }

  socket.emit("private message", { sender, receiver, message, token });
  return true;
};

// Emit typing status
export const emitTyping = (sender, receiver) => {
  if (!socket || !isInitialized) {
    return;
  }

  socket.emit("typing", { sender, receiver });
};

// Emit stop typing status
export const emitStopTyping = (sender, receiver) => {
  if (!socket || !isInitialized) {
    return;
  }

  socket.emit("stop typing", { sender, receiver });
};
