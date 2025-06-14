import { Router } from "express";
import {
  getChatHistory,
  getUserConversations,
  markMessagesAsRead,
} from "../controllers/chatController.js";

const router = Router();

router.route("/chat/history").get(getChatHistory);
router.route("/chat/conversations").get(getUserConversations);
router.route("/chat/mark-read").post(markMessagesAsRead);

export default router;
