import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DevSettings, I18nManager, Platform } from "react-native";

import ar from "./ar.json";
import en from "./en.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_KEY = "user-language";

const reloadApp = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return;
  }

  try {
    await Updates.reloadAsync();
    return;
  } catch {
    // In dev clients / Expo Go, expo-updates may not be able to reload.
  }

  try {
    DevSettings.reload();
  } catch {
    // Last resort: the next cold app start will use the persisted RTL setting.
  }
};

// ──────────────────────────────────────────────────────────
// 1. Initial State Setup
// ──────────────────────────────────────────────────────────
let initialLng = I18nManager.isRTL ? "ar" : "en";

// On Web, we can check localStorage synchronously to avoid the "async refinement" loop
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const saved = window.localStorage.getItem(LANGUAGE_KEY);
  if (saved) {
    initialLng = saved;
    const needsRTL = saved === 'ar';
    
    // Apply RTL to document immediately to prevent layout shifts
    if (document.documentElement) {
        document.documentElement.dir = needsRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = saved;
    }
    
    // Sync React Native's I18nManager
    if (I18nManager.isRTL !== needsRTL) {
      I18nManager.allowRTL(needsRTL);
      I18nManager.forceRTL(needsRTL);
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}, (err) => {
  if (err) return console.error('i18n init error:', err);

  // Skip layout synchronization during SSR
  if (Platform.OS === 'web' && typeof window === 'undefined') return;

  const isArabic = i18n.language ? i18n.language.startsWith('ar') : false;
  
  // Only trigger reload if layout and language are mismatched AND we are on native
  // On Web, we handle this via document.dir and localStorage synchronously above
  if (Platform.OS !== 'web' && isArabic !== I18nManager.isRTL) {
    I18nManager.allowRTL(isArabic);
    I18nManager.forceRTL(isArabic);
    if (I18nManager.swapLeftAndRightInRTL) {
      I18nManager.swapLeftAndRightInRTL(isArabic);
    }
    setTimeout(() => {
      reloadApp();
    }, 100);
  }
});

// ──────────────────────────────────────────────────────────
// 2. ASYNC refinement (Native only)
// ──────────────────────────────────────────────────────────
const RELOAD_FLAG = "is_reloading_for_lang";

const refineLanguageFromStorage = async () => {
  if (Platform.OS === 'web') return; // Handled synchronously on Web

  try {
    let saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    if (!saved) {
      saved = "ar";
      await AsyncStorage.setItem(LANGUAGE_KEY, "ar");
    }

    if (saved && saved !== i18n.language) {
      const isReloading = await AsyncStorage.getItem(RELOAD_FLAG);
      if (isReloading === "true") {
        // We just reloaded, so native I18nManager failed to update (Dev client bug).
        // Let's just update JS state and clear flag.
        await AsyncStorage.removeItem(RELOAD_FLAG);
        isRTL = saved === 'ar';
        await i18n.changeLanguage(saved);
        return;
      }

      const needsRTL = saved === 'ar';
      if (I18nManager.isRTL !== needsRTL) {
        await AsyncStorage.setItem(RELOAD_FLAG, "true");
        await changeLanguage(saved as "en" | "ar");
      } else {
        await i18n.changeLanguage(saved);
      }
    } else {
      await AsyncStorage.removeItem(RELOAD_FLAG);
    }
  } catch (e) {
    console.error("Failed to load language from storage", e);
  }
};

refineLanguageFromStorage();

// ──────────────────────────────────────────────────────────
// 3. Public API to change language
// ──────────────────────────────────────────────────────────
export const changeLanguage = async (lng: "en" | "ar") => {
  await i18n.changeLanguage(lng);
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_KEY, lng);
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  }

  const isRTL = lng === "ar";

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }

    if (I18nManager.swapLeftAndRightInRTL) {
      I18nManager.swapLeftAndRightInRTL(isRTL);
    }

    await AsyncStorage.setItem(RELOAD_FLAG, "true");
    setTimeout(() => {
      reloadApp();
    }, 500);
  }
};

export const tr = (obj: any): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  const lang = i18n.language;

  if (lang ? lang.startsWith("ar") : false) {
    return (
      obj.nameAr ||
      obj.name_ar ||
      obj.translation?.ar ||
      obj.name_translation?.ar ||
      obj.name ||
      ""
    );
  }

  return (
    obj.nameEn ||
    obj.name_en ||
    obj.displayName ||
    obj.display_name ||
    obj.name ||
    ""
  );
};

export let isRTL = I18nManager.isRTL;

export const getFlexDirection = (desiredRTL: boolean): "row" | "row-reverse" => {
  return desiredRTL === I18nManager.isRTL ? "row" : "row-reverse";
};

export default i18n;
