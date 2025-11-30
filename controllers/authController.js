import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT
const generateToken = (id) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    // console.log(`Token generated for user ID: ${id}`);
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
  
console.log(1);
    const { name, email, password,number } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log("1",number);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      number
    });
    
    if (user) {
      console.log(`User registered successfully: ${user._id}`);
      
      const newUser = await User.findOne({ email });
      // Generate token
      const token =  generateToken(newUser._id);
      
     return res.status(201).json({
      _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
   

    const { email, password } = req.body;
console.log(email,password);
    // Check for user email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    console.log(`Password match for ${email}: ${isMatch}`);

    if (isMatch) {
      // Generate token
      const token = generateToken(user._id);
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      console.log(`Login failed: Invalid password for ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      console.log(`Profile retrieved successfully for: ${user._id}`);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.number
      });
    } else {
      
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
   
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    console.log(`Updating profile for user: ${req.user._id}`);
    console.log('Update data:', req.body);
    
    const { name, email, phone, address } = req.body;
    
    // Find user and update
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log(`Profile update failed: User not found with ID ${req.user._id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    // Save updated user
    const updatedUser = await user.save();
    
    console.log(`Profile updated successfully for: ${updatedUser._id}`);
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      address: updatedUser.address,
      phone: updatedUser.phone
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 