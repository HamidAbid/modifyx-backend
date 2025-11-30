import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Blogs from '../models/Blogs.js';
import ChatLog from '../models/chatMessage.js';
import CarModRequest from '../models/carMod.js'

// Get dashboard statistics


// PUT /api/admin/settings/update
export const updateAdminSettings = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const adminId = req.user.id; // Ensure middleware adds this
console.log(name,email,currentPassword,newPassword)
    const admin = await User.findById(adminId);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update name and email only if provided and non-empty
    if (typeof name === 'string' && name.trim()) {
      admin.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      admin.email = email.trim();
    }

    // Handle password update only if both current and new password are provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      admin.password = newPassword; // pre-save hook will hash it
    }

    await admin.save();

    res.status(200).json({
      message: "Settings updated successfully",
      user: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin update failed:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  } 
};





export const getDashboardData = async (req, res) => {
  try {
    const usersWithLogin = await User.countDocuments({ lastLogin: { $exists: true } });

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Total Sales
    const salesAggregation = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $ifNull: ["$totalPrice", 0] } }
        }
      }
    ]);
    const totalSales = (salesAggregation.length > 0 && salesAggregation[0].totalSales) || 0;

    // Total Reviews
    const totalReviews = await Product.aggregate([
      { $project: { reviewCount: { $size: "$reviews" } } },
      { $group: { _id: null, total: { $sum: "$reviewCount" } } }
    ]);
    const reviewCount = totalReviews[0]?.total || 0;

    // Recent Orders
    const recentOrdersRaw = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = recentOrdersRaw.map(order => ({
      id: order._id,
      customer: order.user?.name || 'Unknown',
      amount: order.totalPrice || 0,
      status: order.status || 'Pending',
      date: order.createdAt.toISOString().split('T')[0],
    }));

    // Daily Sales (last 7 days)
    const last7Days = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 6)) // last 7 days
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total: { $sum: { $ifNull: ["$totalPrice", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailySales = last7Days.map(day => ({
      date: day._id,
      total: day.total
    }));

    // Top Selling Products (standard only)
    const topSellingProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.itemType": "standard" } },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalSales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          productId: "$_id",
          name: "$productInfo.name",
          sold: "$totalSold",
          sales: { $round: ["$totalSales", 2] },
          _id: 0
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    const bestSellingProduct = topSellingProducts[0] || null;
console.log("usersWithLogin",usersWithLogin,totalUsers);
    res.status(200).json({
      stats: {
        totalCustomers: totalUsers,
        totalUser:usersWithLogin,
        totalProducts, 
        totalOrders,
        totalSales,
        totalReviews: reviewCount
      },
      recentOrders,
      dailySales,
      topSellingProducts,
      bestSellingProduct
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// all products

export const getPaginatedProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;     // current page (default: 1)
    const limit = 6;                                // items per page
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: sort newest first

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalProducts,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// POST /api/products
export const addProduct = async (req, res) => {
  try {
    console.log('enter to add product');
    const { name, category, price, quantity, image, images } = req.body;
    console.log(name, category, price, quantity, image, images);

    if (!name || !category || !price || !quantity || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newProduct = new Product({
      name,
      category,
      price,
      image,
      images: Array.isArray(images) ? images : [], // add images array if available
      quantity,
      availability: quantity > 0,
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all users
// controllers/adminController.js
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email createdAt');
    const formatted = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      date: user.createdAt.toISOString().split('T')[0],
      orders: 0, // Replace with actual logic if needed
    }));
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
export const addUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    console.log("Incoming user:", { name, email, role, password });
    var newRole = role.toLowerCase();
    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }
if(role == 'customer' || role == 'Customer'){
  newRole='user'
}
    const newUser = new User({
      name,
      email,
      role:newRole, // make sure it's either "admin" or "user"
      password,
    });

    const saved = await newUser.save(); // will trigger pre('save') hashing

    res.status(201).json({
      id: saved._id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      date: saved.createdAt.toISOString().split("T")[0],
      orders: 0,
    });
  } catch (error) {
    console.error("Error while adding user:", error); // ✅ shows bcrypt or save errors
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const deleteUser = async (req, res) => {
  try {
 
    const { id } = req.params;
   console.log(id);
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update user role

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password } = req.body;

    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};




// Get all orders with filters
export const getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is missing" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// controllers/customBouquetController.js

export const getAllCustomBouquets = async (req, res) => {
  try {
    const bouquets = await Cartfind().sort({ createdAt: -1 });
    res.status(200).json(bouquets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomBouquetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const bouquet = await CartfindById(id);
    if (!bouquet) {
      return res.status(404).json({ message: "Bouquet not found" });
    }

    bouquet.status = status;
    await bouquet.save();

    res.status(200).json({ message: "Status updated", bouquet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCustomBouquet = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CartfindByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Bouquet not found" });
    }
    res.status(200).json({ message: "Bouquet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// // Get all quotes with filters
// export const getAllQuotes = async (req, res) => {
//   try {
//     const { status, serviceType } = req.query;
//     let query = {};

//     if (status) {
//       query.status = status;
//     }

//     if (serviceType) {
//       query['service.type'] = serviceType;
//     }

//     const quotes = await Quote.find(query)
//       .populate('user', 'name email')
//       .populate('service')
//       .sort({ createdAt: -1 });

//     res.json(quotes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }; 


// Admin Login Controller
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // 4. Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('Admin login failed:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// reviews

// GET /api/admin/reviews
export const getAllProductReviews = async (req, res) => {
  try {
    const products = await Product.find({ "reviews.0": { $exists: true } });
    const allReviews = products.flatMap(product =>
      product.reviews.map(review => ({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        ...review.toObject()
      }))
    );
    res.status(200).json(allReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch product reviews" });
  }
};

// DELETE /api/admin/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const product = await Product.findOne({ "reviews._id": req.params.id });

    if (!product) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Remove the review from the product
    product.reviews = product.reviews.filter(
      (review) => review._id.toString() !== req.params.id
    );

    await product.save();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

// @desc    Get all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blogs.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

// @desc    Create a new blog
export const addBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, status,image } = req.body;

    const newBlog = new Blogs({
      title,
      excerpt, 
      image, 
      content,
      author,
      status,
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ message: "Failed to create blog" });
  }
};

// @desc    Update a blog
export const updateBlog = async (req, res) => {
  try {
    const updatedBlog = await Blogs.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(updatedBlog);
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

// @desc    Delete a blog
export const deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blogs.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};





// controllers/chatController.js

// GET /api/chat/logs
export const getAllChatLogs = async (req, res) => {
  try {
    const logs = await ChatLog.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ message: 'Failed to fetch chat logs' });
  }
};


// DELETE /api/admin/chatlog
export const clearChatLogs = async (req, res) => {
  try {
    await ChatLog.deleteMany({});
    res.status(200).json({ message: "All chat logs cleared" });
  } catch (err) {
    console.error("Error clearing chat logs:", err);
    res.status(500).json({ message: "Failed to clear chat logs" });
  }
};
// GET /api/admin/carmodrequests
/**
 * Get all Car Modification Requests
 */
export const getAllCarModRequests = async (req, res) => {
  try {
    const requests = await CarModRequest.find()
      .populate('user', 'name email') // Populate user details if 'user' is present
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching car mod requests:', error);
    res.status(500).json({ message: error.message || "Failed to fetch car mod requests" });
  }
};

// PUT /api/admin/carmodrequests/:id/status
/**
 * Update the status of a specific Car Modification Request
 */
export const updateCarModRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // The enum in the model is ['pending', 'reviewed', 'accepted', 'rejected']
    const validStatuses = ["pending", "reviewed", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be one of: pending, reviewed, accepted, rejected" });
    }

    const request = await CarModRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Car Modification Request not found" });
    }

    request.status = status;
    await request.save();

    res.status(200).json({ message: "Status updated successfully", request });
  } catch (error) {
    console.error('Error updating car mod request status:', error);
    res.status(500).json({ message: error.message || "Failed to update status" });
  }
};

// DELETE /api/admin/carmodrequests/:id
/**
 * Delete a specific Car Modification Request
 */
export const deleteCarModRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CarModRequest.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Car Modification Request not found" });
    }

    res.status(200).json({ message: "Car Modification Request deleted successfully" });
  } catch (error) {
    console.error('Error deleting car mod request:', error);
    res.status(500).json({ message: error.message || "Failed to delete request" });
  }
};