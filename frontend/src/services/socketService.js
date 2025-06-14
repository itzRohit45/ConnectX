import { io } from "socket.io-client";
import { BASE_URL } from "@/config";

let socket;
let isInitialized = false;

// Add the missing getSocket function
export const getSocket = () => {
  if (!socket) {
    console.warn("Socket requested but not initialized yet");
    return null;
  }
  if (!socket.connected) {
    console.warn("Socket exists but is not connected");
  }
  return socket;
};

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

        // Mark socket as initialized
        isInitialized = true;

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

    // If socket is already connected, just make sure we're in the room
    if (socket.connected) {
      console.log("Socket is already connected, ensuring room membership");
      if (userId) {
        socket.emit("join", userId);
      }
      return true;
    }

    // Force disconnect and reconnect as a clean slate
    socket.disconnect();

    // Add one-time listener for when we reconnect
    socket.once("connect", () => {
      console.log(`Socket reconnected with ID: ${socket.id}`);
      if (userId) {
        console.log(`Re-joining room for user ${userId}`);
        socket.emit("join", userId);
      }
      isInitialized = true;
    });

    socket.connect();
    return true;
  } else {
    console.log("No socket instance found, initializing new socket");
    initializeSocket(userId);
    return !!socket;
  }
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
