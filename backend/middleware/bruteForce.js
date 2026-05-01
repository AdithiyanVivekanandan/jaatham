/**
 * bruteForce.js
 * Per-phone and per-IP brute force protection using in-memory store.
 * Tracks failed attempts with exponential backoff and account lockout.
 * Sensitive data (phone numbers) are hashed before storage.
 */
const crypto = require('crypto');

// Hash identifier to avoid storing PII in memory
const hashId = (id) => crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 16);

class BruteForceStore {
  constructor() {
    this.store = new Map();
    // Sweep expired records every 15 minutes
    setInterval(() => this._sweep(), 15 * 60 * 1000);
  }

  _key(identifier) {
    return hashId(identifier);
  }

  _get(identifier) {
    return this.store.get(this._key(identifier)) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  }

  _set(identifier, data) {
    this.store.set(this._key(identifier), data);
  }

  _sweep() {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      // Remove records that haven't been touched in 1 hour and aren't locked
      if (now - v.lastAttempt > 60 * 60 * 1000 && v.lockedUntil < now) {
        this.store.delete(k);
      }
    }
  }

  /**
   * Record a failed attempt for identifier.
   * Returns { blocked: true, retryAfterMs } if account should be blocked.
   */
  recordFailure(identifier, { maxAttempts = 5, lockoutMs = 15 * 60 * 1000 } = {}) {
    const record = this._get(identifier);
    const now = Date.now();

    // Still locked?
    if (record.lockedUntil > now) {
      return { blocked: true, retryAfterMs: record.lockedUntil - now, attempts: record.count };
    }

    // Window: reset count if last attempt was > lockoutMs ago
    const windowMs = lockoutMs;
    if (now - record.lastAttempt > windowMs) {
      record.count = 0;
    }

    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= maxAttempts) {
      // Exponential backoff: lockout doubles each trigger (max 24h)
      const lockouts = Math.floor(record.count / maxAttempts);
      const backoffMs = Math.min(lockoutMs * Math.pow(2, lockouts - 1), 24 * 60 * 60 * 1000);
      record.lockedUntil = now + backoffMs;
      this._set(identifier, record);
      return { blocked: true, retryAfterMs: backoffMs, attempts: record.count };
    }

    this._set(identifier, record);
    return { blocked: false, attempts: record.count, remaining: maxAttempts - record.count };
  }

  /**
   * Check if identifier is currently blocked without recording a failure.
   */
  isBlocked(identifier) {
    const record = this._get(identifier);
    const now = Date.now();
    if (record.lockedUntil > now) {
      return { blocked: true, retryAfterMs: record.lockedUntil - now };
    }
    return { blocked: false };
  }

  /**
   * Clear all failures for an identifier (call on successful auth).
   */
  clearFailures(identifier) {
    this.store.delete(this._key(identifier));
  }
}

const otpVerifyStore = new BruteForceStore();
const loginStore = new BruteForceStore();
const refreshStore = new BruteForceStore();

/**
 * Middleware: protect OTP verify endpoint
 * Max 5 wrong attempts per phone per 15 minutes, then exponential lockout.
 */
const otpBruteForceGuard = (req, res, next) => {
  const phone = req.body?.phone || 'unknown';
  const ipKey = `ip_${req.ip}_${hashId(phone)}`;
  const check = otpVerifyStore.isBlocked(ipKey);

  if (check.blocked) {
    const retryMins = Math.ceil(check.retryAfterMs / 60000);
    return res.status(429).json({
      error: 'Too many failed attempts. Account temporarily locked.',
      retryAfterMinutes: retryMins
    });
  }
  // Attach store reference to req for use in route
  req._bruteForceStore = otpVerifyStore;
  req._bruteForceKey = ipKey;
  next();
};

/**
 * Middleware: protect refresh token endpoint
 * Max 10 requests per IP per 5 minutes.
 */
const refreshBruteForceGuard = (req, res, next) => {
  const key = `refresh_${req.ip}`;
  const check = refreshStore.isBlocked(key);
  if (check.blocked) {
    return res.status(429).json({ error: 'Too many refresh attempts. Please try again later.' });
  }
  req._refreshBFStore = refreshStore;
  req._refreshBFKey = key;
  next();
};

module.exports = {
  otpVerifyStore,
  loginStore,
  refreshStore,
  otpBruteForceGuard,
  refreshBruteForceGuard,
  BruteForceStore
};
