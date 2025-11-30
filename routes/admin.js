import express from 'express';
import {
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  // getAllQuotes,
  adminLogin,
  getDashboardData,
  getPaginatedProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteUser,
  addUser,
  getAllCustomBouquets,
  updateCustomBouquetStatus,
  deleteCustomBouquet,
  getAllProductReviews,
  deleteReview,
  addBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
 deleteCarModRequest,
 updateCarModRequestStatus,
 getAllCarModRequests,
  getAllChatLogs,
  clearChatLogs,
  updateAdminSettings,
  updateUser
} from '../controllers/adminController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication


router.post('/login',adminLogin)

// Dashboard
router.get('/dashboard',auth,isAdmin,getDashboardData);
router.put("/settings/update", auth,isAdmin, updateAdminSettings);

router.get('/products',auth,isAdmin,getPaginatedProducts)
router.post('/products',auth,isAdmin,addProduct)
router.put('/products/:id',auth,isAdmin,updateProduct)
router.delete('/products/:id',auth,isAdmin,deleteProduct)
// User management
router.get('/users',auth,isAdmin, getAllUsers);
router.patch('/users/:userId',auth,isAdmin,updateUser);
router.post('/users', addUser);
router.delete('/users/:id', deleteUser);  
// Order management
router.get('/orders',auth,isAdmin,getAllOrders);
router.put('/orders/:orderId/status',auth,isAdmin,updateOrderStatus);


// bouquets
router.get('/custom-bouquets', auth, isAdmin, getAllCustomBouquets);
router.put('/custom-bouquets/:id/status', auth, isAdmin, updateCustomBouquetStatus);
router.delete('/custom-bouquets/:id', auth, isAdmin, deleteCustomBouquet);


// Quote management
// router.get('/quotes',auth,isAdmin, getAllQuotes);

router.get('/reviews',auth,isAdmin, getAllProductReviews);
router.delete('/reviews/:id',auth,isAdmin, deleteReview);


// blogs

router.get("/blog",auth, getAllBlogs);

// Admin only
router.post("/blogs", auth, isAdmin, addBlog);
router.put("/blog/:id", auth, isAdmin, updateBlog);
router.delete("/blog/:id", auth, isAdmin, deleteBlog);

router.get('/carmodrequests', auth, isAdmin, getAllCarModRequests);
router.put('/carmodrequests/:id/status', auth, isAdmin, updateCarModRequestStatus);
router.delete('/carmodrequests/:id', auth, isAdmin, deleteCarModRequest);
// chat log
router.get('/chatlog',auth,isAdmin,getAllChatLogs)
router.delete('/chatlog',auth,isAdmin,clearChatLogs)

export default router;   