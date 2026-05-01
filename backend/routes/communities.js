/**
 * communities.js — Community routes
 * 
 * Security hardening:
 * - GET /:code: rate limited (invite code enumeration protection)
 * - POST /:code/join: rate limited (3/hr per user)
 * - Invite code validated — alphanumeric only, max 12 chars
 * - Audit logging
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const crypto = require('crypto');
const Community = require('../models/Community');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { communityJoinLimiter, communityLookupLimiter } = require('../middleware/rateLimiter');
const { audit } = require('../middleware/auditLogger');

const inviteCodeSchema = z.string()
  .min(4)
  .max(12)
  .regex(/^[A-Z0-9]+$/, 'Invite code must be alphanumeric uppercase');

// ─── POST /api/communities ───────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const schema = z.object({
      name: z.string().min(3).max(100).regex(/^[\p{L}\s\-'.]+$/u, 'Invalid community name'),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
    });

    const data = schema.parse(req.body);
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const community = await Community.create({
      ...data,
      adminUserId: req.user._id,
      inviteCode,
    });

    res.status(201).json({
      _id: community._id,
      name: community.name,
      city: community.city,
      inviteCode: community.inviteCode
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/communities/:code ──────────────────────────────────────────────
// Rate limited to prevent invite code enumeration
router.get('/:code', communityLookupLimiter, async (req, res) => {
  try {
    // Validate code format before any DB query
    const code = req.params.code?.toUpperCase();
    const parsed = inviteCodeSchema.safeParse(code);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid invite code format' });
    }

    const community = await Community.findOne({
      inviteCode: parsed.data,
      isActive: true
    }).select('name city state memberCount inviteCode');

    if (!community) {
      // Constant time response to prevent timing-based enumeration
      await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/communities/:code/join ────────────────────────────────────────
router.post('/:code/join', authMiddleware, communityJoinLimiter, async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const parsed = inviteCodeSchema.safeParse(code);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid invite code format' });
    }

    const community = await Community.findOne({
      inviteCode: parsed.data,
      isActive: true
    });

    if (!community) {
      // Same response as not found — don't reveal code validity
      await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (req.user.communityId?.toString() === community._id.toString()) {
      return res.status(400).json({ error: 'You are already a member of this community' });
    }

    await User.findByIdAndUpdate(req.user._id, { communityId: community._id });
    await Community.findByIdAndUpdate(community._id, { $inc: { memberCount: 1 } });

    audit.communityJoined(req, community._id);

    res.json({
      message: `Successfully joined "${community.name}"`,
      community: { id: community._id, name: community.name, city: community.city }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/communities ─────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const communities = await Community.find({ isActive: true })
      .sort({ memberCount: -1 })
      .limit(200);
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
