

# JATHAGAM PORUTHAM — MASTER PROJECT DOCUMENT
## Version 1.0 | South Indian Vedic Matchmaking Platform
### For AI-Assisted Development (Claude / Codex / Any Agent)

---

## 0. AGENT INSTRUCTIONS (READ FIRST)

This document is self-contained. Every decision is made. Do not ask for clarification on architectural choices — implement exactly as specified. Where you see `[IMPLEMENT]` tags, write the code. Where you see `[VERIFY]` tags, run a test before proceeding. Build in the exact order specified in Section 12. Do not skip sections. Do not substitute libraries unless the specified library fails to install.

---

## 1. PROJECT IDENTITY

**Product Name:** Thirumana Porutham AI  
**Tagline:** Decision Intelligence for South Indian Marriage Compatibility  
**Type:** Progressive Web App (PWA) + Android App (via Capacitor)  
**Target User:** Tamil-speaking South Indian families (Tamil Nadu primary, Kerala/Karnataka secondary)  
**Language Support:** English UI with Tamil labels for astrological terms  
**What it is:** A rule-based Porutham matching engine with LLM-generated explainability reports, wrapped in a matrimonial-style matchmaking database  
**What it is NOT:** A predictive ML system. Not a "magic AI". Not a replacement for a human astrologer.  
**Legal Position:** Decision Support Tool. Every output carries probabilistic language. No guarantees.

---

## 2. CORE PHILOSOPHY (NON-NEGOTIABLE)

These are the constraints that override all other decisions:

1. The Porutham engine is deterministic and rule-based — not ML.
2. ML / AI is used only to generate human-readable explanations of the rule engine's output.
3. No output ever uses the words "Perfect Match", "Guaranteed", or "Safe".
4. Every output uses: "High Alignment", "Detected Risk Zone", "Advisory".
5. Users must click an acknowledgment checkbox before viewing any compatibility result.
6. Birth time, birth location, and behavioral data are encrypted at rest at field level.
7. The app never auto-decides — it always presents options, never a single answer.
8. Astrologers are allies, not competitors. Every result exports a clean PDF for an astrologer to review.

---

## 3. TECH STACK (EXACT, NO SUBSTITUTIONS)

### 3.1 Frontend
- Framework: React 18 with Vite
- Styling: Tailwind CSS 3
- State Management: Zustand
- Forms: React Hook Form + Zod validation
- Routing: React Router v6
- Charts / Visualization: Recharts
- PDF Export: jsPDF + html2canvas
- Internationalization: i18next (English + Tamil)
- PWA: Vite PWA plugin (Workbox)
- Mobile (Android): Capacitor 5

### 3.2 Backend
- Runtime: Node.js 20 LTS
- Framework: Express.js 4
- Authentication: JWT (access token 15min) + Refresh token (7 days, httpOnly cookie)
- OTP: Twilio SMS or MSG91 (India-first)
- Database: MongoDB 7 via Mongoose
- Field-Level Encryption: MongoDB Client-Side Field Level Encryption (CSFLE)
- Caching: Redis 7 (match results, ephemeris cache)
- File Storage: Cloudinary (profile photos only — no horoscope images stored)
- Email: Nodemailer + SMTP (SendGrid free tier)
- Job Queue: Bull (Redis-backed) for async PDF generation and match recalculation

### 3.3 Astrology Engine
- Ephemeris: Swiss Ephemeris via `swisseph` npm package
- Calculation Mode: Sidereal (Lahiri ayanamsa — standard for South India)
- Dual Mode: Thirukkanitha (default) and Vakyam (toggle, applies offset)
- Geocoding: OpenCage Geocoding API (free tier: 2500 req/day)

### 3.4 AI Layer
- Provider: Anthropic Claude API (claude-sonnet-4-20250514)
- Purpose: Convert rule engine JSON output → Tamil/English risk report
- Max tokens: 1000 per report
- Prompt: Fully specified in Section 9

### 3.5 Infrastructure
- Hosting: Railway.app (backend) + Vercel (frontend) — both have free tiers
- CDN: Cloudflare free tier
- CI/CD: GitHub Actions
- Environment: dotenv for local, Railway/Vercel env vars for production
- Android Build: Capacitor + Android Studio / EAS Build (Expo)

### 3.6 Dev Tools
- Package Manager: npm
- Linter: ESLint + Prettier
- Testing: Vitest (unit) + Supertest (API)
- API Docs: Swagger/OpenAPI auto-generated via swagger-jsdoc

---

## 4. DATABASE SCHEMA (COMPLETE)

All schemas use Mongoose. All sensitive fields marked `[ENCRYPTED]` use MongoDB CSFLE.

### 4.1 User Schema

```javascript
const UserSchema = new mongoose.Schema({
  // Identity
  phone: { type: String, required: true, unique: true }, // [ENCRYPTED]
  email: { type: String, sparse: true },
  role: { type: String, enum: ['parent', 'candidate', 'admin'], default: 'parent' },
  
  // Auth
  refreshTokenHash: String,
  otpHash: String,
  otpExpiry: Date,
  isVerified: { type: Boolean, default: false },
  
  // Linked profile
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  
  // Meta
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' }
});
```

### 4.2 Profile Schema (Core entity)

```javascript
const ProfileSchema = new mongoose.Schema({
  // Ownership
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Candidate details
  candidateName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  dateOfBirth: { type: Date, required: true }, // [ENCRYPTED]
  timeOfBirth: { type: String, required: true }, // HH:MM format, [ENCRYPTED]
  placeOfBirth: { type: String, required: true },
  latitude: { type: Number, required: true }, // [ENCRYPTED]
  longitude: { type: Number, required: true }, // [ENCRYPTED]
  
  // Calculated astro data (derived at profile creation, cached)
  astroData: {
    nakshatra: { type: Number, min: 1, max: 27 }, // 1-indexed
    nakshatraName: String,
    pada: { type: Number, min: 1, max: 4 },
    rasi: { type: Number, min: 1, max: 12 },
    rasiName: String,
    lagna: { type: Number, min: 1, max: 12 },
    lagnaName: String,
    moonDegree: Number,
    calculationMethod: { type: String, enum: ['thirukkanitha', 'vakyam'], default: 'thirukkanitha' },
    
    // All 10 Porutham attributes (pre-computed at profile save)
    gana: { type: String, enum: ['deva', 'manushya', 'rakshasa'] },
    yoniAnimal: String,
    yoniGender: { type: String, enum: ['male', 'female'] },
    rajjuGroup: { type: String, enum: ['siro', 'kanta', 'nabhi', 'kati', 'pada'] },
    rajjuDirection: { type: String, enum: ['ascending', 'descending', 'stationary'] },
    vedhaPartner: Number, // nakshatra number that causes vedha
    vasya: String,
    planetLord: String,
    rasiLord: String,
    
    // Dosha flags
    chevvaiDosham: { type: Boolean, default: false },
    chevvaiDoshamType: { type: String, enum: ['none', 'mild', 'severe'] },
    nadiType: { type: String, enum: ['aadi', 'madhya', 'antya'] },
    ganamType: { type: String, enum: ['deva', 'manushya', 'rakshasa'] }
  },
  
  // Basic profile (non-sensitive, used for filtering)
  education: String,
  profession: String,
  annualIncome: { type: String, enum: ['below-3L', '3-6L', '6-12L', '12-25L', 'above-25L'] },
  motherTongue: { type: String, enum: ['tamil', 'telugu', 'kannada', 'malayalam'] },
  religion: { type: String, default: 'hindu' },
  caste: String,
  subCaste: String,
  gothram: String,
  height: Number, // in cm
  
  // Age range preference for match
  preferredAgeMin: Number,
  preferredAgeMax: Number,
  
  // Behavioral (filled by candidate in Candidate Portal)
  bigFiveCompleted: { type: Boolean, default: false },
  bigFiveScores: {
    openness: { type: Number, min: 0, max: 100 },
    conscientiousness: { type: Number, min: 0, max: 100 },
    extraversion: { type: Number, min: 0, max: 100 },
    agreeableness: { type: Number, min: 0, max: 100 },
    neuroticism: { type: Number, min: 0, max: 100 }
  },
  
  // Photo
  photoUrl: String, // Cloudinary URL
  photoPublicId: String,
  
  // Visibility
  isActive: { type: Boolean, default: true },
  isProfileComplete: { type: Boolean, default: false },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

// Index for fast matching queries
ProfileSchema.index({ gender: 1, isActive: 1, 'astroData.nakshatra': 1 });
ProfileSchema.index({ gender: 1, isActive: 1, 'astroData.rasi': 1 });
ProfileSchema.index({ communityId: 1, gender: 1, isActive: 1 });
```

