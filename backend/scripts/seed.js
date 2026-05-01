require('dotenv').config();
const mongoose = require('mongoose');
const Community = require('../models/Community');
const DoshaRule = require('../models/DoshaRule');

const COMMUNITIES = [
  {
    name: 'Iyer Community — Chennai',
    inviteCode: 'IYER2024',
    city: 'Chennai',
    state: 'Tamil Nadu',
    memberCount: 0,
    isActive: true
  },
  {
    name: 'Mudaliar Community — Coimbatore',
    inviteCode: 'MUDL2024',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    memberCount: 0,
    isActive: true
  }
];

const DOSHA_RULES = [
  {
    doshaName: 'chevvai',
    triggerCondition: { marsHouses: [1, 2, 4, 7, 8, 12] },
    severity: 'severe',
    cancellationRules: [
      {
        condition: 'Mars in own sign (Aries or Scorpio)',
        cancellationLogic: { marsSign: ['aries', 'scorpio'] }
      },
      {
        condition: 'Mars exalted (Capricorn)',
        cancellationLogic: { marsSign: ['capricorn'] }
      },
      {
        condition: 'Both partners have Chevvai Dosham (mutual cancellation)',
        cancellationLogic: { bothHaveChevvai: true }
      }
    ],
    isActive: true,
    source: 'Brihat Parashara Hora Shastra, Ch. 18; Jataka Parijata'
  },
  {
    doshaName: 'rajju',
    triggerCondition: { sameRajjuGroupAndDirection: true },
    severity: 'severe',
    cancellationRules: [
      {
        condition: 'Both partners have Chevvai Dosham cancels Rajju restriction in some traditions',
        cancellationLogic: { bothHaveChevvai: true }
      }
    ],
    isActive: true,
    source: 'Muhurtha Chintamani; traditional South Indian practice'
  },
  {
    doshaName: 'nadi',
    triggerCondition: { sameNadiType: true },
    severity: 'severe',
    cancellationRules: [
      {
        condition: 'Both have the same nakshatra (exception case)',
        cancellationLogic: { sameNakshatra: true }
      }
    ],
    isActive: true,
    source: 'Brihat Samhita; Tamil Jyotish tradition'
  },
  {
    doshaName: 'vedha',
    triggerCondition: { isVedhaPair: true },
    severity: 'mild',
    cancellationRules: [
      {
        condition: 'Nakshatra lords are mutual friends',
        cancellationLogic: { nadiLordsFriendly: true }
      }
    ],
    isActive: true,
    source: 'Muhurtha Chintamani'
  }
];

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jatham';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Seed communities (skip if already exist)
    for (const c of COMMUNITIES) {
      const exists = await Community.findOne({ inviteCode: c.inviteCode });
      if (!exists) {
        await Community.create(c);
        console.log(`✓ Created community: ${c.name}`);
      } else {
        console.log(`→ Community already exists: ${c.name}`);
      }
    }

    // Seed dosha rules (skip if already exist)
    for (const rule of DOSHA_RULES) {
      const exists = await DoshaRule.findOne({ doshaName: rule.doshaName });
      if (!exists) {
        await DoshaRule.create(rule);
        console.log(`✓ Created dosha rule: ${rule.doshaName}`);
      } else {
        console.log(`→ Dosha rule already exists: ${rule.doshaName}`);
      }
    }

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
