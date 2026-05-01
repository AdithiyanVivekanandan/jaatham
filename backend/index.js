require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody, detectInjection } = require('./middleware/security');
const { auditLog } = require('./middleware/auditLogger');
const setupSwagger = require('./swagger');

// Initialize DB (skip in tests)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// ─── 0. Trust proxy (required for accurate IP behind Railway/Vercel/Cloudflare) ─
// Set to 1 to trust one hop (Cloudflare/Railway proxy), never 'true' (bypasses rate limit)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── 1. Security Headers (hardened) ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://api.opencagedata.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  crossOriginEmbedderPolicy: false, // Allow PDF embedding
  crossOriginOpenerPolicy: { policy: 'same-origin' },
}));

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Capacitor)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
}));

// ─── 3. Body Parsing (tight limits) ──────────────────────────────────────────
// Global limit: 100kb — prevents body DoS
// File uploads handled separately by multer (up to 5MB only on /me/photo)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// ─── 4. Injection Sanitization ────────────────────────────────────────────────
// 4a. NoSQL injection (mongoSanitize)
app.use(mongoSanitize({ allowDots: true, replaceWith: '_' }));

// 4b. XSS sanitization
app.use(xss());

// 4c. Null byte / prototype pollution / control char strip
app.use(sanitizeBody);

// 4d. Injection pattern detector (catches $where, <script>, etc.)
app.use(detectInjection);

// ─── 5. Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── 6. Request Logging (PII-safe) ───────────────────────────────────────────
// Log only method, path, status, response time — NEVER body or auth headers
const morganFormat = ':method :url :status :res[content-length] - :response-time ms - :remote-addr';
app.use(morgan(morganFormat, {
  skip: (req) => req.path === '/health',
  stream: {
    write: (msg) => {
      // Strip any accidental auth tokens from URL (e.g., ?token=...) before logging
      const sanitized = msg.trim().replace(/([?&])(token|key|secret|password|otp)=[^&\s]*/gi, '$1$2=[REDACTED]');
      process.stdout.write(sanitized + '\n');
    }
  }
}));

// ─── 7. Swagger (dev only) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// ─── 8. Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/users', require('./routes/users'));

// ─── 9. Static Security Files ─────────────────────────────────────────────────
// robots.txt: Disallow all crawlers on API
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    'User-agent: *\nDisallow: /api/\nDisallow: /swagger/\n\nUser-agent: *\nAllow: /$\n'
  );
});

// security.txt: Responsible disclosure policy
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').send(
    `Contact: mailto:security@jatham.app\nExpires: 2027-01-01T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://jatham.app/.well-known/security.txt\nPolicy: https://jatham.app/security-policy\n`
  );
});

// ─── 10. Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 11. 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  auditLog({ event: 'ROUTE_NOT_FOUND', path: req.path?.slice(0, 100), method: req.method, ip: req.ip });
  res.status(404).json({ error: 'Not found' });
});

// ─── 12. Global Error Handler ─────────────────────────────────────────────────
// SECURITY: Never expose stack traces or internal error messages in production
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log full error internally (stack trace safe here — goes to server logs not client)
  if (!isProduction) {
    console.error('[ERROR]', err.stack);
  } else {
    // In production: log error ID for tracing, not full stack
    const errorId = Date.now().toString(36);
    auditLog({ event: 'UNHANDLED_ERROR', errorId, message: err.message?.slice(0, 200), ip: req.ip });
    return res.status(err.status || 500).json({
      error: 'An unexpected error occurred',
      errorId // Safe to return — just a reference ID, no internals
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Server error'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    auditLog({ event: 'SERVER_START', port: PORT, env: process.env.NODE_ENV });
  });
}

module.exports = app;
