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

const GANA_COMPATIBILITY = {
  deva:     { deva: 'pass',        manushya: 'pass',        rakshasa: 'fail' },
  manushya: { deva: 'conditional', manushya: 'pass',        rakshasa: 'conditional' },
  rakshasa: { deva: 'fail',        manushya: 'conditional', rakshasa: 'pass' }
};

const RASI_COMPATIBILITY = {
  1:  [1,5,9],
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

const VAKYAM_OFFSET_DEGREES = 0.12;

const RASI_NAMES = [
  'Mesha', 'Rishaba', 'Mithuna', 'Kataka', 'Simha', 'Kanni',
  'Thula', 'Vrichika', 'Dhanus', 'Makara', 'Kumbha', 'Meena'
];

module.exports = {
  NAKSHATRAS,
  VEDHA_PAIRS,
  YONI_COMPATIBILITY,
  GANA_COMPATIBILITY,
  RASI_COMPATIBILITY,
  PLANET_RELATIONSHIPS,
  VAKYAM_OFFSET_DEGREES,
  RASI_NAMES
};
