/**
 * rateLimiter.js
 * All rate limiters for the Jatham API.
 * Uses express-rate-limit with standardHeaders enabled.
 * Each limiter is tuned specifically for its attack surface.
 */
const rateLimit = require('express-rate-limit');

// ─── Shared handler — never reveals internal details ─────────────────────────
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests. Please slow down.',
    retryAfter: Math.ceil(res.getHeader('Retry-After') || 60)
  });
};

// ─── General API limiter ──────────────────────────────────────────────────────
// 100 requests per IP per 15 minutes for all /api routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.path === '/health' // health check exempt
});

// ─── OTP Request limiter ──────────────────────────────────────────────────────
// 3 OTP requests per phone per 10 minutes (keyed by phone+IP combo)
// This prevents attackers burning someone's SMS credit
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    // Key on both IP and phone to catch distributed attacks
    const phone = req.body?.phone || '';
    const phoneHash = phone.slice(-4); // last 4 digits only, not full phone
    return `otp_${req.ip}_${phoneHash}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many OTP requests. Please wait 10 minutes before requesting again.',
      retryAfterMinutes: 10
    });
  }
});

// ─── OTP Verify limiter ───────────────────────────────────────────────────────
// 5 verify attempts per phone per 15 minutes — works WITH bruteForce.js
// This is the express-rateLimit layer; bruteForce.js provides lockout layer
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // generous — bruteForce.js kicks in at 5 wrong answers
  keyGenerator: (req) => {
    const phone = req.body?.phone || '';
    return `verify_${req.ip}_${phone.slice(-4)}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many verification attempts. Account temporarily locked.',
      retryAfterMinutes: 15
    });
  }
});

// ─── Refresh token limiter ────────────────────────────────────────────────────
// 20 refreshes per IP per 5 minutes — prevents token brute force
const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `refresh_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many token refresh requests. Please wait.' });
  }
});

// ─── Match endpoint limiter ───────────────────────────────────────────────────
// 30 match requests per authenticated user per minute
const matchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user ? `match_${req.user._id}` : `match_ip_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// ─── PDF export limiter ───────────────────────────────────────────────────────
// 5 PDF exports per user per hour (expensive operation)
const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user ? `pdf_${req.user._id}` : `pdf_ip_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'PDF export limit reached. You can export up to 5 PDFs per hour.',
      retryAfterMinutes: 60
    });
  }
});

// ─── Community join limiter ───────────────────────────────────────────────────
// 3 join attempts per user per hour (prevent invite code enumeration)
const communityJoinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user ? `join_${req.user._id}` : `join_ip_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many community join attempts. Please wait before trying again.',
      retryAfterMinutes: 60
    });
  }
});

// ─── Community lookup limiter ─────────────────────────────────────────────────
// 10 lookups per IP per 15 minutes (prevent invite code brute force enumeration)
const communityLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `lookup_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many lookup attempts. Please wait.' });
  }
});

// ─── Account deletion limiter ─────────────────────────────────────────────────
// 2 deletion attempts per IP per day (high-impact destructive operation)
const deletionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  keyGenerator: (req) => `del_${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Account deletion request limit reached.' });
  }
});

module.exports = {
  generalLimiter,
  otpLimiter,
  verifyOtpLimiter,
  refreshLimiter,
  matchLimiter,
  pdfLimiter,
  communityJoinLimiter,
  communityLookupLimiter,
  deletionLimiter
};
