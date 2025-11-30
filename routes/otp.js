import express from 'express';
import { resetPassword, sendOtp, verifyOtp } from '../controllers/otpController.js';

const router = express.Router();

router.post('/forgot-password', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;