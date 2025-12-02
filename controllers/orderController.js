import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js'
// routes/payment.js
import Stripe from 'stripe';
import { sendOrderConfirmationEmail } from './sendEmail.js';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

// @desc    Create new order
// @route   POST /api/orders
// @access  Private


// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      if (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        res.json(order);
      } else {
        res.status(401).json({ message: 'Not authorized' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'delivered';

      // Add tracking event for delivery
      order.trackingEvents.push({
        date: new Date(),
        description: 'Order has been delivered',
        location: req.body.location || 'Destination'
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status to processing
// @route   PUT /api/orders/:id/process
// @access  Private/Admin
export const updateOrderToProcessing = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = 'processing';
      order.processingDate = Date.now();

      // Add tracking event
      order.trackingEvents.push({
        date: new Date(),
        description: 'Order is being processed',
        location: 'Processing Center'
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status to shipped
// @route   PUT /api/orders/:id/ship
// @access  Private/Admin
export const updateOrderToShipped = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (!req.body.trackingNumber) {
        return res.status(400).json({ message: 'Tracking number is required' });
      }

      order.status = 'shipped';
      order.shippedDate = Date.now();
      order.trackingNumber = req.body.trackingNumber;
      
      // Set estimated delivery date (default to 3 days from now)
      const estimatedDays = req.body.estimatedDays || 3;
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
      order.estimatedDelivery = estimatedDate;

      // Add tracking event
      order.trackingEvents.push({
        date: new Date(),
        description: 'Order has been shipped',
        location: req.body.location || 'Shipping Center'
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add tracking event to order
// @route   POST /api/orders/:id/tracking
// @access  Private/Admin
export const addTrackingEvent = async (req, res) => {
  try {
    const { description, location } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: 'Description is required for tracking event' });
    }

    const order = await Order.findById(req.params.id);

    if (order) {
      order.trackingEvents.push({
        date: new Date(),
        description,
        location: location || ''
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Track order by ID or tracking number
// @route   GET /api/orders/track/:identifier
// @access  Public
export const trackOrder = async (req, res) => {
  try {
    const id = req.params.trackingId;
    // Check if it's a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid tracking ID format' });
    }
    // Find order and populate product details
    const order = await Order.findById(id).populate('items.product', 'name image price');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const trackingInfo = {
      orderId: order._id,
      status: order.status,
      isPaid: order.isPaid,
      email:order.email,
      phoneNumber:order.phoneNumber,
      isDelivered: order.isDelivered,
      createdAt: order.createdAt,
      processingDate: order.processingDate,
      shippedDate: order.shippedDate,
      deliveredAt: order.deliveredAt,
      estimatedDelivery: order.estimatedDelivery,
      shippingAddress: order.shippingAddress,
      totalPrice: order.totalPrice,
      trackingEvents: order.trackingEvents,
      items: order.items.map(item => ({
        itemType: item.itemType,
        quantity: item.quantity,
        price: item.price,
        product: item.itemType === 'standard'
          ? {
              _id: item.product?._id,
              name: item.product?.name,
              image: item.product?.image,
              price: item.product?.price,
            }
          : null,
        customData: item.itemType === 'custom'
          ? item.customData
          : null
      }))
    };

    res.json(trackingInfo);
  } catch (error) {
    console.error('Tracking error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




 
 export const payment = async (req, res) => {
   const { orderData } = req.body;
   const userId = req.user._id;
 
   console.log('Order data received:');
 
   if (!orderData || !Array.isArray(orderData.items)) {
     return res.status(400).json({ error: 'Invalid order data' });
   }
 
   try {

 
     // ✅ Transform items for DB
     const dbItems = orderData.items.map((item) => ({
      
      itemType: item.itemType,
      product: item.itemType === 'standard' ? item.product : undefined,
      customData: item.itemType === 'custom' ? {
        name: item.name,
        description: item.description || '',
        image: item.image || ''
      } : undefined,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));
    
 
     // ✅ Build order
     const order = new Order({
      user: userId,
      items: dbItems,
      email: orderData.customer.email,
   phoneNumber: orderData.customer.phone,
      shippingAddress: {
        street: orderData.shippingAddress.street,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state || 'N/A',
        zipCode: orderData.shippingAddress.zipCode || '',
        country: orderData.shippingAddress.country || 'Pakistan'
      },
      paymentMethod: orderData.paymentMethod === 'creditCard' ? 'credit_card' : 'cash_on_delivery',
      shippingCharges: orderData.shippingCharges || 0,
      status: 'pending',
      isPaid: orderData.paymentMethod === 'creditCard', // ✅ dynamically set
    });
    
 
     const savedOrder = await order.save();
 
     // ✅ Stripe line items
     const line_items = orderData.items.map((product) => ({
       price_data: {
         currency: 'usd',
         product_data: {
           name: product.name || 'Unnamed Product',
         },
         unit_amount: Math.round(Number(product.price) * 100),
       },
       quantity: product.quantity || 1,
     }));
 
     const session = await stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       mode: 'payment',
       line_items,
       success_url: `https://modifyx.vercel.app/`,
       cancel_url: 'https://modifyx.vercel.app/',
     });
    
     const populatedOrder = await savedOrder.populate('user', 'email name');
     var userEmail=orderData.customer.email
await sendOrderConfirmationEmail(userEmail);

     await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });
     res.json({ id: session.id });
   } catch (error) {
     console.error('Stripe or DB error:', error.message);
     res.status(500).json({ error: error.message });
   }
 };
 