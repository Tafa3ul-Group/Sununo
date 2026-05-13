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
// 1. SYNCHRONOUS init — uses I18nManager.isRTL which is
//    available immediately (set by the OS / previous session).
//    This prevents the "English flash" on Arabic devices.
// ──────────────────────────────────────────────────────────
const syncDefault = I18nManager.isRTL ? "ar" : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: syncDefault,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
}, (err, t) => {
  if (err) return console.error('i18n init error:', err);

  // Ensure layout matches language (handles cases where they get out of sync)
  const isArabic = i18n.language === 'ar';
  if (isArabic !== I18nManager.isRTL) {
    I18nManager.allowRTL(isArabic);
    I18nManager.forceRTL(isArabic);
    I18nManager.swapLeftAndRightInRTL(isArabic);
    setTimeout(() => {
      reloadApp();
    }, 100);
  }
});

// ──────────────────────────────────────────────────────────
// 2. ASYNC refinement — read saved preference from storage.
//    If it differs from the sync default, update and reload if needed.
// ──────────────────────────────────────────────────────────
const refineLanguageFromStorage = async () => {
  try {
    let saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    // Default to Arabic on first launch if no preference is saved
    if (!saved) {
      saved = "ar";
      await AsyncStorage.setItem(LANGUAGE_KEY, "ar");
    }

    if (saved && saved !== i18n.language) {
      const needsRTL = saved === 'ar';
      if (I18nManager.isRTL !== needsRTL) {
        // If layout needs to change, use the public API which reloads
        await changeLanguage(saved as "en" | "ar");
      } else {
        // Otherwise just update the language in memory
        await i18n.changeLanguage(saved);
      }
    }
  } catch (e) {
    console.error("Failed to load language from storage", e);
  }
};

refineLanguageFromStorage();

// ──────────────────────────────────────────────────────────
// 3. Public API to change language (saves + reloads for RTL)
// ──────────────────────────────────────────────────────────
export const changeLanguage = async (lng: "en" | "ar") => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);

  const isRTL = lng === "ar";

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    I18nManager.swapLeftAndRightInRTL(isRTL);

    setTimeout(() => {
      reloadApp();
    }, 500);
  }
};

// ──────────────────────────────────────────────────────────
// 4. tr() — Global helper to translate dynamic API objects.
//    Automatically picks the right name field based on
//    the current i18next language. Use across the entire app:
//
//      import { tr } from "../../i18n/i18n";
//      tr(match?.homeTeam)   // → Arabic or English name
// ──────────────────────────────────────────────────────────
export const tr = (obj: any): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  const lang = i18n.language;

  if (lang === "ar") {
    return (
      obj.nameAr ||
      obj.name_ar ||
      obj.translation?.ar ||
      obj.name_translation?.ar ||
      obj.name ||
      ""
    );
  }

// English / default
  return (
    obj.nameEn ||
    obj.name_en ||
    obj.displayName ||
    obj.display_name ||
    obj.name ||
    ""
  );
};

export const isRTL = I18nManager.isRTL;

export default i18n;
