import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from "../controllers/productController.js";
import { auth, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(getProducts).post(auth, isAdmin, createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(auth, isAdmin, updateProduct)
  .delete(auth, isAdmin, deleteProduct);

router.route("/:id/reviews").post(auth, createProductReview);



export default router;
