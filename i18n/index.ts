import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Alert, I18nManager, Platform } from "react-native";

import ar from "./ar.json";
import { isContentRTL, pickTranslation } from "./direction";
import en from "./en.json";

// Re-export the central direction API so existing `@/i18n` consumers keep working
export {
  isContentRTL,
  ltrScrollContent,
  ltrScroller,
  pickTranslation,
  pinLTR,
  resolveRowDirection,
  resolveTextAlign,
  useDirection,
  useRtlListOrder,
} from "./direction";
export type { Direction, DirectionInfo } from "./direction";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_KEY = "user-language";
/** Guards the self-healing reload so a build that cannot flip the native flag never loops. */
const RTL_RELOAD_KEY = "rtl-reload-attempted-for";

/**
 * Restart the JS+native runtime so a new I18nManager direction takes effect.
 * `expo-updates` is the production path; `DevSettings` covers a dev client.
 */
const reloadApp = async () => {
  try {
    const Updates = await import("expo-updates");
    if (typeof Updates?.reloadAsync === "function") {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // expo-updates unavailable (bare dev client / test env) — fall through.
  }
  try {
    const { DevSettings } = require("react-native");
    DevSettings?.reload?.();
  } catch {
    // Nothing we can do; the direction applies on the next cold start.
  }
};

// ──────────────────────────────────────────────────────────
// Native RTL is ON for Arabic (direction model v3 — see i18n/direction.ts).
// ──────────────────────────────────────────────────────────
// The OS mirrors the whole app: the iOS back-swipe, horizontal scroll offsets,
// native headers, Alert, the date picker. The previous model drove layout from
// a `direction` style on container roots, which only reached what Yoga lays out
// in JS and left every platform-owned surface stubbornly LTR.
//
// The trade-off is that `I18nManager` only takes effect on a fresh NATIVE
// start, so a direction change requires a restart. `applyDirectionForLanguage`
// writes the preference; `changeLanguage` below owns the restart.
//
// `swapLeftAndRightInRTL` is deliberately left at its default (ON) — that is
// what makes `textAlign: 'left'` mean "start side" for both <Text> and
// <TextInput>, which is the contract the ~400 call sites are written against.

const applyDirectionForLanguage = (lng: string): boolean => {
  const shouldBeRTL = isContentRTL(lng);
  try {
    if (I18nManager.isRTL === shouldBeRTL) return false;
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // caller must restart for this to take effect
  } catch {
    // I18nManager may be unavailable in some test environments.
    return false;
  }
};

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

    // Self-heal the one drift that actually matters: the native flag and the
    // saved language disagree. This happens on the FIRST launch after this
    // migration (every existing install has isRTL=false from the old model),
    // after a fresh install, and if a restart was ever interrupted.
    //
    // Reload exactly once per launch, guarded by a persisted marker, so a build
    // where forceRTL cannot stick (a JS-only reload in a dev client does not
    // flip the native flag) degrades to "wrong direction until the next cold
    // start" instead of an infinite reload loop.
    if (applyDirectionForLanguage(saved)) {
      const alreadyTried = await AsyncStorage.getItem(RTL_RELOAD_KEY);
      if (alreadyTried === saved) return;
      await AsyncStorage.setItem(RTL_RELOAD_KEY, saved);
      await reloadApp();
    } else {
      await AsyncStorage.removeItem(RTL_RELOAD_KEY);
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
  if (Platform.OS === "web") {
    await i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_KEY, lng);
      if (document.documentElement) {
        document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lng;
      }
    }
    return;
  }

  // Persist FIRST. If the restart below lands before the write completes, the
  // app would come back up in the old language and silently undo the choice.
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);

  const needsRestart = isContentRTL(lng) !== I18nManager.isRTL;
  if (!needsRestart) {
    // ar → ar-IQ, or en → en-US: strings change, direction does not.
    await i18n.changeLanguage(lng);
    return;
  }

  // Direction is changing. I18nManager only takes effect on a fresh native
  // start, so ask before restarting rather than yanking the app away — and do
  // NOT call i18n.changeLanguage() first: re-rendering the whole tree in the
  // new language while the native direction is still the old one is exactly
  // the mid-flip state that renders reversed.
  applyDirectionForLanguage(lng);
  await AsyncStorage.setItem(RTL_RELOAD_KEY, lng);

  const isArabic = lng === "ar";
  Alert.alert(
    isArabic ? "تغيير اللغة" : "Change language",
    isArabic
      ? "لتطبيق اتجاه الواجهة بشكل صحيح، سيُعاد تشغيل التطبيق الآن."
      : "The app needs to restart to apply the new layout direction.",
    [
      {
        text: isArabic ? "إلغاء" : "Cancel",
        style: "cancel",
        // Undo everything, or the next launch silently switches language.
        onPress: () => {
          applyDirectionForLanguage(i18n.language);
          AsyncStorage.setItem(LANGUAGE_KEY, i18n.language).catch(() => {});
          AsyncStorage.removeItem(RTL_RELOAD_KEY).catch(() => {});
        },
      },
      {
        text: isArabic ? "إعادة التشغيل" : "Restart",
        onPress: () => {
          reloadApp().catch(() => {});
        },
      },
    ],
  );
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
