import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['standard', 'custom'],
    default: 'standard',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  quantity: {
    type: Number,
    default: 1,
  },
  customData: {
    type: Object, // Can include name, price, image, etc.
  },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [cartItemSchema],
});

export default mongoose.model('Cart', cartSchema);