### 4.3 MatchResult Schema

```javascript
const MatchResultSchema = new mongoose.Schema({
  profileA: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  profileB: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  
  // Porutham scores (each: 'pass' | 'conditional' | 'fail')
  poruthams: {
    dina:         { result: String, detail: String },
    gana:         { result: String, detail: String },
    yoni:         { result: String, detail: String },
    rasi:         { result: String, detail: String },
    rasiAthipathi:{ result: String, detail: String },
    rajju:        { result: String, detail: String, isCritical: Boolean },
    vedha:        { result: String, detail: String },
    vasya:        { result: String, detail: String },
    mahendra:     { result: String, detail: String },
    streeDeergha: { result: String, detail: String }
  },
  
  // Dosha analysis
  doshaAnalysis: {
    chevvaiSamyam: Boolean, // mutual cancellation
    nadiDosham: Boolean,
    nadiSamyam: Boolean
  },
  
  // Aggregate
  passCount: Number, // out of 10
  conditionalCount: Number,
  failCount: Number,
  hasHardReject: Boolean, // true if Rajju or Vedha failed with no samyam
  overallScore: Number, // 0-100 normalized
  
  // AI-generated report (generated async)
  aiReport: {
    generated: { type: Boolean, default: false },
    reportText: String,
    riskZones: [String],
    recommendations: [String],
    generatedAt: Date
  },
  
  // User actions
  savedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  exportedAt: [Date],
  
  // Dataset logging (for future ML — do not skip this)
  outcomeLogged: { type: Boolean, default: false },
  outcome: { type: String, enum: ['married', 'rejected_family', 'rejected_astrologer', 'pending', 'unknown'] },
  
  calculatedAt: { type: Date, default: Date.now },
  calculationMethod: { type: String, enum: ['thirukkanitha', 'vakyam'] }
});

MatchResultSchema.index({ profileA: 1, profileB: 1 }, { unique: true });
```

### 4.4 DoshaRule Schema (Dynamic rules, not hardcoded)

```javascript
const DoshaRuleSchema = new mongoose.Schema({
  doshaName: { type: String, required: true }, // e.g. 'chevvai', 'rajju', 'nadi'
  triggerCondition: Object, // JSON describing trigger (e.g. { marsHouse: [1,2,4,7,8,12] })
  severity: { type: String, enum: ['mild', 'severe'] },
  cancellationRules: [{
    condition: String, // human-readable description
    cancellationLogic: Object // JSON describing what cancels this dosha
  }],
  isActive: { type: Boolean, default: true },
  source: String // e.g. "Brihat Parashara Hora Shastra, Ch. 18"
});
```

### 4.5 Community Schema (for invite-only launch)

```javascript
const CommunitySchema = new mongoose.Schema({
  name: String,
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inviteCode: { type: String, unique: true },
  memberCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  city: String,
  state: String
});
```

---

## 5. PORUTHAM ENGINE (COMPLETE ALGORITHM)

This is the core of the entire project. Implement this exactly.

### 5.1 Nakshatra Reference Table (Complete — 27 stars)

