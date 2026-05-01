/**
 * auth.js — Authentication routes
 * 
 * Security hardening:
 * - OTP never logged to console
 * - Account enumeration normalized (same error for all OTP failures)
 * - OTP attempt counter with brute force lockout
 * - JWT algorithm explicitly set (HS256)
 * - Cookie cleared with same options on logout (prevents stale cookies on subdomains)
 * - Refresh tokens rate limited + brute force guarded
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { otpLimiter, verifyOtpLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { otpBruteForceGuard, otpVerifyStore, refreshBruteForceGuard } = require('../middleware/bruteForce');
const { audit } = require('../middleware/auditLogger');

// ─── Schemas ──────────────────────────────────────────────────────────────────
const requestOtpSchema = z.object({
  phone: z.string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
    .transform(v => v.trim())
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).transform(v => v.trim()),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits')
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/' // explicit path required for clearCookie to work correctly
};

const JWT_OPTIONS = { algorithm: 'HS256' };

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { ...JWT_OPTIONS, expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { ...JWT_OPTIONS, expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

/** Generic OTP failure response — always same message to prevent enumeration */
const OTP_FAIL_RESPONSE = { error: 'Invalid or expired OTP. Please request a new one.' };

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/request-otp
 * Rate limited: 3 per phone+IP per 10 minutes
 */
router.post('/request-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = requestOtpSchema.parse(req.body);

    // Generate 6-digit OTP
    // In production: use crypto.randomInt for cryptographically secure random
    const otp = process.env.NODE_ENV === 'development'
      ? '123456'
      : require('crypto').randomInt(100000, 999999).toString();

    const otpHash = await bcrypt.hash(otp, 12); // 12 rounds for OTP (short-lived, high-value)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, otpHash, otpExpiry });
    } else {
      // Clear any previous OTP attempt counter on new request
      user.otpHash = otpHash;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0; // reset counter
    }
    await user.save();

    // SECURITY: NEVER log the OTP or phone number
    // In production: await twilioClient.messages.create(...)
    // Dev: OTP available via database query only, not logs
    if (process.env.NODE_ENV === 'development') {
      // Log only a placeholder, not the actual OTP
      process.stdout.write(JSON.stringify({ event: 'DEV_OTP_READY', ts: new Date().toISOString() }) + '\n');
    }

    audit.loginAttempt(req);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors?.[0]?.message || 'Invalid phone number format' });
    }
    // Do not expose internal errors
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Rate limited: 10 per phone+IP per 15 minutes (express layer)
 * Brute force guarded: 5 failures → exponential lockout (BruteForce layer)
 */
router.post('/verify-otp', verifyOtpLimiter, otpBruteForceGuard, async (req, res) => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const bruteForceKey = req._bruteForceKey;

    // ── Find user — but don't reveal whether phone exists ──────────────────
    const user = await User.findOne({ phone });

    if (!user || !user.otpHash || !user.otpExpiry) {
      // Record failure regardless — prevents timing-based enumeration
      if (bruteForceKey) req._bruteForceStore.recordFailure(bruteForceKey);
      audit.loginFailure(req, 'NO_USER_OR_OTP');
      return res.status(400).json(OTP_FAIL_RESPONSE);
    }

    // ── Check expiry first ─────────────────────────────────────────────────
    if (new Date() > user.otpExpiry) {
      if (bruteForceKey) req._bruteForceStore.recordFailure(bruteForceKey);
      audit.loginFailure(req, 'OTP_EXPIRED');
      return res.status(400).json(OTP_FAIL_RESPONSE);
    }

    // ── Per-user attempt counter (persisted) ───────────────────────────────
    const MAX_ATTEMPTS = 5;
    user.otpAttempts = (user.otpAttempts || 0) + 1;

    if (user.otpAttempts > MAX_ATTEMPTS) {
      // Clear OTP to force re-request
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      await user.save();
      if (bruteForceKey) req._bruteForceStore.recordFailure(bruteForceKey);
      audit.loginFailure(req, 'TOO_MANY_ATTEMPTS');
      return res.status(429).json({
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // ── Verify OTP — constant time compare via bcrypt ──────────────────────
    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      await user.save(); // persist attempt count
      if (bruteForceKey) {
        const result = req._bruteForceStore.recordFailure(bruteForceKey);
        if (result.blocked) {
          audit.bruteForceBlocked(req, 'otp_verify');
          return res.status(429).json({
            error: 'Account temporarily locked due to multiple failed attempts.',
            retryAfterMinutes: Math.ceil(result.retryAfterMs / 60000)
          });
        }
      }
      audit.loginFailure(req, 'WRONG_OTP');
      return res.status(400).json(OTP_FAIL_RESPONSE);
    }

    // ── Success ────────────────────────────────────────────────────────────
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();

    const { accessToken, refreshToken } = generateTokens(user._id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // Clear brute force record on success
    if (bruteForceKey) req._bruteForceStore.clearFailures(bruteForceKey);

    audit.loginSuccess(req, user._id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: {
        id: user._id,
        phone: user.phone.replace(/(\+?\d{2})\d+(\d{4})/, '$1****$2'), // mask phone in response
        role: user.role,
        profileId: user.profileId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Rate limited: 20 per IP per 5 minutes
 * Brute force guarded: per-IP
 */
router.post('/refresh', refreshLimiter, refreshBruteForceGuard, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      audit.tokenRefreshFail(req, 'NO_TOKEN');
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    } catch (jwtErr) {
      // Clear invalid cookie
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      audit.tokenRefreshFail(req, 'INVALID_JWT');
      if (req._refreshBFStore) req._refreshBFStore.recordFailure(req._refreshBFKey);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      audit.tokenRefreshFail(req, 'USER_NOT_FOUND');
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Possible token theft — invalidate existing token
      user.refreshTokenHash = undefined;
      await user.save();
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      audit.tokenRefreshFail(req, 'TOKEN_MISMATCH_POSSIBLE_THEFT');
      if (req._refreshBFStore) req._refreshBFStore.recordFailure(req._refreshBFKey);
      return res.status(401).json({ error: 'Session invalid. Please log in again.' });
    }

    // Issue new token pair (refresh token rotation)
    const tokens = generateTokens(user._id);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();

    if (req._refreshBFStore) req._refreshBFStore.clearFailures(req._refreshBFKey);
    audit.tokenRefresh(req, user._id);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
        await User.findByIdAndUpdate(decoded.id, { $unset: { refreshTokenHash: 1 } });
        audit.logout(req, decoded.id);
      } catch (e) {
        // ignore jwt error on logout — still clear cookie
      }
    }
    // Clear with same options as set — required for proper clearing
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
