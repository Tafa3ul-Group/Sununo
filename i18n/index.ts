import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager, Platform } from "react-native";

import ar from "./ar.json";
import { isContentRTL, pickTranslation } from "./direction";
import en from "./en.json";

// Re-export the central direction API so existing `@/i18n` consumers keep working
export {
  isContentRTL,
  pickTranslation,
  resolveRowDirection,
  resolveTextAlign,
  useDirection,
} from "./direction";
export type { Direction, DirectionInfo } from "./direction";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_KEY = "user-language";

// ──────────────────────────────────────────────────────────
// Native RTL is permanently DISABLED.
// ──────────────────────────────────────────────────────────
// Direction is driven by a `direction: 'rtl' | 'ltr'` style on container roots
// (see the _layout files + portal wrappers), derived from `i18n.language`. This
// removes the language-switch reload AND the entire `i18n.language` ↔
// `I18nManager.isRTL` drift class that caused the reversed/incorrect layouts.
//
// `ensureNativeLTR` runs once at module load:
//   • Fresh installs: native is already LTR → nothing happens.
//   • Older installs that had `forceRTL(true)` persisted: flip it OFF and reload
//     exactly once so the native layout engine returns to LTR. After that,
//     I18nManager is never touched again and `I18nManager.isRTL` stays false.

const reloadApp = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.reload();
    return;
  }
  try {
    await Updates.reloadAsync();
    return;
  } catch {
    // dev clients / Expo Go may not support reloadAsync
  }
  try {
    const { DevSettings } = require("react-native");
    DevSettings.reload();
  } catch {
    // Last resort: next cold start will already have native LTR persisted.
  }
};

const ensureNativeLTR = () => {
  try {
    I18nManager.allowRTL(false);
    if (I18nManager.swapLeftAndRightInRTL) {
      I18nManager.swapLeftAndRightInRTL(false);
    }
    if (I18nManager.isRTL) {
      // One-time migration off the old native-RTL world.
      I18nManager.forceRTL(false);
      if (Platform.OS !== "web") {
        setTimeout(reloadApp, 50);
      }
    }
  } catch {
    // I18nManager may be unavailable in some test environments.
  }
};

ensureNativeLTR();

// ──────────────────────────────────────────────────────────
// Initial language
// ──────────────────────────────────────────────────────────
// Arabic-first by default. Web reads localStorage synchronously to avoid a
// flash; native refines from AsyncStorage right after init (no reload needed —
// the `direction` style just re-renders).
let initialLng = "ar";

if (Platform.OS === "web" && typeof window !== "undefined") {
  const saved = window.localStorage.getItem(LANGUAGE_KEY);
  if (saved) {
    initialLng = saved;
  }
  if (document.documentElement) {
    document.documentElement.dir = initialLng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = initialLng;
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
});

// ──────────────────────────────────────────────────────────
// Async refinement (native) — load the persisted language, default to Arabic.
// No reload, no RELOAD_FLAG: switching language is now a pure re-render.
// ──────────────────────────────────────────────────────────
const refineLanguageFromStorage = async () => {
  if (Platform.OS === "web") return; // handled synchronously above

  try {
    let saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (!saved) {
      saved = "ar";
      await AsyncStorage.setItem(LANGUAGE_KEY, "ar");
    }
    if (saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch (e) {
    console.error("Failed to load language from storage", e);
  }
};

refineLanguageFromStorage();

// ──────────────────────────────────────────────────────────
// Public API to change language — instant, no reload.
// ──────────────────────────────────────────────────────────
export const changeLanguage = async (lng: "en" | "ar") => {
  await i18n.changeLanguage(lng);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_KEY, lng);
    if (document.documentElement) {
      document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lng;
    }
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  }
};

export const tr = (obj: any): string =>
  pickTranslation(obj, isContentRTL(i18n.language));

export let isRTL = i18n.language ? isContentRTL(i18n.language) : false;

// Keep the module `isRTL` in sync with the language, and mirror the language
// into Redux so `state.auth.language` never diverges from i18next. i18next is
// the single source of truth; everything else is derived from it.
i18n.on("languageChanged", (lng: string) => {
  isRTL = lng ? isContentRTL(lng) : false;

  if (lng === "ar" || lng === "en") {
    try {
      const { store } = require("@/store");
      const { setLanguage } = require("@/store/authSlice");
      if (store.getState().auth.language !== lng) {
        store.dispatch(setLanguage(lng));
      }
    } catch {
      // Store not ready yet (very early init) — safe to skip.
    }
  }
});

/**
 * @deprecated Rows mirror via the container `direction` style; this always
 * returns 'row'. Kept for backward-compat of existing imports.
 */
export const getFlexDirection = (_desiredRTL?: boolean): "row" | "row-reverse" =>
  "row";

export default i18n;