```javascript
const NAKSHATRAS = [
  // index 1-27, name, gana, yoniAnimal, yoniGender, rajjuGroup, rajjuDirection, planetLord, nadiType
  { id: 1,  name: 'Ashwini',     gana: 'deva',     yoni: 'horse',    yoniGender: 'male',   rajju: 'pada',  rajjuDir: 'ascending',  lord: 'ketu',    nadi: 'aadi' },
  { id: 2,  name: 'Bharani',     gana: 'manushya', yoni: 'elephant', yoniGender: 'male',   rajju: 'pada',  rajjuDir: 'descending', lord: 'venus',   nadi: 'madhya' },
  { id: 3,  name: 'Krittika',    gana: 'rakshasa', yoni: 'goat',     yoniGender: 'female', rajju: 'pada',  rajjuDir: 'ascending',  lord: 'sun',     nadi: 'antya' },
  { id: 4,  name: 'Rohini',      gana: 'manushya', yoni: 'serpent',  yoniGender: 'male',   rajju: 'kati',  rajjuDir: 'ascending',  lord: 'moon',    nadi: 'aadi' },
  { id: 5,  name: 'Mrigashira',  gana: 'deva',     yoni: 'serpent',  yoniGender: 'female', rajju: 'kati',  rajjuDir: 'descending', lord: 'mars',    nadi: 'madhya' },
  { id: 6,  name: 'Ardra',       gana: 'manushya', yoni: 'dog',      yoniGender: 'female', rajju: 'kati',  rajjuDir: 'ascending',  lord: 'rahu',    nadi: 'antya' },
  { id: 7,  name: 'Punarvasu',   gana: 'deva',     yoni: 'cat',      yoniGender: 'male',   rajju: 'nabhi', rajjuDir: 'ascending',  lord: 'jupiter', nadi: 'aadi' },
  { id: 8,  name: 'Pushya',      gana: 'deva',     yoni: 'goat',     yoniGender: 'male',   rajju: 'nabhi', rajjuDir: 'descending', lord: 'saturn',  nadi: 'madhya' },
  { id: 9,  name: 'Ashlesha',    gana: 'rakshasa', yoni: 'cat',      yoniGender: 'female', rajju: 'nabhi', rajjuDir: 'ascending',  lord: 'mercury', nadi: 'antya' },
  { id: 10, name: 'Magha',       gana: 'rakshasa', yoni: 'rat',      yoniGender: 'male',   rajju: 'kanta', rajjuDir: 'ascending',  lord: 'ketu',    nadi: 'aadi' },
  { id: 11, name: 'PurvaPhalguni',gana:'manushya', yoni: 'rat',      yoniGender: 'female', rajju: 'kanta', rajjuDir: 'descending', lord: 'venus',   nadi: 'madhya' },
  { id: 12, name: 'UttaraPhalguni',gana:'manushya',yoni: 'cow',      yoniGender: 'male',   rajju: 'kanta', rajjuDir: 'ascending',  lord: 'sun',     nadi: 'antya' },
  { id: 13, name: 'Hasta',       gana: 'deva',     yoni: 'buffalo',  yoniGender: 'male',   rajju: 'siro',  rajjuDir: 'ascending',  lord: 'moon',    nadi: 'aadi' },
  { id: 14, name: 'Chitra',      gana: 'rakshasa', yoni: 'tiger',    yoniGender: 'female', rajju: 'siro',  rajjuDir: 'descending', lord: 'mars',    nadi: 'madhya' },
  { id: 15, name: 'Swati',       gana: 'deva',     yoni: 'buffalo',  yoniGender: 'female', rajju: 'siro',  rajjuDir: 'ascending',  lord: 'rahu',    nadi: 'antya' },
  { id: 16, name: 'Vishakha',    gana: 'rakshasa', yoni: 'tiger',    yoniGender: 'male',   rajju: 'nabhi', rajjuDir: 'descending', lord: 'jupiter', nadi: 'aadi' },
  { id: 17, name: 'Anuradha',    gana: 'deva',     yoni: 'hare',     yoniGender: 'male',   rajju: 'nabhi', rajjuDir: 'ascending',  lord: 'saturn',  nadi: 'madhya' },
  { id: 18, name: 'Jyeshtha',    gana: 'rakshasa', yoni: 'hare',     yoniGender: 'female', rajju: 'nabhi', rajjuDir: 'descending', lord: 'mercury', nadi: 'antya' },
  { id: 19, name: 'Moola',       gana: 'rakshasa', yoni: 'dog',      yoniGender: 'male',   rajju: 'kati',  rajjuDir: 'descending', lord: 'ketu',    nadi: 'aadi' },
  { id: 20, name: 'PurvaAshadha',gana: 'manushya', yoni: 'monkey',   yoniGender: 'male',   rajju: 'kati',  rajjuDir: 'ascending',  lord: 'venus',   nadi: 'madhya' },
  { id: 21, name: 'UttaraAshadha',gana:'manushya', yoni: 'mongoose', yoniGender: 'male',   rajju: 'kati',  rajjuDir: 'descending', lord: 'sun',     nadi: 'antya' },
  { id: 22, name: 'Shravana',    gana: 'deva',     yoni: 'monkey',   yoniGender: 'female', rajju: 'pada',  rajjuDir: 'ascending',  lord: 'moon',    nadi: 'aadi' },
  { id: 23, name: 'Dhanishtha',  gana: 'rakshasa', yoni: 'lion',     yoniGender: 'female', rajju: 'pada',  rajjuDir: 'descending', lord: 'mars',    nadi: 'madhya' },
  { id: 24, name: 'Shatabhisha', gana: 'rakshasa', yoni: 'horse',    yoniGender: 'female', rajju: 'pada',  rajjuDir: 'ascending',  lord: 'rahu',    nadi: 'antya' },
  { id: 25, name: 'PurvaBhadra', gana: 'manushya', yoni: 'lion',     yoniGender: 'male',   rajju: 'kanta', rajjuDir: 'descending', lord: 'jupiter', nadi: 'aadi' },
  { id: 26, name: 'UttaraBhadra',gana: 'manushya', yoni: 'cow',      yoniGender: 'female', rajju: 'kanta', rajjuDir: 'ascending',  lord: 'saturn',  nadi: 'madhya' },
  { id: 27, name: 'Revati',      gana: 'deva',     yoni: 'elephant', yoniGender: 'female', rajju: 'kanta', rajjuDir: 'descending', lord: 'mercury', nadi: 'antya' }
];
```

### 5.2 Vedha Pairs (Stars that block each other — hard reject if unresolved)

```javascript
const VEDHA_PAIRS = [
  [1, 18],  // Ashwini — Jyeshtha
  [2, 17],  // Bharani — Anuradha
  [3, 16],  // Krittika — Vishakha
  [4, 15],  // Rohini — Swati
  [5, 14],  // Mrigashira — Chitra (partial)
  [6, 13],  // Ardra — Hasta
  [7, 12],  // Punarvasu — UttaraPhalguni
  [8, 11],  // Pushya — PurvaPhalguni
  [9, 10],  // Ashlesha — Magha
  [19, 27], // Moola — Revati
  [20, 26], // PurvaAshadha — UttaraBhadra
  [21, 25], // UttaraAshadha — PurvaBhadra
  [22, 24], // Shravana — Shatabhisha
  [23, 23]  // Dhanishtha with itself (special case — not a vedha, ignore)
];
```

### 5.3 Yoni Compatibility Matrix

```javascript
// Score: 4=excellent, 3=good, 2=neutral, 1=poor, 0=conflict
const YONI_COMPATIBILITY = {
  horse:    { horse: 4, elephant: 2, goat: 3, serpent: 2, dog: 1, cat: 2, rat: 2, cow: 3, buffalo: 2, tiger: 1, hare: 3, monkey: 2, mongoose: 2, lion: 1 },
  elephant: { horse: 2, elephant: 4, goat: 2, serpent: 2, dog: 2, cat: 1, rat: 3, cow: 3, buffalo: 3, tiger: 1, hare: 2, monkey: 3, mongoose: 1, lion: 2 },
  goat:     { horse: 3, elephant: 2, goat: 4, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 3, buffalo: 2, tiger: 2, hare: 3, monkey: 2, mongoose: 2, lion: 1 },
  serpent:  { horse: 2, elephant: 2, goat: 2, serpent: 4, dog: 1, cat: 2, rat: 2, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 2, mongoose: 0, lion: 2 },
  dog:      { horse: 1, elephant: 2, goat: 2, serpent: 1, dog: 4, cat: 0, rat: 2, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 2, mongoose: 2, lion: 2 },
  cat:      { horse: 2, elephant: 1, goat: 2, serpent: 2, dog: 0, cat: 4, rat: 0, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 2, mongoose: 2, lion: 2 },
  rat:      { horse: 2, elephant: 3, goat: 2, serpent: 2, dog: 2, cat: 0, rat: 4, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 2, mongoose: 2, lion: 2 },
  cow:      { horse: 3, elephant: 3, goat: 3, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 4, buffalo: 3, tiger: 2, hare: 3, monkey: 2, mongoose: 2, lion: 1 },
  buffalo:  { horse: 2, elephant: 3, goat: 2, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 3, buffalo: 4, tiger: 2, hare: 2, monkey: 2, mongoose: 2, lion: 2 },
  tiger:    { horse: 1, elephant: 1, goat: 2, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 2, buffalo: 2, tiger: 4, hare: 1, monkey: 2, mongoose: 2, lion: 3 },
  hare:     { horse: 3, elephant: 2, goat: 3, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 3, buffalo: 2, tiger: 1, hare: 4, monkey: 2, mongoose: 2, lion: 2 },
  monkey:   { horse: 2, elephant: 3, goat: 2, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 4, mongoose: 2, lion: 2 },
  mongoose: { horse: 2, elephant: 1, goat: 2, serpent: 0, dog: 2, cat: 2, rat: 2, cow: 2, buffalo: 2, tiger: 2, hare: 2, monkey: 2, mongoose: 4, lion: 2 },
  lion:     { horse: 1, elephant: 2, goat: 1, serpent: 2, dog: 2, cat: 2, rat: 2, cow: 1, buffalo: 2, tiger: 3, hare: 2, monkey: 2, mongoose: 2, lion: 4 }
};
```

