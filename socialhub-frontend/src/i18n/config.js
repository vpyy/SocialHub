import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import vi from './locales/vi.json';
import en from './locales/en.json';

// Get saved language or default to Vietnamese
const savedLanguage = localStorage.getItem('language') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en }
    },
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
