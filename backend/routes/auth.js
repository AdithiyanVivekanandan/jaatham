/**
 * auth.js — Authentication routes (Updated for 100% Free Email OTP)
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { otpLimiter, verifyOtpLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { otpBruteForceGuard } = require('../middleware/bruteForce');
const { sendOtpEmail } = require('../services/email');

// ─── Schemas ──────────────────────────────────────────────────────────────────
const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  email: z.string().email().optional()
}).refine(data => data.phone || data.email, {
  message: "Either phone or email must be provided"
});

const verifyOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6).regex(/^\d{6}$/)
}).refine(data => data.phone || data.email, {
  message: "Either phone or email must be provided"
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/request-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, email } = requestOtpSchema.parse(req.body);
    const query = email ? { email } : { phone };

    const otp = process.env.NODE_ENV === 'development'
      ? '123456'
      : require('crypto').randomInt(100000, 999999).toString();

    const otpHash = await bcrypt.hash(otp, 12);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne(query);
    if (!user) {
      user = new User({ ...query, otpHash, otpExpiry });
    } else {
      user.otpHash = otpHash;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0;
    }
    await user.save();

    // ── Delivery ───────────────────────────────────────────────────────────
    if (email) {
      await sendOtpEmail(email, otp);
    } else if (phone && process.env.TWILIO_ACCOUNT_SID) {
      // Logic for Twilio would go here
      // For now, if no Twilio, we just log in dev
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] OTP for ${email || phone}: ${otp}`);
    }

    res.json({ message: 'Code sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to request code' });
  }
});

router.post('/verify-otp', verifyOtpLimiter, otpBruteForceGuard, async (req, res) => {
  try {
    const { phone, email, otp } = verifyOtpSchema.parse(req.body);
    const query = email ? { email } : { phone };

    const user = await User.findOne(query).select('+otpHash +otpExpiry +otpAttempts');

    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'Code expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Success
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileId: user.profileId
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
});

module.exports = router;
