import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ar from './ar.json';
import en from './en.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language - Guard for SSR/Node environment
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  AsyncStorage.getItem('user-language').then(lng => {
    if (lng) {
      i18n.changeLanguage(lng);
      const isRtl = lng === 'ar';
      if (I18nManager.isRTL !== isRtl) {
        I18nManager.forceRTL(isRtl);
        I18nManager.allowRTL(isRtl);
      }
    }
  }).catch(err => console.debug('i18n storage load error:', err));
}

export default i18n;
