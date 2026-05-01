/**
 * matches.js — Match routes
 * 
 * Security hardening:
 * - Path traversal fixed: matchId validated as ObjectId before filesystem access
 * - IDOR fixed: /pdf, /export, /outcome require user to own the match
 * - IDOR fixed: /:profileId requires user has a profile to compare against
 * - PDF download uses safeFilePath() to prevent directory traversal
 * - Audit logging for all sensitive operations
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { matchLimiter, pdfLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, safeFilePath, requireMatchOwnership } = require('../middleware/security');
const { audit } = require('../middleware/auditLogger');
const Profile = require('../models/Profile');
const MatchResult = require('../models/MatchResult');
const { getRankedMatches, getOrComputeMatch } = require('../services/matching');
const { generateAIReport } = require('../services/ai');
const { pdfQueue } = require('../services/queue');

// ─── GET /api/matches ─────────────────────────────────────────────────────────
router.get('/', authMiddleware, matchLimiter, async (req, res) => {
  try {
    if (!req.user.profileId) {
      return res.status(404).json({ error: 'You must create a profile first to view matches' });
    }

    // Enforce safe pagination values
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const matches = await getRankedMatches(req.user.profileId, page, limit);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/matches/saved ───────────────────────────────────────────────────
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const savedMatches = await MatchResult.find({ savedByUsers: req.user._id })
      .populate('profileA', 'candidateName astroData.nakshatraName astroData.rasiName photoUrl')
      .populate('profileB', 'candidateName astroData.nakshatraName astroData.rasiName photoUrl')
      .limit(100); // cap results

    res.json(savedMatches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/matches/:profileId ─────────────────────────────────────────────
// SECURITY FIX: Validate profileId is a real ObjectId; verify requesting user has a profile
router.get('/:profileId',
  authMiddleware,
  matchLimiter,
  validateObjectId('profileId'),
  async (req, res) => {
    try {
      if (!req.user.profileId) {
        return res.status(404).json({ error: 'You must create a profile first' });
      }

      const myProfile = await Profile.findById(req.user.profileId);
      const targetProfile = await Profile.findById(req.params.profileId);

      if (!myProfile) return res.status(404).json({ error: 'Your profile not found' });
      if (!targetProfile || !targetProfile.isActive) {
        return res.status(404).json({ error: 'Target profile not found' });
      }

      // Prevent self-matching
      if (req.user.profileId.toString() === req.params.profileId) {
        return res.status(400).json({ error: 'Cannot match a profile with itself' });
      }

      audit.matchAccessed(req, req.params.profileId);

      let match = await getOrComputeMatch(myProfile, targetProfile);

      // Generate AI report if not exists
      if (!match.aiReport?.generated) {
        try {
          const reportText = await generateAIReport(match, myProfile, targetProfile);
          match.aiReport = { generated: true, reportText, generatedAt: new Date() };
          await match.save();
        } catch (err) {
          // AI failure is non-fatal — return match without report
        }
      }

      res.json(match);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── POST /api/matches/:profileId/save ───────────────────────────────────────
router.post('/:profileId/save',
  authMiddleware,
  validateObjectId('profileId'),
  async (req, res) => {
    try {
      if (!req.user.profileId) {
        return res.status(404).json({ error: 'You must create a profile first' });
      }

      const myProfile = await Profile.findById(req.user.profileId);
      const targetProfile = await Profile.findById(req.params.profileId);

      if (!myProfile || !targetProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      let match = await getOrComputeMatch(myProfile, targetProfile);

      if (!match.savedByUsers.includes(req.user._id)) {
        match.savedByUsers.push(req.user._id);
        await match.save();
        audit.matchSaved(req, match._id);
      }

      res.json({ message: 'Match saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── POST /api/matches/:matchId/export ───────────────────────────────────────
// SECURITY FIX: Validate matchId; verify user owns this match; rate limited to 5/hr
router.post('/:matchId/export',
  authMiddleware,
  pdfLimiter,
  validateObjectId('matchId'),
  requireMatchOwnership(MatchResult),
  async (req, res) => {
    try {
      const match = req.match; // attached by requireMatchOwnership
      const job = await pdfQueue.add({ matchId: match._id.toString() });
      audit.pdfExported(req, match._id);
      res.json({ message: 'PDF generation started', jobId: job.id });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── GET /api/matches/:matchId/pdf ───────────────────────────────────────────
// SECURITY FIX: Path traversal protection via safeFilePath(); IDOR check
router.get('/:matchId/pdf',
  authMiddleware,
  validateObjectId('matchId'),
  requireMatchOwnership(MatchResult),
  async (req, res) => {
    try {
      const matchId = req.params.matchId;
      const pdfDir = path.resolve(__dirname, '../../data/pdfs');

      // safeFilePath validates matchId format AND ensures resolved path stays inside pdfDir
      const { safe, filePath, reason } = safeFilePath(pdfDir, matchId);
      if (!safe) {
        audit.pathTraversalAttempt(req, matchId);
        return res.status(400).json({ error: 'Invalid request' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF not yet generated. Please trigger export first.' });
      }

      // Serve with explicit Content-Type and no-inline to prevent XSS via PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${matchId}.pdf"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.download(filePath);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ─── POST /api/matches/:matchId/outcome ──────────────────────────────────────
// SECURITY FIX: Validate matchId; verify user owns this match
router.post('/:matchId/outcome',
  authMiddleware,
  validateObjectId('matchId'),
  requireMatchOwnership(MatchResult),
  async (req, res) => {
    try {
      const VALID_OUTCOMES = ['married', 'rejected_family', 'rejected_astrologer', 'pending', 'unknown'];
      const { outcome } = req.body;

      if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
        return res.status(400).json({ error: 'Invalid outcome value', valid: VALID_OUTCOMES });
      }

      const match = req.match;
      match.outcome = outcome;
      match.outcomeLogged = true;
      await match.save();

      audit.outcomeLogged(req, match._id, outcome);
      res.json({ message: 'Outcome logged successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
