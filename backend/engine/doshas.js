const { VAKYAM_OFFSET_DEGREES } = require('./constants');

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

function applyVakyamOffset(nakshatraDegree) {
  return (nakshatraDegree - VAKYAM_OFFSET_DEGREES + 360) % 360;
}

module.exports = {
  checkRajjuSamyam,
  computeDoshaAnalysis,
  computeVasya,
  detectChevvaiDosham,
  checkChevvaiCancellations,
  applyVakyamOffset
};
