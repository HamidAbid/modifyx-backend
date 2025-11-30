// routes/chatRoutes.js
import express from 'express';
import { saveMessage, getMessagesBySession } from '../controllers/chatMessageController.js';

const router = express.Router();

// Save message (POST)
router.post('/messages', saveMessage);

// Get messages for a session (GET)
router.get('/messages/:sessionId', getMessagesBySession);

export default router;
