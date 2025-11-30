import express from "express";
import {
  sendMessage,
  getMessagesWithUser,
  getAllChatUsers,
} from "../controllers/chatController.js";

const router = express.Router();

// POST /api/chat/message
router.post("/message", sendMessage);

// GET /api/admin/chat/messages/:userId
router.get("/admin/chat/messages/:userId", getMessagesWithUser);

// GET /api/admin/chat/users
router.get("/admin/chat/users", getAllChatUsers);

export default router;