### 5.4 Gana Compatibility Table

```javascript
// boy_gana → girl_gana → result
const GANA_COMPATIBILITY = {
  deva:     { deva: 'pass',        manushya: 'pass',        rakshasa: 'fail' },
  manushya: { deva: 'conditional', manushya: 'pass',        rakshasa: 'conditional' },
  rakshasa: { deva: 'fail',        manushya: 'conditional', rakshasa: 'pass' }
};
```

### 5.5 Rasi Compatibility Table

```javascript
// 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, 5=Leo, 6=Virgo,
// 7=Libra, 8=Scorpio, 9=Sagittarius, 10=Capricorn, 11=Aquarius, 12=Pisces
const RASI_COMPATIBILITY = {
  1:  [1,5,9],      // Aries compatible with Aries, Leo, Sagittarius
  2:  [2,6,10],
  3:  [3,7,11],
  4:  [4,8,12],
  5:  [1,5,9],
  6:  [2,6,10],
  7:  [3,7,11],
  8:  [4,8,12],
  9:  [1,5,9],
  10: [2,6,10],
  11: [3,7,11],
  12: [4,8,12]
};
```

### 5.6 Planet Friendship Table (for Rasi Athipathi)

```javascript
const PLANET_RELATIONSHIPS = {
  sun:     { friend: ['moon','mars','jupiter'],      neutral: ['mercury'],           enemy: ['venus','saturn','rahu','ketu'] },
  moon:    { friend: ['sun','mercury'],              neutral: ['mars','jupiter','venus','saturn'], enemy: ['rahu','ketu'] },
  mars:    { friend: ['sun','moon','jupiter'],       neutral: ['venus','saturn'],    enemy: ['mercury','rahu','ketu'] },
  mercury: { friend: ['sun','venus'],                neutral: ['mars','jupiter','saturn'], enemy: ['moon','rahu','ketu'] },
  jupiter: { friend: ['sun','moon','mars'],          neutral: ['saturn'],            enemy: ['mercury','venus','rahu','ketu'] },
  venus:   { friend: ['mercury','saturn'],           neutral: ['mars','jupiter'],    enemy: ['sun','moon','rahu','ketu'] },
  saturn:  { friend: ['mercury','venus'],            neutral: ['jupiter'],           enemy: ['sun','moon','mars','rahu','ketu'] },
  rahu:    { friend: ['venus','saturn'],             neutral: ['mercury','jupiter'], enemy: ['sun','moon','mars','ketu'] },
  ketu:    { friend: ['venus','saturn'],             neutral: ['mercury','jupiter'], enemy: ['sun','moon','mars','rahu'] }
};
```

### 5.7 The Porutham Engine Function (Main)

```javascript
// engine/poruthams.js
function computePorutham(profileA, profileB) {
  // profileA = groom, profileB = bride (convention)
  const nakA = profileA.astroData.nakshatra;
  const nakB = profileB.astroData.nakshatra;
  const rasiA = profileA.astroData.rasi;
  const rasiB = profileB.astroData.rasi;
  const starA = NAKSHATRAS[nakA - 1];
  const starB = NAKSHATRAS[nakB - 1];

  const results = {};

  // 1. DINA PORUTHAM
  // Count from bride's star to groom's star
  let dinaCount = ((nakA - nakB + 27) % 27) + 1;
  let dinaResult;
  if ([3, 5, 7, 10, 12, 14, 16, 19, 21, 23, 25].includes(dinaCount)) {
    dinaResult = 'fail';
  } else if (dinaCount % 3 === 0) {
    dinaResult = 'conditional';
  } else {
    dinaResult = 'pass';
  }
  results.dina = { result: dinaResult, detail: `Star distance: ${dinaCount}` };

  // 2. GANA PORUTHAM
  const ganaResult = GANA_COMPATIBILITY[starA.gana][starB.gana];
  results.gana = {
    result: ganaResult,
    detail: `Groom: ${starA.gana}, Bride: ${starB.gana}`
  };

  // 3. YONI PORUTHAM
  const yoniScore = YONI_COMPATIBILITY[starA.yoni][starB.yoni];
  let yoniResult = yoniScore >= 3 ? 'pass' : yoniScore >= 2 ? 'conditional' : 'fail';
  // Same yoni, opposite gender = excellent
  if (starA.yoni === starB.yoni && starA.yoniGender !== starB.yoniGender) yoniResult = 'pass';
  // Same yoni, same gender = neutral
  if (starA.yoni === starB.yoni && starA.yoniGender === starB.yoniGender) yoniResult = 'conditional';
  results.yoni = { result: yoniResult, detail: `Groom: ${starA.yoni}, Bride: ${starB.yoni}, score: ${yoniScore}` };

  // 4. RASI PORUTHAM
  let rasiResult;
  const rasiDistance = ((rasiA - rasiB + 12) % 12) + 1;
  if ([1, 3, 5, 7].includes(rasiDistance)) rasiResult = 'pass';
  else if ([4, 6, 8, 10].includes(rasiDistance)) rasiResult = 'conditional';
  else rasiResult = 'fail';
  results.rasi = { result: rasiResult, detail: `Rasi distance: ${rasiDistance}` };

  // 5. RASI ATHIPATHI (Ruling planet relationship)
  const lordA = starA.lord;
  const lordB = starB.lord;
  let rasiAthipathiResult;
  if (lordA === lordB) {
    rasiAthipathiResult = 'pass';
  } else if (PLANET_RELATIONSHIPS[lordA]?.friend?.includes(lordB)) {
    rasiAthipathiResult = 'pass';
  } else if (PLANET_RELATIONSHIPS[lordA]?.neutral?.includes(lordB)) {
    rasiAthipathiResult = 'conditional';
  } else {
    rasiAthipathiResult = 'fail';
  }
  results.rasiAthipathi = { result: rasiAthipathiResult, detail: `${lordA} vs ${lordB}` };

  // 6. RAJJU PORUTHAM (CRITICAL — hard reject if both same group and same direction)
  let rajjuResult;
  let isCritical = false;
  if (starA.rajju !== starB.rajju) {
    rajjuResult = 'pass';
  } else {
    // Same group — check direction
    if (starA.rajjuDir === starB.rajjuDir) {
      // HARD REJECT — check for samyam
      const samyam = checkRajjuSamyam(profileA, profileB);
      if (samyam) {
        rajjuResult = 'conditional';
      } else {
        rajjuResult = 'fail';
        isCritical = true;
      }
    } else {
      rajjuResult = 'conditional'; // same group, different direction = acceptable
    }
  }
  results.rajju = { result: rajjuResult, detail: `Group: ${starA.rajju}, Dir: ${starA.rajjuDir} vs ${starB.rajjuDir}`, isCritical };

  // 7. VEDHA PORUTHAM
  let vedhaResult = 'pass';
  for (const pair of VEDHA_PAIRS) {
    if ((pair[0] === nakA && pair[1] === nakB) || (pair[0] === nakB && pair[1] === nakA)) {
      vedhaResult = 'fail';
      break;
    }
  }
  results.vedha = { result: vedhaResult, detail: vedhaResult === 'fail' ? `Nakshatra ${nakA} and ${nakB} are Vedha pairs` : 'No Vedha conflict' };

  // 8. VASYA PORUTHAM
  const vasyaResult = computeVasya(rasiA, rasiB);
  results.vasya = vasyaResult;

  // 9. MAHENDRA PORUTHAM
  // Count from bride's star to groom's star, check if distance is 4, 7, 10, 13, 16, 19, 22, 25
  const mahendraCount = ((nakA - nakB + 27) % 27) + 1;
  const mahendraPass = [4, 7, 10, 13, 16, 19, 22, 25].includes(mahendraCount);
  results.mahendra = { result: mahendraPass ? 'pass' : 'fail', detail: `Distance: ${mahendraCount}` };

  // 10. STREE DEERGHA PORUTHAM
  // Groom's star should be more than 9 stars from bride's star
  const streeDistance = ((nakA - nakB + 27) % 27) + 1;
  let streeResult;
  if (streeDistance > 13) streeResult = 'pass';
  else if (streeDistance > 9) streeResult = 'conditional';
  else streeResult = 'fail';
  results.streeDeergha = { result: streeResult, detail: `Distance: ${streeDistance} stars` };

  // DOSHA ANALYSIS
  const doshaAnalysis = computeDoshaAnalysis(profileA, profileB);

  // AGGREGATE
  const values = Object.values(results);
  const passCount = values.filter(v => v.result === 'pass').length;
  const conditionalCount = values.filter(v => v.result === 'conditional').length;
  const failCount = values.filter(v => v.result === 'fail').length;
  const hasHardReject = results.rajju.isCritical || results.vedha.result === 'fail' || doshaAnalysis.nadiDosham;
  const overallScore = Math.round(((passCount * 10) + (conditionalCount * 5)) / 100 * 100);

  return {
    poruthams: results,
    doshaAnalysis,
    passCount,
    conditionalCount,
    failCount,
    hasHardReject,
    overallScore
  };
}
```

