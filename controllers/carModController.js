import CarModRequest from '../models/carMod.js';
import User from '../models/User.js';

// Create a new car modification request
export const createCarModRequest = async (req, res) => {
  try {
    const { name, email, phone, carPackage, message } = req.body;

    console.log(name, email, phone, carPackage, message);

    if (!name || !email || !phone || !carPackage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRequest = new CarModRequest({
      user: req.user?._id, // optional if user is logged in
      name,
      email,
      phone,
      carPackage,
      message
    });

    await newRequest.save();

    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('Error creating car mod request:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

