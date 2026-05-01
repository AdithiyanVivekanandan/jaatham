
const { computePorutham } = require('../engine/poruthams');
const { NAKSHATRAS } = require('../engine/constants');

describe('Porutham Engine', () => {
  it('should compute poruthams correctly for a known good match', () => {
    // Ashwini (1) and Bharani (2)
    const profileA = {
      astroData: {
        nakshatra: 1,
        rasi: 1,
        nadiType: NAKSHATRAS[0].nadi,
        chevvaiDosham: false
      }
    };
    const profileB = {
      astroData: {
        nakshatra: 2,
        rasi: 1,
        nadiType: NAKSHATRAS[1].nadi,
        chevvaiDosham: false
      }
    };

    const result = computePorutham(profileA, profileB);
    
    // Check structure
    expect(result).toHaveProperty('poruthams');
    expect(result).toHaveProperty('passCount');
    expect(result).toHaveProperty('failCount');
    expect(result).toHaveProperty('overallScore');

    // Specific porutham checks
    // Dina: nakA=1, nakB=2. Distance: ((1 - 2 + 27) % 27) + 1 = (26 % 27) + 1 = 27
    // 27 % 3 === 0 => conditional
    expect(result.poruthams.dina.result).toBe('conditional');

    // Gana: Deva (A) and Manushya (B) -> pass
    expect(result.poruthams.gana.result).toBe('pass');

    // Yoni: Horse (A) and Elephant (B) -> 2 -> conditional
    expect(result.poruthams.yoni.result).toBe('conditional');

    // Rasi: Aries and Aries -> distance 1 -> pass
    expect(result.poruthams.rasi.result).toBe('pass');
    
    // Rajju: Pada (A) and Pada (B) -> Same rajju group.
    // Dir: A is ascending, B is descending. So different directions. -> conditional
    expect(result.poruthams.rajju.result).toBe('conditional');
    expect(result.poruthams.rajju.isCritical).toBe(false);
  });

  it('should trigger hard reject for same rajju group and direction without samyam', () => {
    const profileA = {
      astroData: {
        nakshatra: 1, // Ashwini (Pada, Ascending)
        rasi: 1,
        nadiType: NAKSHATRAS[0].nadi,
        chevvaiDosham: false
      }
    };
    const profileB = {
      astroData: {
        nakshatra: 3, // Krittika (Pada, Ascending)
        rasi: 1,
        nadiType: NAKSHATRAS[2].nadi,
        chevvaiDosham: false
      }
    };

    const result = computePorutham(profileA, profileB);
    expect(result.poruthams.rajju.result).toBe('fail');
    expect(result.poruthams.rajju.isCritical).toBe(true);
    expect(result.hasHardReject).toBe(true);
  });

  it('should compute dosha samyam correctly', () => {
    // Both have chevvai dosham
    const profileA = {
      astroData: {
        nakshatra: 1,
        rasi: 1,
        nadiType: NAKSHATRAS[0].nadi,
        chevvaiDosham: true
      }
    };
    const profileB = {
      astroData: {
        nakshatra: 3, // Krittika, Pada, Ascending
        rasi: 1,
        nadiType: NAKSHATRAS[2].nadi,
        chevvaiDosham: true
      }
    };

    const result = computePorutham(profileA, profileB);
    // Rajju should be conditional because they have samyam
    expect(result.poruthams.rajju.result).toBe('conditional');
    expect(result.poruthams.rajju.isCritical).toBe(false);
    expect(result.doshaAnalysis.chevvaiSamyam).toBe(true);
  });

  it('should fail vedha correctly', () => {
    const profileA = {
      astroData: {
        nakshatra: 1, // Ashwini
        rasi: 1,
        nadiType: NAKSHATRAS[0].nadi,
        chevvaiDosham: false
      }
    };
    const profileB = {
      astroData: {
        nakshatra: 18, // Jyeshtha
        rasi: 8,
        nadiType: NAKSHATRAS[17].nadi,
        chevvaiDosham: false
      }
    };

    const result = computePorutham(profileA, profileB);
    expect(result.poruthams.vedha.result).toBe('fail');
    expect(result.hasHardReject).toBe(true);
  });
});