### 5.8 Dosha Samyam (Cancellation Logic)

```javascript
function checkRajjuSamyam(profileA, profileB) {
  // Rajju samyam: if both have Chevvai Dosham, it cancels
  if (profileA.astroData.chevvaiDosham && profileB.astroData.chevvaiDosham) return true;
  // If both are in the same Rajju group AND one is parivartana (mutual exchange of lords) — advanced, skip for MVP
  return false;
}

function computeDoshaAnalysis(profileA, profileB) {
  const nadiA = profileA.astroData.nadiType;
  const nadiB = profileB.astroData.nadiType;
  
  // Nadi Dosham: same nadi type = dosham (genetic incompatibility indicator)
  const nadiDosham = nadiA === nadiB;
  
  // Nadi Samyam: if both nakshatras are in same group AND same pada, it may cancel
  const nadiSamyam = nadiDosham && profileA.astroData.nakshatra === profileB.astroData.nakshatra;
  
  // Chevvai (Mangal) Samyam: both have it = it cancels
  const chevvaiSamyam = profileA.astroData.chevvaiDosham && profileB.astroData.chevvaiDosham;
  
  return { nadiDosham: nadiDosham && !nadiSamyam, nadiSamyam, chevvaiSamyam };
}

function computeVasya(rasiA, rasiB) {
  // Vasya groups
  const VASYA = {
    1:  [2, 5],   // Aries controls Taurus, Leo
    2:  [3, 12],
    3:  [4, 6],
    4:  [3, 9],
    5:  [4, 8],
    6:  [5, 12],
    7:  [6, 10],
    8:  [9, 7],
    9:  [10, 11],
    10: [11, 9],
    11: [10, 12],
    12: [1, 6]
  };
  if (VASYA[rasiA]?.includes(rasiB) || VASYA[rasiB]?.includes(rasiA)) {
    return { result: 'pass', detail: 'Mutual or one-way vasya exists' };
  }
  return { result: 'conditional', detail: 'No significant vasya relationship' };
}
```

### 5.9 Chevvai Dosham Detection (Mars Dosha)

```javascript
function detectChevvaiDosham(planetPositions) {
  // Mars in houses 1, 2, 4, 7, 8, 12 from Lagna = Chevvai Dosham
  const CHEVVAI_HOUSES = [1, 2, 4, 7, 8, 12];
  const marsHouse = planetPositions.mars.house; // computed from Swiss Ephemeris
  if (CHEVVAI_HOUSES.includes(marsHouse)) {
    // Check cancellations
    const cancellations = checkChevvaiCancellations(planetPositions);
    return { hasDosha: !cancellations.cancelled, type: cancellations.cancelled ? 'none' : 'severe', reason: cancellations.reason };
  }
  return { hasDosha: false, type: 'none', reason: 'Mars not in Dosha houses' };
}

function checkChevvaiCancellations(planetPositions) {
  // Common cancellation rules (compile from astrologer review):
  // 1. Mars in own sign (Aries/Scorpio) cancels
  if (['aries', 'scorpio'].includes(planetPositions.mars.sign)) {
    return { cancelled: true, reason: 'Mars in own sign — Dosha cancelled' };
  }
  // 2. Mars exalted (Capricorn) cancels
  if (planetPositions.mars.sign === 'capricorn') {
    return { cancelled: true, reason: 'Mars exalted — Dosha cancelled' };
  }
  // 3. Jupiter in Lagna cancels (debatable — mark as conditional)
  // 4. Mars conjoins Jupiter (debatable — mark as conditional)
  return { cancelled: false, reason: 'No standard cancellation found' };
}
```

### 5.10 Vakyam Mode Offset

```javascript
// Vakyam ayanamsa differs from Lahiri by approximately 6-7 arcminutes
// Apply this offset when user selects Vakyam mode
const VAKYAM_OFFSET_DEGREES = 0.12; // approximate — validate with astrologer consultant

function applyVakyamOffset(nakshatraDegree) {
  return (nakshatraDegree - VAKYAM_OFFSET_DEGREES + 360) % 360;
}
```

---

## 6. SWISS EPHEMERIS INTEGRATION

### 6.1 Installation

```bash
npm install swisseph
```

### 6.2 Birth Chart Calculation

