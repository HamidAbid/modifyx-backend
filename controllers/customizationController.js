import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Get available customization options
export const getCustomizationOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      colors: product.colors,
      sizes: product.sizes,
      addons: product.addons,
      customizationOptions: product.customizationOptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit a customization request
export const submitCustomization = async (req, res) => {
  try {
    const {
      productId,
      selectedColors,
      selectedSize,
      selectedAddons,
      customMessage,
      quantity,
      deliveryDate
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate total price including customization
    let totalPrice = product.price;
    if (selectedAddons) {
      selectedAddons.forEach(addon => {
        const addonOption = product.addons.find(a => a.name === addon);
        if (addonOption) {
          totalPrice += addonOption.price;
        }
      });
    }

    // Create a new order with customization details
    const order = new Order({
      user: req.user._id,
      products: [{
        product: productId,
        quantity,
        customization: {
          colors: selectedColors,
          size: selectedSize,
          addons: selectedAddons,
          customMessage
        }
      }],
      totalAmount: totalPrice * quantity,
      deliveryDate,
      status: 'pending'
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get customization history for a user
export const getCustomizationHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      'products.customization': { $exists: true }
    })
    .populate('products.product')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 