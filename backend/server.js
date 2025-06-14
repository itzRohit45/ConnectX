import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import postRoutes from "./routes/postsRoute.js";
import userRoutes from "./routes/usersRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import ChatMessage from "./models/chatModel.js";
import User from "./models/usersModel.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, you should restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

const uri = process.env.MONGO_URI;
console.log(uri);

app.use(cors());
app.use(express.json());

// Check if server is responsive
app.get("/users/check-server", (req, res) => {
  res.status(200).json({ status: "Server is up and running" });
});

app.use(postRoutes);
app.use(userRoutes);
app.use(chatRoutes);
app.use(express.static("uploads"));

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({
    message: "Server error encountered",
    error:
      process.env.NODE_ENV !== "production"
        ? err.message
        : "Internal Server Error",
    path: req.path,
  });
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins their own room based on their userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Handle private messages
  socket.on("private message", async (data) => {
    try {
      const { sender, receiver, message, token } = data;

      // Validate sender token
      const user = await User.findOne({ token, _id: sender });
      if (!user) {
        socket.emit("error", "Unauthorized");
        return;
      }

      // Save message to database
      const newMessage = new ChatMessage({
        sender,
        receiver,
        message,
        read: false,
      });

      await newMessage.save();

      // Get populated message to send to client
      const populatedMessage = await ChatMessage.findById(newMessage._id)
        .populate("sender", "name username profilePicture")
        .populate("receiver", "name username profilePicture");

      // Send to receiver if they are online
      io.to(receiver).emit("private message", populatedMessage);

      // Send back to sender as confirmation
      socket.emit("message sent", populatedMessage);
    } catch (error) {
      console.error("Error handling private message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Handle typing status
  socket.on("typing", (data) => {
    const { sender, receiver } = data;
    io.to(receiver).emit("typing", { sender });
  });

  // Handle stop typing status
  socket.on("stop typing", (data) => {
    const { sender, receiver } = data;
    io.to(receiver).emit("stop typing", { sender });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const start = async () => {
  const connectDb = await mongoose.connect(process.env.MONGO_URI);

  httpServer.listen(9090, () => {
    console.log("Server is running on port 9090");
  });
};

start();