```javascript
// engine/ephemeris.js
const swisseph = require('swisseph');

async function calculateBirthChart(dob, timeString, latitude, longitude, mode = 'thirukkanitha') {
  // Parse date and time
  const [hour, minute] = timeString.split(':').map(Number);
  const date = new Date(dob);
  
  // Julian Day Number
  const julday = swisseph.swe_julday(
    date.getFullYear(), date.getMonth() + 1, date.getDate(),
    hour + minute / 60,
    swisseph.SE_GREG_CAL
  );

  // Set sidereal mode (Lahiri ayanamsa — standard for South India)
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

  const flags = swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;

  // Calculate planet positions
  const planets = {};
  const planetList = [
    { id: swisseph.SE_SUN, name: 'sun' },
    { id: swisseph.SE_MOON, name: 'moon' },
    { id: swisseph.SE_MARS, name: 'mars' },
    { id: swisseph.SE_MERCURY, name: 'mercury' },
    { id: swisseph.SE_JUPITER, name: 'jupiter' },
    { id: swisseph.SE_VENUS, name: 'venus' },
    { id: swisseph.SE_SATURN, name: 'saturn' },
    { id: swisseph.SE_TRUE_NODE, name: 'rahu' }
  ];

  for (const planet of planetList) {
    const result = swisseph.swe_calc_ut(julday, planet.id, flags);
    planets[planet.name] = {
      longitude: result.longitude,
      sign: Math.floor(result.longitude / 30) + 1, // 1-12
      degree: result.longitude % 30
    };
  }
  
  // Ketu is always opposite Rahu
  planets.ketu = {
    longitude: (planets.rahu.longitude + 180) % 360,
    sign: ((planets.rahu.sign - 1 + 6) % 12) + 1
  };

  // Apply Vakyam offset if needed
  if (mode === 'vakyam') {
    for (const p of Object.keys(planets)) {
      planets[p].longitude = applyVakyamOffset(planets[p].longitude);
      planets[p].sign = Math.floor(planets[p].longitude / 30) + 1;
    }
  }

  // Moon Nakshatra (each nakshatra = 13°20' = 13.333...)
  const moonLong = planets.moon.longitude;
  const nakshatraIndex = Math.floor(moonLong / (360 / 27)) + 1; // 1-27
  const pada = Math.floor((moonLong % (360 / 27)) / (360 / 27 / 4)) + 1; // 1-4
  const rasi = planets.moon.sign;

  // Lagna (Ascendant)
  const houseResult = swisseph.swe_houses(julday, latitude, longitude, 'P'); // Placidus
  const lagna = Math.floor(houseResult.ascendant / 30) + 1;

  // Compute house positions for each planet
  for (const p of Object.keys(planets)) {
    planets[p].house = ((Math.floor(planets[p].longitude / 30) - Math.floor(houseResult.ascendant / 30) + 12) % 12) + 1;
  }

  const chevvai = detectChevvaiDosham(planets);

  return {
    nakshatra: nakshatraIndex,
    nakshatraName: NAKSHATRAS[nakshatraIndex - 1].name,
    pada,
    rasi,
    rasiName: RASI_NAMES[rasi - 1],
    lagna,
    lagnaName: RASI_NAMES[lagna - 1],
    moonDegree: moonLong,
    planets,
    gana: NAKSHATRAS[nakshatraIndex - 1].gana,
    yoniAnimal: NAKSHATRAS[nakshatraIndex - 1].yoni,
    yoniGender: NAKSHATRAS[nakshatraIndex - 1].yoniGender,
    rajjuGroup: NAKSHATRAS[nakshatraIndex - 1].rajju,
    rajjuDirection: NAKSHATRAS[nakshatraIndex - 1].rajjuDir,
    planetLord: NAKSHATRAS[nakshatraIndex - 1].lord,
    nadiType: NAKSHATRAS[nakshatraIndex - 1].nadi,
    chevvaiDosham: chevvai.hasDosha,
    chevvaiDoshamType: chevvai.type,
    calculationMethod: mode
  };
}
```

---

## 7. API ROUTES (COMPLETE)

### 7.1 Auth Routes

```
POST   /api/auth/request-otp          { phone }
POST   /api/auth/verify-otp           { phone, otp }
POST   /api/auth/refresh              (httpOnly cookie)
POST   /api/auth/logout
```

### 7.2 Profile Routes

```
POST   /api/profiles                  Create profile (auth required)
GET    /api/profiles/me               Get own profile
PUT    /api/profiles/me               Update profile
POST   /api/profiles/me/astro         Recalculate astro data (triggers ephemeris)
POST   /api/profiles/me/behavioral    Submit Big Five quiz answers
POST   /api/profiles/me/photo         Upload photo (multer → Cloudinary)
DELETE /api/profiles/me               Deactivate profile
```

### 7.3 Match Routes

```
GET    /api/matches                   Get ranked matches for own profile (paginated)
GET    /api/matches/:profileId        Get compatibility with specific profile
POST   /api/matches/:profileId/save   Save a match
GET    /api/matches/saved             Get saved matches
POST   /api/matches/:matchId/export   Trigger PDF generation (async via Bull queue)
GET    /api/matches/:matchId/pdf      Download generated PDF
POST   /api/matches/:matchId/outcome  Log outcome (married / rejected / etc.)
```

### 7.4 Community Routes (Admin)

```
POST   /api/communities               Create community (admin only)
GET    /api/communities/:code         Get community by invite code
POST   /api/communities/:code/join    Join community
```

### 7.5 Middleware Stack

```javascript
// Apply in order:
1. helmet()                    // Security headers
2. cors(corsOptions)           // Whitelist frontend URL only
3. express.json({ limit: '5mb' })
4. mongoSanitize()             // Prevent NoSQL injection
5. xss()                       // Prevent XSS
6. rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })  // 100 req/15min per IP
7. authMiddleware              // JWT verify (skip for /auth routes)
```

---

## 8. SECURITY IMPLEMENTATION

### 8.1 Field-Level Encryption (CSFLE)

```javascript
// config/encryption.js
const { ClientEncryption } = require('mongodb-client-encryption');

// Fields to encrypt:
// - phone
// - dateOfBirth
// - timeOfBirth
// - latitude
// - longitude
// - bigFiveScores (entire object)

// Use MongoDB CSFLE with local KMS for development, AWS KMS / Azure Key Vault for production
// Master key stored in environment variable, never in code
const ENCRYPTED_FIELDS = ['phone', 'dateOfBirth', 'timeOfBirth', 'latitude', 'longitude'];
```

### 8.2 JWT Implementation

```javascript
// Access token: 15 minutes, stored in memory (JS variable in frontend)
// Refresh token: 7 days, stored as httpOnly + SameSite=Strict cookie
// On every request: verify access token signature + expiry
// On 401: use refresh token to get new access token silently

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Refresh token is HASHED before storing in DB (bcrypt, 10 rounds)
// On verify: compare provided token with hash in DB
```

### 8.3 Rate Limiting (Specific Endpoints)

```javascript
// OTP endpoint: 3 requests per phone per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.phone
});

// Match endpoint: 30 requests per user per minute
const matchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user.id
});
```

### 8.4 Input Validation (All Routes)

Every route uses Zod schemas. Example:

