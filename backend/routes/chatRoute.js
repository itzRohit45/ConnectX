import { Router } from "express";
import {
  getChatHistory,
  getUserConversations,
  markMessagesAsRead,
} from "../controllers/chatController.js";

const router = Router();

// Define chat routes
router.get("/chat/history", getChatHistory);
router.get("/chat/conversations", getUserConversations);
router.post("/chat/mark-read", markMessagesAsRead);

// Add a debug endpoint
router.get("/chat/status", (req, res) => {
  res.status(200).json({ status: "Chat service operational" });
});

export default router;
