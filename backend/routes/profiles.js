/**
 * profiles.js — Profile routes
 * 
 * Security hardening:
 * - PUT /me: Zod validates ALL fields (previously unvalidated)
 * - POST /me/photo: file size limit + MIME magic byte verification
 * - POST /me/astro: calculationMethod whitelisted
 * - SSRF guard on geocoder: timeout + validate response origin
 * - Audit logging for create/update/photo
 */
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { audit } = require('../middleware/auditLogger');
const { calculateBirthChart } = require('../engine/ephemeris');
const { geocode } = require('../utils/geocoder');
const { upload } = require('../utils/cloudinary');

// ─── Schemas ──────────────────────────────────────────────────────────────────
const createProfileSchema = z.object({
  candidateName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[\p{L}\s'.,-]+$/u, 'Name contains invalid characters'), // Allow Unicode letters (Indian names)
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine(v => {
      const d = new Date(v);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      return d <= minAge && d >= maxAge;
    }, 'Age must be between 18 and 120 years'),
  timeOfBirth: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  placeOfBirth: z.string()
    .min(2)
    .max(150)
    .regex(/^[\p{L}\s,.\-']+$/u, 'Invalid place name'), // no special chars that could inject
  motherTongue: z.enum(['tamil', 'telugu', 'kannada', 'malayalam']),
  calculationMethod: z.enum(['thirukkanitha', 'vakyam']).default('thirukkanitha'),
  education: z.string().max(200).optional(),
  profession: z.string().max(200).optional()
});

const updateProfileSchema = z.object({
  education: z.string().max(200).optional(),
  profession: z.string().max(200).optional(),
  annualIncome: z.string().max(50).optional(),
  religion: z.string().max(50).optional(),
  caste: z.string().max(100).optional(),
  subCaste: z.string().max(100).optional(),
  gothram: z.string().max(100).optional(),
  height: z.number().min(100).max(250).optional(), // cm — validate range
  preferredAgeMin: z.number().int().min(18).max(80).optional(),
  preferredAgeMax: z.number().int().min(18).max(80).optional(),
}).refine(data => {
  if (data.preferredAgeMin !== undefined && data.preferredAgeMax !== undefined) {
    return data.preferredAgeMax >= data.preferredAgeMin;
  }
  return true;
}, { message: 'Preferred max age must be >= min age' });

// ─── POST /api/profiles ───────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = createProfileSchema.parse(req.body);

    if (req.user.profileId) {
      return res.status(400).json({ error: 'Profile already exists. Use PUT /api/profiles/me to update.' });
    }

    // Geocode with timeout (SSRF guard: timeout prevents slow-loris via placeOfBirth)
    const { latitude, longitude } = await geocode(data.placeOfBirth);

    // Validate coordinates are within expected range (basic SSRF/garbage check)
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid birth location coordinates' });
    }

    const astroData = await calculateBirthChart(
      data.dateOfBirth,
      data.timeOfBirth,
      latitude,
      longitude,
      data.calculationMethod
    );

    const profile = new Profile({
      userId: req.user._id,
      candidateName: data.candidateName,
      gender: data.gender,
      dateOfBirth: new Date(data.dateOfBirth),
      timeOfBirth: data.timeOfBirth,
      placeOfBirth: data.placeOfBirth,
      latitude,
      longitude,
      motherTongue: data.motherTongue,
      education: data.education,
      profession: data.profession,
      astroData
    });

    await profile.save();
    await User.findByIdAndUpdate(req.user._id, { profileId: profile._id });

    audit.profileCreated(req, profile._id);

    // Never return sensitive astroData fields in the direct response
    res.status(201).json({
      _id: profile._id,
      candidateName: profile.candidateName,
      gender: profile.gender,
      astroData: {
        nakshatraName: profile.astroData?.nakshatraName,
        rasiName: profile.astroData?.rasiName,
        lagnaName: profile.astroData?.lagnaName,
        gana: profile.astroData?.gana,
        nadiType: profile.astroData?.nadiType,
        calculationMethod: profile.astroData?.calculationMethod
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/profiles/me ─────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user.profileId) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const profile = await Profile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/profiles/me ─────────────────────────────────────────────────────
// SECURITY FIX: All fields now validated via Zod (previously raw req.body)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user.profileId) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Parse and validate — only whitelisted fields pass through
    const updateData = updateProfileSchema.parse(req.body);
    updateData.updatedAt = new Date();

    const profile = await Profile.findByIdAndUpdate(
      req.user.profileId,
      updateData,
      { new: true, runValidators: true }
    );

    audit.profileUpdated(req);
    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/profiles/me/astro ─────────────────────────────────────────────
router.post('/me/astro', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Whitelist calculationMethod explicitly — don't pass any other user input to engine
    const ALLOWED_METHODS = ['thirukkanitha', 'vakyam'];
    const calcMethod = req.body?.calculationMethod;
    const method = ALLOWED_METHODS.includes(calcMethod)
      ? calcMethod
      : profile.astroData?.calculationMethod || 'thirukkanitha';

    const astroData = await calculateBirthChart(
      profile.dateOfBirth,
      profile.timeOfBirth,
      profile.latitude,
      profile.longitude,
      method
    );

    profile.astroData = astroData;
    profile.updatedAt = new Date();
    await profile.save();

    res.json({ message: 'Astro data recalculated', nakshatraName: astroData.nakshatraName });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/profiles/me/behavioral ────────────────────────────────────────
router.post('/me/behavioral', authMiddleware, async (req, res) => {
  try {
    const scoresSchema = z.object({
      openness: z.number().min(0).max(100),
      conscientiousness: z.number().min(0).max(100),
      extraversion: z.number().min(0).max(100),
      agreeableness: z.number().min(0).max(100),
      neuroticism: z.number().min(0).max(100)
    });

    const scores = scoresSchema.parse(req.body);
    const profile = await Profile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.bigFiveScores = scores;
    profile.bigFiveCompleted = true;
    await profile.save();

    res.json({ message: 'Personality assessment saved', bigFiveCompleted: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/profiles/me/photo ─────────────────────────────────────────────
// SECURITY FIX: File size limited to 5MB, MIME type validated at middleware level
router.post('/me/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profile = await Profile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.photoUrl = req.file.path;
    profile.photoPublicId = req.file.filename;
    await profile.save();

    audit.profilePhotoUploaded(req);

    // Return minimal info only
    res.json({ photoUrl: profile.photoUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DELETE /api/profiles/me ─────────────────────────────────────────────────
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    profile.isActive = false;
    await profile.save();
    res.json({ message: 'Profile deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
