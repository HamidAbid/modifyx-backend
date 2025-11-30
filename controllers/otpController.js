import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const otpStore = {}; // Temporary OTP store (use Redis in production)

// 🔐 OAuth2 Setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// ✅ Send OTP
export async function sendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found with this email.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    };

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🔐 Your OTP Code</h2>
        <p>Use the following code to reset your password:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">${otp}</div>
        <p>This OTP will expire in 5 minutes.</p>
        <hr/>
        <p style="font-size: 12px; color: #888;">Floral Artistry - Password Security</p>
      </div>
    `;

    await transporter.sendMail({
      from: `Floral Artistry <${process.env.GMAIL_SENDER_EMAIL}>`,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
      html: htmlContent,
    });

    console.log(`✅ OTP for ${email}: ${otp}`);
    res.status(200).json({ message: 'OTP sent to your email.' });

  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
}

// ✅ Verify OTP
export function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ error: 'OTP not found. Please request again.' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired. Please request again.' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  delete otpStore[email];
  res.json({ message: 'OTP verified. You can now reset your password.' });
}

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = newPassword; // will be hashed via mongoose pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful.' });

  } catch (error) {
    console.error('Reset error:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
