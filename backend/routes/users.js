/**
 * users.js — User account routes
 * 
 * Security hardening:
 * - DELETE /me: rate limited (2/day), audit logged, cascading delete
 * - PUT /me: Zod validated, only whitelisted fields
 * - GET /me: strips all sensitive fields from response
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const User = require('../models/User');
const Profile = require('../models/Profile');
const MatchResult = require('../models/MatchResult');
const { authMiddleware } = require('../middleware/auth');
const { deletionLimiter } = require('../middleware/rateLimiter');
const { audit } = require('../middleware/auditLogger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  path: '/'
};

// ─── GET /api/users/me ───────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-otpHash -refreshTokenHash -otpExpiry -otpAttempts');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Mask phone in response — return only last 4 digits for display
    res.json({
      id: user._id,
      maskedPhone: user.phone.replace(/(\+?\d{2})\d+(\d{4})/, '$1****$2'),
      role: user.role,
      profileId: user.profileId,
      isVerified: user.isVerified,
      communityId: user.communityId,
      language: user.language,
      defaultCalculationMethod: user.defaultCalculationMethod,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/users/me ───────────────────────────────────────────────────────
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const updateSchema = z.object({
      language: z.enum(['en', 'ta']).optional(),
      defaultCalculationMethod: z.enum(['thirukkanitha', 'vakyam']).optional(),
    });

    const updateData = updateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true })
      .select('-otpHash -refreshTokenHash -otpExpiry -otpAttempts');

    res.json({ message: 'Settings updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/users/me ────────────────────────────────────────────────────
// DPDP Act 2023 compliance: hard delete all user data
// Rate limited: max 2 attempts per IP per 24 hours
router.delete('/me', authMiddleware, deletionLimiter, async (req, res) => {
  try {
    const userId = req.user._id;
    const profileId = req.user.profileId;

    // 1. Delete all MatchResults involving this profile
    if (profileId) {
      await MatchResult.deleteMany({
        $or: [{ profileA: profileId }, { profileB: profileId }]
      });
      // 2. Hard delete the profile
      await Profile.findByIdAndDelete(profileId);
    }

    // 3. Hard delete the user
    await User.findByIdAndDelete(userId);

    audit.accountDeleted(req, userId);

    // Clear session cookie
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    res.json({
      message: 'Your account and all associated data have been permanently deleted in compliance with the DPDP Act 2023.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }
});

module.exports = router;
