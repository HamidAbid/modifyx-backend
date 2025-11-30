import Message from "./models/Message.js";

export default function chatSocket(io) {
  io.on("connection", (socket) => {
    console.log("⚡ New user connected:", socket.id);

    socket.on("send_message", async (data) => {
      try {
        const newMessage = new Message({
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
        });

        await newMessage.save();

        // Emit to both sender and receiver
        io.emit("receive_message", newMessage);
      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
}
