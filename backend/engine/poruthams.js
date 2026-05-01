const {
  NAKSHATRAS,
  VEDHA_PAIRS,
  YONI_COMPATIBILITY,
  GANA_COMPATIBILITY,
  PLANET_RELATIONSHIPS
} = require('./constants');
const {
  checkRajjuSamyam,
  computeDoshaAnalysis,
  computeVasya
} = require('./doshas');

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

module.exports = {
  computePorutham
};
