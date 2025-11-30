import express from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  getUserOrders,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  updateUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user orders
router.get("/orders", auth, getUserOrders);
router.put('/profile',auth,updateUserProfile)
// Change password
router.put("/password", auth, changePassword);

// Wishlist routes
router.get("/wishlist", auth, getWishlist);
router.get("/userwishlist", auth, getUserWishlist);
router.post("/wishlist", auth, addToWishlist);
router.delete("/wishlist/:productId", auth, removeFromWishlist);

export default router;
