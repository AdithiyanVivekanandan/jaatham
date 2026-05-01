/**
 * auth.js — Authentication middleware
 * 
 * Security notes:
 * - Explicitly sets algorithms: ['HS256'] to prevent algorithm confusion attacks
 * - Fetches user without sensitive fields (otpHash, refreshTokenHash, etc.)
 * - Checks isActive to prevent deactivated accounts from accessing API
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Verify with explicit algorithm list — prevents algorithm confusion (e.g., RS256 swap)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256']
    });

    // Fetch user — sensitive fields excluded via schema select:false
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Session invalid. Please log in again.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Session invalid. Please log in again.' });
    }
    return res.status(401).json({ error: 'Authorization failed' });
  }
};

/**
 * Requires user to have admin role.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

/**
 * Optional auth — attaches user to req if token present, but does not block.
 * Useful for public routes that show more data when authenticated.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
      const user = await User.findById(decoded.id);
      if (user?.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Optional — silently ignore invalid tokens
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuth
};
