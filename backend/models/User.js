/**
 * User.js — User model
 * 
 * Security notes:
 * - Supports both phone and email as identifiers (facilitates 100% free email-auth)
 * - phone/email fields are marked for CSFLE encryption in production
 * - otpHash, refreshTokenHash are bcrypt hashes — NEVER store plaintext
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Identity — one of these must be present
  phone: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['parent', 'candidate', 'admin'],
    default: 'parent'
  },

  // Auth
  refreshTokenHash: { type: String, select: false },
  otpHash: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },

  // Status
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Preferences
  language: { type: String, enum: ['en', 'ta'], default: 'en' },

  // Relations
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', index: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, select: false },
}, {
  strict: true,
  versionKey: false
});

// Ensure at least one identity field is present
UserSchema.pre('validate', function(next) {
  if (!this.phone && !this.email) {
    next(new Error('User must have either a phone number or an email address'));
  } else {
    next();
  }
});

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.otpHash;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  delete obj.refreshTokenHash;
  delete obj.lastLogin;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