```javascript
const createProfileSchema = z.object({
  candidateName: z.string().min(2).max(100),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeOfBirth: z.string().regex(/^\d{2}:\d{2}$/),
  placeOfBirth: z.string().min(2).max(200),
  motherTongue: z.enum(['tamil', 'telugu', 'kannada', 'malayalam']),
  calculationMethod: z.enum(['thirukkanitha', 'vakyam']).default('thirukkanitha')
});
```

### 8.5 No Logging of PII

```javascript
// Custom Morgan format — never log body, never log sensitive headers
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
// No req.body logging anywhere in the codebase
```

---

## 9. AI REPORT GENERATION (CLAUDE API)

### 9.1 System Prompt

```
You are an expert Vedic astrology compatibility analyst specializing in the South Indian Thirumana Porutham system. You receive structured JSON from a deterministic rule engine and produce a clear, honest, culturally-appropriate compatibility report.

Rules you must follow:
1. Never use the words "guaranteed", "perfect", "certain", or "safe".
2. Always use probabilistic language: "tendency toward", "risk of", "alignment suggests", "advisory".
3. Structure your report exactly as specified.
4. Keep the report under 800 words.
5. Be culturally respectful but analytically honest.
6. Always mention that this is a decision support tool and independent verification by a qualified astrologer is recommended.
7. If a hard reject exists (Rajju or Nadi Dosham), say so clearly but without catastrophizing.
```

### 9.2 User Prompt Template

```javascript
function buildAIPrompt(matchResult, profileA, profileB) {
  return `
Analyze this Thirumana Porutham compatibility result and generate a structured report.

GROOM NAKSHATRA: ${profileA.astroData.nakshatraName} (${profileA.astroData.gana} gana, ${profileA.astroData.yoniAnimal} yoni)
BRIDE NAKSHATRA: ${profileB.astroData.nakshatraName} (${profileB.astroData.gana} gana, ${profileB.astroData.yoniAnimal} yoni)

PORUTHAM RESULTS:
${JSON.stringify(matchResult.poruthams, null, 2)}

DOSHA ANALYSIS:
${JSON.stringify(matchResult.doshaAnalysis, null, 2)}

AGGREGATE: ${matchResult.passCount}/10 pass, ${matchResult.conditionalCount} conditional, ${matchResult.failCount} fail
HARD REJECT: ${matchResult.hasHardReject}
OVERALL SCORE: ${matchResult.overallScore}/100

