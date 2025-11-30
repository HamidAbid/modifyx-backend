import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

export const sendOrderConfirmationEmail = async (userEmail) => {
  if (!userEmail) return;
  try {
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
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Welcome to Floral!</h2>
        <p>Thank you for your order. </p>
        <p>We’ll notify you when it ships. 🌸</p>
        <hr/>
        <h3>Thank you for choosing us!</h3>
      </div>
    `;

    await transporter.sendMail({
      from: `Floral Artistry <${process.env.GMAIL_SENDER_EMAIL}>`,
      to: userEmail,
      subject: 'Thank you for your order 🌼',
      html: htmlContent,
    });

    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
  }
};
