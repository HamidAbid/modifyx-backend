import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// const productSchema = new mongoose.Schema({
//   name: String,
//   image: String,
//   images: [String],
//   description: String,
//   price: Number,

//   featured: {
//     type: Boolean,
//     default: false,
//   },

//   reviews: [ratingSchema],

//   quantity: {
//     type: Number,
//     default: 0,
//   },

//   availability: {
//     type: Boolean,
//     default: true,
//   },


//   category: {
//     type: String,
//     enum: ["exterior", "interior"],
//     required: true,
//   },

//   stock:{
//     type:Number,
//     default:40
//   }
// });


const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String],
  description: String,
  price: Number,
  currency: { type: String, default: "PKR" },
  featured: { type: Boolean, default: false },
  reviews: [ratingSchema],
  quantity: { type: Number, default: 0 },
  availability: { type: Boolean, default: true },
  category: { type: String, enum: ["exterior", "interior", "performance"], required: true },
  stock: { type: Number, default: 40 },
  brand: { type: String, default: "Universal" },
  ratingAverage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