Generate a report with exactly these sections:
1. Summary (2-3 sentences, overall compatibility assessment)
2. Strengths (bullet list of what works well)
3. Risk Zones (bullet list of areas needing attention)
4. Dosha Assessment (if any doshas, explain and mention samyam if present)
5. Recommendations (3 behavioral/lifestyle suggestions based on the mismatches)
6. For the Astrologer (technical summary — Nakshatra names, Rajju groups, Dosha details — in one paragraph for the family's astrologer to verify)
7. Disclaimer (standard disclaimer about this being a decision support tool)
`;
}
```

### 9.3 API Call

```javascript
async function generateAIReport(matchResult, profileA, profileB) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildAIPrompt(matchResult, profileA, profileB) }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}
```

---

## 10. PDF EXPORT (ASTROLOGER FORMAT)

The PDF must be generated async via Bull queue. The structure must follow traditional astrologer format.

### 10.1 PDF Sections

```
Page 1 — Cover
  - App name + date generated
  - Disclaimer (bold, prominent)

Page 2 — Groom Chart
  - South Indian square grid chart (rendered as SVG → canvas)
  - Planetary positions table
  - Nakshatra, Rasi, Lagna

Page 3 — Bride Chart
  - Same format

Page 4 — Porutham Summary Table
  - All 10 Poruthams with Pass/Conditional/Fail
  - Dosha flags
  - Aggregate score

Page 5 — AI Report
  - All 7 sections from AI report

Page 6 — Astrologer Notes (BLANK SECTION)
  - Header: "Astrologer's Assessment"
  - 20 blank lines
  - Section: "Suggested Pariharams (Remedies)"
  - 10 blank lines
  - Signature line
```

### 10.2 South Indian Square Chart Renderer

```javascript
// Render as SVG, convert to canvas for PDF embedding
function renderSouthIndianChart(planets, lagna) {
  // Houses in fixed positions:
  // [12][1][2]
  // [11][ ][3]
  // [10][9][8][7][6][5][4]
  // South Indian chart is a 4x4 grid with center 2x2 = logo/name
  // Top row: H12, H1, H2, H3
  // Second row: H11, [blank], [blank], H4
  // Third row: H10, [blank], [blank], H5
  // Bottom row: H9, H8, H7, H6
  // Lagna is marked in the corresponding house with an 'L'
  // Planets listed in their house cell
  // Implementation: generate SVG string, embed in jsPDF via svg2pdf
}
```

---

## 11. FRONTEND — SCREEN MAP

### 11.1 Public Screens (No auth)

```
/                    Landing page (value prop + CTA)
/join/:code          Join community via invite code
/login               OTP login (phone)
/verify              OTP verification
```

### 11.2 Parent Portal (auth required, role: parent)

```
/dashboard           Match feed — ranked list of compatible profiles
/profile/create      Create candidate profile (multi-step form)
/profile/edit        Edit profile
/matches             All matches with filters
/matches/:id         Single match detail — Porutham breakdown + AI report
/matches/:id/pdf     PDF download/export flow
/saved               Saved matches
/settings            Account settings
```

### 11.3 Candidate Portal (auth required, role: candidate)

```
/candidate/quiz      Big Five personality quiz (44 questions, IPIP format)
/candidate/profile   View own profile as others see it
```

### 11.4 Key Component: Match Card

```
MatchCard shows:
- Photo + name + age + nakshatra name
- Porutham score: X/10 (color coded: green ≥7, amber 5-6, red <5)
- Hard reject badge (red) if Rajju/Vedha/Nadi issue
- 3 key porutham chips (Rajju, Gana, Nadi)
- "View Full Report" → match detail page
- "Save" button
```

### 11.5 Key Component: Match Detail

```
Tabs:
  1. Porutham Breakdown — table of all 10, color coded
  2. Dosha Analysis — Chevvai, Nadi, Rajju explanations
  3. AI Report — formatted 7-section report
  4. Charts — both horoscopes side by side (South Indian grid)
  5. Export — generate PDF button + astrologer note
```

### 11.6 Mandatory Disclaimer Modal

```javascript
// Show ONCE per session, before ANY compatibility result
// User must click "I Understand" checkbox AND "Continue" button
// Text must include:
"This compatibility analysis is generated by a rule-based system and is intended as a decision support tool only. It does not constitute astrological advice or a guarantee of marital compatibility. Please verify all results with a qualified Jyotish astrologer before making any marriage-related decisions."
```

---

## 12. BUILD ORDER (EXACT SEQUENCE FOR AI AGENT)

Follow this order precisely. Do not skip ahead.

```
PHASE 0 — Environment Setup
  0.1  Init git repo, set up .gitignore
  0.2  Create /backend and /frontend directories
  0.3  Set up .env.example with all required keys
  0.4  Install all backend dependencies
  0.5  Install all frontend dependencies
  0.6  Configure ESLint + Prettier

PHASE 1 — Data & Engine
  1.1  Create NAKSHATRAS constant file
  1.2  Create all lookup tables (Yoni, Gana, Rasi, Vedha, Planet)
  1.3  Implement Swiss Ephemeris wrapper (calculateBirthChart)
  1.4  Implement all 10 Porutham functions
  1.5  Implement Dosha detection (Chevvai, Nadi, Rajju Samyam)
  1.6  Write unit tests for all 10 Poruthams with known cases
  [VERIFY] Run vitest — all tests must pass before Phase 2

PHASE 2 — Database
  2.1  Configure MongoDB connection with CSFLE
  2.2  Implement UserSchema + ProfileSchema + MatchResultSchema
  2.3  Add all indexes
  2.4  Implement DoshaRuleSchema + seed initial rules
  2.5  Implement CommunitySchema + seed one test community

PHASE 3 — Backend API
  3.1  Set up Express app with all middleware
  3.2  Implement auth routes (OTP request, verify, refresh, logout)
  3.3  Implement profile routes (CRUD + astro calculation trigger)
  3.4  Implement matching engine service (filter + score + rank)
  3.5  Implement match routes (GET matches, GET single, save, outcome)
  3.6  Set up Bull queue for PDF generation
  3.7  Implement PDF generation service (jsPDF + South Indian chart SVG)
  3.8  Implement AI report generation service (Claude API)
  3.9  Set up Swagger docs
  [VERIFY] Run Supertest API tests on all routes before Phase 4

PHASE 4 — Frontend Core
  4.1  Set up Vite + React + Tailwind + Zustand + React Router
  4.2  Implement auth store (Zustand) + axios interceptors (silent refresh)
  4.3  Build Login + OTP Verify screens
  4.4  Build CreateProfile multi-step form with Zod validation
  4.5  Build match dashboard screen (match card list)
  4.6  Build match detail screen (5-tab layout)
  4.7  Build disclaimer modal (mandatory, blocks results until accepted)
  4.8  Build PDF export flow UI

PHASE 5 — Frontend Secondary
  5.1  Build Candidate Quiz screen (IPIP Big Five — 44 questions)
  5.2  Build saved matches screen
  5.3  Build settings screen
  5.4  Implement i18next (Tamil labels for astrological terms)
  5.5  Implement Vakyam/Thirukkanitha toggle (global settings)

PHASE 6 — PWA + Android
  6.1  Configure Vite PWA plugin (manifest + service worker)
  6.2  Add Capacitor to frontend project
  6.3  Run: npx cap add android
  6.4  Configure Capacitor plugins: Camera (photo), App (deep links)
  6.5  Build APK: npx cap build android
  6.6  Test on Android emulator

PHASE 7 — Security Hardening
  7.1  Audit all routes for missing auth middleware
  7.2  Confirm all sensitive fields are in CSFLE config
  7.3  Add Content-Security-Policy header
  7.4  Add HSTS header
  7.5  Run npm audit — fix all high severity vulnerabilities
  7.6  Confirm no PII appears in server logs

PHASE 8 — Deployment
  8.1  Set up Railway project (backend + Redis + MongoDB Atlas)
  8.2  Set up Vercel project (frontend)
  8.3  Configure all environment variables in Railway + Vercel
  8.4  Set up GitHub Actions CI/CD (test → build → deploy)
  8.5  Configure Cloudflare in front of Vercel
  8.6  Test full flow in production environment
```

---

## 13. ENVIRONMENT VARIABLES (COMPLETE LIST)

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI= mongodb+srv://teamstadesign_db_user:8KClLxNsphjE9kIf@cluster001.qqismek.mongodb.net/?appName=cluster001
MONGODB_ENCRYPTION_KEY=<base64 96-byte local master key>

# JWT
JWT_ACCESS_SECRET=<random 64 char string>
JWT_REFRESH_SECRET=<random 64 char string>

# OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Geocoding
OPENCAGE_API_KEY=011dd24a30714ae4a7317e24665eed6f

# Cloudinary
CLOUDINARY_CLOUD_NAME=dyvxulmnl
CLOUDINARY_API_KEY=629263513422548
CLOUDINARY_API_SECRET=Tvih5gEByWJ8-j8OsHYkjayToLM

# gemini api 
GEMINI_API_KEY=AIzaSyCLEUJZ1D8BwQceyyazffK6JXZdwEQfcAk

# Redis
UPSTASH_REDIS_REST_URL="https://robust-bonefish-112866.upstash.io"

# VERCEL 
 API KEY = https://vercel.com/adithiyanvivekanandans-projects/jaatham
# SendGrid (email)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Ephemeris data path (swisseph)
SE_EPHE_PATH=./ephe
```
resend api = re_e29YgJ2q_3ye9vWGaoAmCgZk2LZ7TrnuH

---

## 14. KNOWN LIMITATIONS (MUST DOCUMENT IN APP)

These must be disclosed to the user on first launch:

1. The Vakyam offset used is approximate. For exact Vakyam calculation, consult a traditional panchangam.
2. Dosha Samyam (cancellation) rules implemented cover the 3 most common cancellations. Edge cases exist. An astrologer must review borderline cases.
3. No ML prediction is performed. Match ranking is based purely on Porutham rule outcomes.
4. Behavioral compatibility (Big Five) is only incorporated if the candidate has completed the quiz. Without it, only astrological matching is applied.
5. This platform does not verify the accuracy of birth time provided. A 5-minute error in birth time can shift the Nakshatra pada and affect some Poruthams.
6. This system implements the Tamil Thirumana Porutham standard. Kerala and Andhra Pradesh families may use different weightings for certain Poruthams.

---

## 15. WHAT TO BUILD IN v2 (OUT OF SCOPE FOR v1)

Do not build these now. Log the outcome data so v2 is possible:

- ML ranking model trained on outcome data (needs minimum 1000 logged outcomes)
- Kerala mode (different Rajju weightings)
- Dasha timeline (planetary period compatibility prediction)
- Behaviorally-weighted final score (requires Big Five completion data)
- Full Jathagam deep comparison (house-by-house analysis beyond just Nakshatra)
- In-app messaging between families
- Astrologer partner account type (allows verified astrologers to add notes to PDF)

---

## 16. LEGAL REQUIREMENTS

Include all of these before launch:

1. Terms of Service: explicitly states the app is not a substitute for professional astrological consultation.
2. Privacy Policy: details what PII is collected, how it is encrypted, how long it is retained, and how to request deletion (DPDP Act 2023 compliance for India).
3. Disclaimer checkbox: required before viewing any match result (see Section 11.6).
4. Data deletion: user must be able to delete all their data from the app — implement DELETE /api/users/me which hard-deletes profile, encrypted fields, and all match records linked to that user.
5. No minor users: date of birth validation must ensure candidate is at least 18 years old (21 for male, 18 for female per Indian marriage law).

---

**END OF DOCUMENT**

**Give this document to any AI coding agent. Execute Phase 0 through Phase 8 in sequence. Every decision is made. The result is a working, secure, South Indian Vedic matchmaking platform.**