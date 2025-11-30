import User from "../models/User.js";
import Order from "../models/Order.js";
import bcrypt from "bcryptjs";

// @desc    Get user's orders
// @route   GET /api/users/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ FINAL VERSION — Updates name, email, number, and nested address
// @route   PUT /api/users/profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const updates = {
      name: req.body.name,
      email: req.body.email,
      number: req.body.number,
      address: req.body.address, // address should be object { street, city, ... }
    };

    // Remove undefined/null/empty string fields
    Object.keys(updates).forEach((key) => {
      if (
        updates[key] === undefined ||
        updates[key] === null ||
        updates[key] === ""
      ) {
        delete updates[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      number: updatedUser.number,
      address: updatedUser.address,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// @desc    Change user password
// @route   PUT /api/users/password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // Mongoose pre-save hook will hash this
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/users/wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.wishlist || []);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add/remove product from wishlist
// @route   POST /api/users/wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId, action } = req.body;

    if (!productId || !["add", "remove"].includes(action)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const update =
      action === "add"
        ? { $addToSet: { wishlist: productId } }
        : { $pull: { wishlist: productId } };

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
    }).populate("wishlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.wishlist || []);
  } catch (error) {
    console.error("Error updating wishlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get wishlist product IDs
// @route   GET /api/users/wishlist/ids
export const getUserWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.wishlist.map((p) => p._id.toString()));
  } catch (error) {
    console.error("Error fetching wishlist:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: productId } },
      { new: true }
    ).populate("wishlist");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.wishlist || []);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
