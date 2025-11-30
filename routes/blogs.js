import express from "express";
import {  getAllBlogs, getOneBlog } from "../controllers/blogsController.js";


const router = express.Router();

// Get customization options for a product
router.get('/', getAllBlogs);
router.get('/:id', getOneBlog);


export default router;  