import Product from "../models/Product.js";
import mongoose from "mongoose";

export const getProducts = async (req, res) => {
  console.log('get product');
  try {
    // Search by keyword (in name)
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    // Filter by category (if not "all")
    const category =
      req.query.category && req.query.category !== "all"
        ? { category: req.query.category }
        : {};

    // Filter by occasion (if provided and not "all")
    const occasion =
      req.query.occasion && req.query.occasion !== "all"
        ? { occasion: req.query.occasion }
        : {};

    // Combine filters
    const filter = { ...keyword, ...category, ...occasion };

    // Sorting
    let sortOption = { createdAt: -1 };
    switch (req.query.sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "name-asc":
        sortOption = { name: 1 };
        break;
      case "featured":
        sortOption = { featured: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Fetch products without pagination
    const products = await Product.find(filter).sort(sortOption);

    // Return result
    res.json({
      products,
      total: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    console.log("Prama", req.params.id);
    console.log("Type of ID:", typeof req.params.id);

    const response = await Product.findById(req.params.id);
    console.log(response);

    if (!response)
      return res.status(404).json({ message: "Product not found" });

    return res.json(response);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      stock: req.body.stock,
      featured: req.body.featured,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, price, description, images, category, stock, featured } =
      req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.images = images || product.images;
      product.category = category || product.category;
      product.stock = stock || product.stock;
      product.featured = featured !== undefined ? featured : product.featured;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private

// controllers/productController.js

export const createProductReview = async (req, res) => {
  const { author, rating, comment } = req.body;
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = {
      author, // string name like "John"
      rating: Number(rating),
      review: comment,
      date: new Date(),
    };

    product.reviews.push(review); // ✅ Push to reviews array

    await product.save();

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res
      .status(500)
      .json({ message: "Failed to add review", error: error.message });
  }
};

// POST /api/products/:id/reviews - Add a review to a product
export const addReview = async (req, res) => {
  const { author, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5 || !comment || !author) {
    return res.status(400).json({ message: "Invalid review data" });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.ratings.push({
      user: new mongoose.Types.ObjectId(), // Placeholder user
      rating,
      review: comment,
      date: new Date(),
    });

    await product.save();
    const updatedProduct = await Product.findById(req.params.id).lean({
      virtuals: true,
    });
    res.status(201).json({
      message: "Review added",
      product: updatedProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding review" });
  }
};
