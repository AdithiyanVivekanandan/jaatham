/**
 * security.js
 * Security middleware collection:
 * - MongoDB ObjectId validator (prevents path traversal via ObjectId params)
 * - Path traversal guard for filesystem access
 * - IDOR helpers (verify user owns the resource)
 * - Input sanitization helpers
 */
const mongoose = require('mongoose');
const { audit } = require('./auditLogger');

/**
 * Middleware: Validate that req.params.id is a valid MongoDB ObjectId.
 * Rejects anything that isn't a 24-char hex string, preventing:
 * - Path traversal via ../../../etc/passwd style params
 * - NoSQL injection via $where etc.
 * - Prototype pollution via __proto__ params
 */
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const param = req.params[paramName];
  if (!param) return next();

  // Must be exactly a 24-char hex string (MongoDB ObjectId)
  if (!/^[a-fA-F0-9]{24}$/.test(param)) {
    audit.pathTraversalAttempt(req, param);
    return res.status(400).json({ error: 'Invalid identifier format' });
  }

  // Verify it's a valid ObjectId (not just hex)
  if (!mongoose.Types.ObjectId.isValid(param)) {
    return res.status(400).json({ error: 'Invalid identifier' });
  }
  next();
};

/**
 * Guard filesystem path construction from user input.
 * Call before any fs.existsSync / res.download with user-supplied filenames.
 * Returns { safe: false } if the resolved path escapes the base directory.
 */
const safeFilePath = (baseDir, userSuppliedId) => {
  const path = require('path');
  
  // Only allow safe MongoDB ObjectId format for file names
  if (!/^[a-fA-F0-9]{24}$/.test(userSuppliedId)) {
    return { safe: false, reason: 'Invalid file identifier format' };
  }
  
  const resolved = path.resolve(baseDir, `${userSuppliedId}.pdf`);
  const base = path.resolve(baseDir);
  
  // Ensure resolved path is still inside baseDir (prevent ../ traversal)
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return { safe: false, reason: 'Path traversal detected' };
  }
  
  return { safe: true, filePath: resolved };
};

/**
 * Middleware: Validate that at least one party in a match belongs to the requesting user.
 * Used on match-specific routes to prevent IDOR.
 * Attaches match to req.match on success.
 */
const requireMatchOwnership = (MatchResult) => async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    const match = await MatchResult.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const userProfileId = req.user?.profileId?.toString();
    const profileAId = match.profileA?.toString();
    const profileBId = match.profileB?.toString();

    if (!userProfileId || (profileAId !== userProfileId && profileBId !== userProfileId)) {
      audit.unauthorizedAccess(req, `match:${matchId}`);
      return res.status(403).json({ error: 'Access denied — this match does not belong to you' });
    }

    req.match = match;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Strip null bytes and control characters from string inputs.
 * Null bytes (\x00) can bypass some string operations and cause filesystem issues.
 */
const stripDangerousChars = (str) => {
  if (typeof str !== 'string') return str;
  // Remove null bytes, non-printable ASCII control chars (except tab/newline), and Unicode bidirectional override chars
  return str
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, ''); // Bidirectional text override
};

/**
 * Middleware: Apply stripDangerousChars to all string values in req.body recursively.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
};

function deepSanitize(obj, depth = 0) {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripDangerousChars(obj);
  if (Array.isArray(obj)) return obj.slice(0, 100).map(v => deepSanitize(v, depth + 1)); // cap array length
  if (typeof obj === 'object') {
    const sanitized = {};
    let keyCount = 0;
    for (const [key, val] of Object.entries(obj)) {
      if (keyCount++ > 50) break; // cap object depth to prevent DoS
      // Block prototype pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      sanitized[stripDangerousChars(key)] = deepSanitize(val, depth + 1);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Middleware: Block suspicious query parameters that suggest injection attempts.
 * Catches common patterns: $where, $gt, $regex, script tags, null bytes.
 */
const detectInjection = (req, res, next) => {
  const suspicious = /(\$where|\$gt|\$lt|\$regex|\$ne|\$in|<script|javascript:|%00|union\s+select|drop\s+table)/i;
  const checkValue = (val) => {
    if (typeof val === 'string' && suspicious.test(val)) return true;
    if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(checkValue);
    }
    return false;
  };

  const allInput = { ...req.query, ...req.body, ...req.params };
  if (checkValue(allInput)) {
    audit.suspiciousInput(req, 'body/query', 'Injection pattern detected');
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  next();
};

module.exports = {
  validateObjectId,
  safeFilePath,
  requireMatchOwnership,
  sanitizeBody,
  detectInjection,
  stripDangerousChars,
  deepSanitize
};
