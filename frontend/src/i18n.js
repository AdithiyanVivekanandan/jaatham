import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_name": "Jatham",
      "slogan": "Premium Vedic Matchmaking",
      "next": "Next",
      "back": "Back",
      "submit": "Submit",
      "save": "Save",
      "nakshatra": "Nakshatra",
      "rasi": "Rasi",
      "lagna": "Lagna",
      "dosha": "Dosha",
      "chevvai_dosham": "Chevvai Dosham",
      "matching_score": "Matching Score",
      "porutham": "Porutham",
      // ... more terms
    }
  },
  ta: {
    translation: {
      "app_name": "ஜாதம்",
      "slogan": "உயர்தர வேத வரன் தேடல்",
      "next": "அடுத்து",
      "back": "பின்பு",
      "submit": "சமர்ப்பி",
      "save": "சேமி",
      "nakshatra": "நட்சத்திரம்",
      "rasi": "ராசி",
      "lagna": "லக்னம்",
      "dosha": "தோஷம்",
      "chevvai_dosham": "செவ்வாய் தோஷம்",
      "matching_score": "பொருத்த மதிப்பெண்",
      "porutham": "பொருத்தம்",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
