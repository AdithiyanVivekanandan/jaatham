/**
 * Engine Unit Tests — All 10 Poruthams with Known Cases
 * Uses known nakshatra pairs from traditional references
 */
import { describe, it, expect } from 'vitest';
import { computePorutham } from '../engine/poruthams.js';

// Helper to build a minimal profile for testing
function makeProfile(nakshatra, rasi, gender, extras = {}) {
  const NAKSHATRAS = [
    { id:1, name:'Ashwini', gana:'deva', yoni:'horse', yoniGender:'male', rajju:'pada', rajjuDir:'ascending', lord:'ketu', nadi:'aadi' },
    { id:2, name:'Bharani', gana:'manushya', yoni:'elephant', yoniGender:'male', rajju:'pada', rajjuDir:'descending', lord:'venus', nadi:'madhya' },
    { id:7, name:'Punarvasu', gana:'deva', yoni:'cat', yoniGender:'male', rajju:'nabhi', rajjuDir:'ascending', lord:'jupiter', nadi:'aadi' },
    { id:13, name:'Hasta', gana:'deva', yoni:'buffalo', yoniGender:'male', rajju:'siro', rajjuDir:'ascending', lord:'moon', nadi:'aadi' },
    { id:17, name:'Anuradha', gana:'deva', yoni:'hare', yoniGender:'male', rajju:'nabhi', rajjuDir:'ascending', lord:'saturn', nadi:'madhya' },
    { id:18, name:'Jyeshtha', gana:'rakshasa', yoni:'hare', yoniGender:'female', rajju:'nabhi', rajjuDir:'descending', lord:'mercury', nadi:'antya' },
    { id:19, name:'Moola', gana:'rakshasa', yoni:'dog', yoniGender:'male', rajju:'kati', rajjuDir:'descending', lord:'ketu', nadi:'aadi' },
    { id:27, name:'Revati', gana:'deva', yoni:'elephant', yoniGender:'female', rajju:'kanta', rajjuDir:'descending', lord:'mercury', nadi:'antya' },
  ];
  const star = NAKSHATRAS.find(n => n.id === nakshatra) || NAKSHATRAS[0];
  return {
    astroData: {
      nakshatra,
      rasi,
      gana: star.gana,
      yoniAnimal: star.yoni,
      yoniGender: star.yoniGender,
      rajjuGroup: star.rajju,
      rajjuDirection: star.rajjuDir,
      planetLord: star.lord,
      nadiType: star.nadi,
      chevvaiDosham: extras.chevvaiDosham || false,
      chevvaiDoshamType: extras.chevvaiDoshamType || 'none',
    },
    gender,
    ...extras
  };
}

describe('Porutham Engine — Known Test Cases', () => {

  describe('Dina Porutham', () => {
    it('should PASS when star distance is not in fail list', () => {
      // Nakshatra 1 to Nakshatra 2: distance = 1 → pass
      const groom = makeProfile(2, 1, 'male');
      const bride = makeProfile(1, 1, 'female');
      const result = computePorutham(groom, bride);
      expect(result.poruthams.dina.result).toBe('pass');
    });

    it('should FAIL when star distance is in [3,5,7,10,12,14,16,19,21,23,25]', () => {
      // Nakshatra 4 to Nakshatra 1: distance = 3 from bride perspective → fail
      const groom = makeProfile(4, 1, 'male');
      const bride = makeProfile(1, 1, 'female');
      const result = computePorutham(groom, bride);
      expect(result.poruthams.dina.result).toBe('fail');
    });
  });

  describe('Gana Porutham', () => {
    it('Deva + Deva = PASS', () => {
      const groom = makeProfile(1, 1, 'male');  // Ashwini - deva
      const bride = makeProfile(7, 1, 'female'); // Punarvasu - deva
      const result = computePorutham(groom, bride);
      expect(result.poruthams.gana.result).toBe('pass');
    });

    it('Rakshasa groom + Deva bride = FAIL', () => {
      const groom = makeProfile(19, 1, 'male');  // Moola - rakshasa
      const bride = makeProfile(1, 1, 'female');  // Ashwini - deva
      const result = computePorutham(groom, bride);
      expect(result.poruthams.gana.result).toBe('fail');
    });
  });

  describe('Yoni Porutham', () => {
    it('Same yoni, opposite gender = PASS', () => {
      // horse male (Ashwini) + horse female (Shatabhisha)
      const groom = makeProfile(1, 1, 'male');   // Ashwini - horse male
      const bride = makeProfile(24, 1, 'female'); // Shatabhisha - horse female
      const result = computePorutham(groom, bride);
      expect(result.poruthams.yoni.result).toBe('pass');
    });

    it('Enemy yoni pair should FAIL', () => {
      // dog (Ardra) vs cat (Punarvasu) = enemy score 0 → fail
      const groom = makeProfile(6, 3, 'male');   // Ardra - dog
      const bride = makeProfile(7, 3, 'female'); // Punarvasu - cat
      const result = computePorutham(groom, bride);
      expect(result.poruthams.yoni.result).toBe('fail');
    });
  });

  describe('Rajju Porutham', () => {
    it('Different rajju groups = PASS', () => {
      const groom = makeProfile(1, 1, 'male');   // pada group
      const bride = makeProfile(13, 6, 'female'); // siro group
      const result = computePorutham(groom, bride);
      expect(result.poruthams.rajju.result).toBe('pass');
      expect(result.poruthams.rajju.isCritical).toBe(false);
    });

    it('Same rajju group AND same direction = FAIL (isCritical)', () => {
      // Ashwini (pada, ascending) + Shravana (pada, ascending)
      const groom = makeProfile(1, 1, 'male');   // pada ascending
      const bride = makeProfile(22, 9, 'female'); // pada ascending
      const result = computePorutham(groom, bride);
      expect(result.poruthams.rajju.result).toBe('fail');
      expect(result.poruthams.rajju.isCritical).toBe(true);
    });
  });

  describe('Vedha Porutham', () => {
    it('Ashwini (1) and Jyeshtha (18) are Vedha pair = FAIL', () => {
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(18, 8, 'female');
      const result = computePorutham(groom, bride);
      expect(result.poruthams.vedha.result).toBe('fail');
    });

    it('Non-vedha pair = PASS', () => {
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(13, 6, 'female');
      const result = computePorutham(groom, bride);
      expect(result.poruthams.vedha.result).toBe('pass');
    });
  });

  describe('Nadi Dosha', () => {
    it('Same nadi type = Nadi Dosham', () => {
      // Ashwini (aadi) + Moola (aadi) = same nadi
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(19, 9, 'female');
      const result = computePorutham(groom, bride);
      expect(result.doshaAnalysis.nadiDosham).toBe(true);
    });

    it('Different nadi type = No Nadi Dosham', () => {
      // Ashwini (aadi) + Anuradha (madhya) = different nadi
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(17, 8, 'female');
      const result = computePorutham(groom, bride);
      expect(result.doshaAnalysis.nadiDosham).toBe(false);
    });
  });

  describe('Overall Score', () => {
    it('Score should be between 0 and 100', () => {
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(13, 6, 'female');
      const result = computePorutham(groom, bride);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('Hard reject should cap score at 35', () => {
      // Ashwini + Jyeshtha = vedha → hard reject
      const groom = makeProfile(1, 1, 'male');
      const bride = makeProfile(18, 8, 'female');
      const result = computePorutham(groom, bride);
      expect(result.hasHardReject).toBe(true);
      expect(result.overallScore).toBeLessThanOrEqual(35);
    });
  });
});
