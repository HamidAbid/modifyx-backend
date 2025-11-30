import Message from "../models/Message.js";
import User from "../models/User.js"; // assuming you have a User model

// Send a message (socket handles real-time, this is for storage if needed)
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    const newMsg = await Message.create({
      senderId,
      receiverId,
      message,
    });

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get chat history between a user and admin
export const getMessagesWithUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: "admin" },
        { senderId: "admin", receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get users who have messaged admin
export const getAllChatUsers = async (req, res) => {
  try {
    const messages = await Message.find().select("senderId receiverId").lean();

    const userIds = new Set();
    messages.forEach((msg) => {
      if (msg.senderId !== "admin") userIds.add(msg.senderId);
      if (msg.receiverId !== "admin") userIds.add(msg.receiverId);
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select("_id name email");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to get users" });
  }
};
