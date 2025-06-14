import { io } from "socket.io-client";
import { BASE_URL } from "@/config";

let socket;
let isInitialized = false;

export const initializeSocket = (userId) => {
  if (!isInitialized) {
    try {
      // Make absolutely sure we're using the correct BASE_URL
      console.log(`Attempting to connect to socket at ${BASE_URL}`);

      // Confirm the BASE_URL is the onrender.com URL, not localhost
      if (!BASE_URL.includes("onrender.com")) {
        console.warn(
          `WARNING: BASE_URL does not contain 'onrender.com': ${BASE_URL}`
        );
      }

      // Connect to the socket server with robust connection options
      socket = io(BASE_URL, {
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 20000,
        transports: ["websocket", "polling"],
        path: "/socket.io", // Explicit path
        autoConnect: true,
        forceNew: true,
        query: userId ? { userId } : undefined, // Send userId as a query param
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
        // Try to reconnect with polling if websocket fails
        if (socket.io.opts.transports.indexOf("polling") === -1) {
          console.log("Trying to reconnect with polling transport");
          socket.io.opts.transports = ["polling", "websocket"];
          socket.connect();
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          // The server has forcefully disconnected the socket
          console.log("Attempting to reconnect manually...");
          socket.connect();
        }
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err);
      });

      isInitialized = true;
      console.log("Socket connection initialized");
    } catch (err) {
      console.error("Error initializing socket:", err);
      isInitialized = false; // Reset so we can try again
    }
  }

  return socket;
};

// Function to check socket connection status
export const checkSocketConnection = () => {
  if (!socket) {
    return { connected: false, status: "Socket not initialized" };
  }

  return {
    connected: socket.connected,
    status: socket.connected ? "connected" : "disconnected",
    id: socket.id || "no id",
  };
};

// Function to manually reconnect the socket
export const reconnectSocket = (userId) => {
  if (socket) {
    console.log("Forcing socket reconnection...");
    socket.disconnect();
    socket.connect();

    if (userId) {
      socket.emit("join", userId);
    }
    return true;
  }
  return false;
};

// Clean up socket connection
export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket");
    socket.disconnect();
    isInitialized = false;
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
