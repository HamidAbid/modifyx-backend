// controllers/chatController.js
import ChatMessage from '../models/chatMessage.js'; // ✅ Correct model

export const saveMessage = async (req, res) => {
  const { sessionId, userText, botText } = req.body;

  try {
    await ChatMessage.create({
      sessionId,
      userText,
      botText,
    });
    res.status(200).json({ message: "Conversation saved." });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save conversation." });
  }
};

export const getMessagesBySession = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ message: 'Missing sessionId' });
  }

  try {
    const messages = await ChatMessage.find({ sessionId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
