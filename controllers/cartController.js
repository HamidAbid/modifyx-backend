import Cart from '../models/Cart.js';
import mongoose from 'mongoose';

export const addToCart = async (req, res) => {
  
  const userId = req.user.id;

  const { itemType, productId, quantity, customData } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, products: [] });

    if (itemType === 'standard') {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid productId' });
      }
      const idx = cart.products.findIndex(
        (it) =>
          it.itemType === 'standard' &&
          it.product?.toString() === productId
      );
      if (idx > -1) cart.products[idx].quantity += quantity;
      else cart.products.push({ itemType, product: productId, quantity });
    } else if (itemType === 'custom') {
      if (!customData?.name || !customData.price) {
        return res.status(400).json({ message: 'Incomplete custom data' });
      }
      cart.products.push({ itemType, quantity, customData });
    } else {
      return res.status(400).json({ message: 'Invalid itemType' });
    }

    await cart.save();
    res.status(200).json({ cart });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
      .populate('products.product')
      .lean();
    if (!cart) return res.json([]);

    res.status(200).json(cart.products);
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/cartController.js
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.productId;
console.log(itemId);
    const cart = await Cart.findOne({ user: userId });

    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    // 🧠 Special handling for custom item
    if (itemId.startsWith('custom-')) {
      const index = parseInt(itemId.split('-')[1]);
      if (!isNaN(index) && index >= 0 && index < cart.products.length) {
        cart.products.splice(index, 1);
      }
    } else {
      // Standard product
      cart.products = cart.products.filter(
        (item) => item.product?.toString() !== itemId
      );
    }

    await cart.save();
    res.status(200).json(cart.products);
  } catch (err) {
    console.error('Remove error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.products = [];
    await cart.save();
    res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
