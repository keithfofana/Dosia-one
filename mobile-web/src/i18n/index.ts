import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';
import sw from './locales/sw.json';

export const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'sw'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES: SupportedLocale[] = ['ar'];

const LOCALE_STORAGE_KEY = 'dosia_locale';

function applyDocumentDirection(locale: string): void {
  const dir = RTL_LOCALES.includes(locale as SupportedLocale) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
}

const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale = SUPPORTED_LOCALES.includes(storedLocale as SupportedLocale) ? storedLocale! : 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    sw: { translation: sw },
  },
  lng: initialLocale,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

applyDocumentDirection(initialLocale);

i18n.on('languageChanged', (locale) => {
  applyDocumentDirection(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
});

export default i18n;
