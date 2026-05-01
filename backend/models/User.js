/**
 * User.js — User model
 * 
 * Security notes:
 * - phone field is marked for CSFLE encryption in production
 * - otpHash, refreshTokenHash are bcrypt hashes — NEVER store plaintext
 * - otpAttempts tracks per-user OTP failure count (server-side brute force guard)
 * - Indexes: phone (unique), profileId, communityId
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Identity — phone is encrypted via CSFLE in production
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    select: false // Never returned in queries unless explicitly selected
  },
  role: {
    type: String,
    enum: ['parent', 'candidate', 'admin'],
    default: 'parent'
  },

  // Auth — all are hashes, never plaintext
  refreshTokenHash: { type: String, select: false },
  otpHash: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false }, // brute force counter

  // Status
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Preferences
  language: { type: String, enum: ['en', 'ta'], default: 'en' },
  defaultCalculationMethod: { type: String, enum: ['thirukkanitha', 'vakyam'], default: 'thirukkanitha' },

  // Relations
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', index: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, select: false },
}, {
  // Prevent mongoose from adding extra fields not in schema
  strict: true,
  // Never return version key (__v) in API responses
  versionKey: false
});

// Always update updatedAt on save
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Ensure sensitive fields are not accidentally serialized to JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.otpHash;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  delete obj.refreshTokenHash;
  delete obj.email;
  delete obj.lastLogin;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
