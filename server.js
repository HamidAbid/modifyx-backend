import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import { Server } from "socket.io";
import http from "http";

// Routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import userRoutes from "./routes/users.js";
import customizationRoutes from "./routes/customization.js";
import adminRoutes from "./routes/admin.js";
import blogRoute from "./routes/blogs.js";
import cartRoute from "./routes/cart.js";
import chatRoute from "./routes/chat.js";
import otpRoutes from "./routes/otp.js";
import imageRoutes from "./routes/image.js";
import chatMessageRoutes from "./routes/chatMessage.js";
import packageRouter from './routes/package.js';

import chatSocket from "./chatSocket.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/img", express.static(path.join(__dirname, "..", "img")));

// API Routes
app.use('/api/otp', otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customization", customizationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoute);
app.use("/api/cart", cartRoute);
app.use("/api/chat", chatRoute);
app.use("/api/chatbot", chatMessageRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/package", packageRouter);

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working correctly" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    const server = http.createServer(app);
    const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://modifyx.vercel.app/", // fallback to localhost for dev
    methods: ["GET", "POST"],
  },
});


    // Initialize chat sockets
    chatSocket(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.error("Please make sure MongoDB is running and accessible");
  }
};

dbconnection();
