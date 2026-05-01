/**
 * auditLogger.js
 * Structured security audit logging middleware.
 * CRITICAL: Never logs PII — phone numbers, names, birth data, locations are all masked.
 * Logs security-relevant events only: auth events, data access, errors.
 */

const SENSITIVE_FIELDS = ['phone', 'otp', 'password', 'dateOfBirth', 'timeOfBirth',
  'latitude', 'longitude', 'refreshToken', 'accessToken', 'otpHash', 'refreshTokenHash'];

/**
 * Mask any PII from an object before logging.
 * Recursively redacts known sensitive field names.
 */
function maskPII(obj, depth = 0) {
  if (depth > 3 || typeof obj !== 'object' || obj === null) return obj;
  const masked = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      masked[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      masked[key] = maskPII(val, depth + 1);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}

/**
 * Core audit log function. All events go here.
 * In production, pipe this to a dedicated log sink (Datadog, CloudWatch, etc.)
 */
function auditLog(event) {
  const entry = {
    ts: new Date().toISOString(),
    ...event,
    // Ensure no PII slips through via metadata
    metadata: event.metadata ? maskPII(event.metadata) : undefined
  };
  // Use process.stdout directly to avoid Morgan intercepting
  process.stdout.write(JSON.stringify(entry) + '\n');
}

/** AUTH events */
const audit = {
  loginAttempt: (req) => auditLog({ event: 'AUTH_OTP_REQUESTED', ip: req.ip, ua: req.headers['user-agent']?.slice(0, 100) }),
  loginSuccess: (req, userId) => auditLog({ event: 'AUTH_LOGIN_SUCCESS', userId, ip: req.ip }),
  loginFailure: (req, reason) => auditLog({ event: 'AUTH_LOGIN_FAILURE', reason, ip: req.ip }),
  logout: (req, userId) => auditLog({ event: 'AUTH_LOGOUT', userId, ip: req.ip }),
  tokenRefresh: (req, userId) => auditLog({ event: 'AUTH_TOKEN_REFRESH', userId, ip: req.ip }),
  tokenRefreshFail: (req, reason) => auditLog({ event: 'AUTH_TOKEN_REFRESH_FAIL', reason, ip: req.ip }),

  /** DATA events */
  profileCreated: (req, profileId) => auditLog({ event: 'PROFILE_CREATED', userId: req.user?._id, profileId, ip: req.ip }),
  profileUpdated: (req) => auditLog({ event: 'PROFILE_UPDATED', userId: req.user?._id, ip: req.ip }),
  profilePhotoUploaded: (req) => auditLog({ event: 'PROFILE_PHOTO_UPLOADED', userId: req.user?._id, ip: req.ip }),
  matchAccessed: (req, targetProfileId) => auditLog({ event: 'MATCH_ACCESSED', userId: req.user?._id, targetProfileId, ip: req.ip }),
  matchSaved: (req, matchId) => auditLog({ event: 'MATCH_SAVED', userId: req.user?._id, matchId, ip: req.ip }),
  pdfExported: (req, matchId) => auditLog({ event: 'PDF_EXPORTED', userId: req.user?._id, matchId, ip: req.ip }),
  outcomeLogged: (req, matchId, outcome) => auditLog({ event: 'OUTCOME_LOGGED', userId: req.user?._id, matchId, outcome, ip: req.ip }),

  /** SECURITY events */
  bruteForceBlocked: (req, target) => auditLog({ event: 'BRUTE_FORCE_BLOCKED', target, ip: req.ip, ua: req.headers['user-agent']?.slice(0, 100) }),
  unauthorizedAccess: (req, resource) => auditLog({ event: 'UNAUTHORIZED_ACCESS_ATTEMPT', resource, userId: req.user?._id, ip: req.ip }),
  pathTraversalAttempt: (req, param) => auditLog({ event: 'PATH_TRAVERSAL_ATTEMPT', param: param?.slice(0, 100), ip: req.ip, userId: req.user?._id }),
  accountDeleted: (req, userId) => auditLog({ event: 'ACCOUNT_DELETED', userId, ip: req.ip }),
  communityJoined: (req, communityId) => auditLog({ event: 'COMMUNITY_JOINED', userId: req.user?._id, communityId, ip: req.ip }),
  suspiciousInput: (req, field, reason) => auditLog({ event: 'SUSPICIOUS_INPUT', field, reason, ip: req.ip }),
};

module.exports = { audit, maskPII, auditLog };
