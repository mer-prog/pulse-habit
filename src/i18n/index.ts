import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ja from './locales/ja.json';
import en from './locales/en.json';

const resources = {
  ja: { translation: ja },
  en: { translation: en },
};

/**
 * Detect the device locale and map to a supported language.
 * Japanese locales → 'ja', everything else → 'en'.
 */
export function getDeviceLanguage(): 'ja' | 'en' {
  const locales = Localization.getLocales();
  const primary = locales[0]?.languageCode ?? 'en';
  return primary === 'ja' ? 'ja' : 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ja', // default; overridden by settingsStore on app startup
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  compatibilityJSON: 'v4',
});

export default i18n;
