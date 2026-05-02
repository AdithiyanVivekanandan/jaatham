/**
 * email.js — Email service using Resend (Free Tier: 3,000/month)
 */
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Sends an OTP email to the user.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit code
 */
async function sendOtpEmail(to, otp) {
  if (!resend) {
    console.warn(`[DEV] Email to ${to}: Your Jatham OTP is ${otp}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Jatham <onboarding@resend.dev>', // Default for unverified domains in free tier
      to: [to],
      subject: 'Your Jatham Login Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #9B2C2C;">Jatham Matchmaking</h2>
          <p>Your security code for logging in is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #9B2C2C; padding: 10px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #666;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err) {
    console.error('Email service error:', err);
    throw err;
  }
}

module.exports = { sendOtpEmail };
