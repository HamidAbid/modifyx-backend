import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to verify JWT token
export const auth = async (req, res, next) => {
  try {
     
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ','');

    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    
    try {
     
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
     
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('Authentication failed: User not found for token');
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('User authenticated:', user._id);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      res.status(401).json({ message: 'Token is not valid', error: jwtError.message });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    console.log('Admin check middleware called');
    
    if (!req.user) {
      console.log('Admin check failed: No authenticated user');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('Checking admin status for user:', req.user._id);
    console.log('User role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('Admin access denied for user:', req.user._id);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    console.log('Admin access granted for user:', req.user._id);
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 