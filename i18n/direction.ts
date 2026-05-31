import { I18nManager } from "react-native";
import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────────────────
// Pure, testable helpers (no React / no native dependency)
// ──────────────────────────────────────────────────────────

/** Whether the given language code represents RTL content (Arabic). */
export const isContentRTL = (lang?: string | null): boolean =>
  !!lang && lang.startsWith("ar");

/**
 * Resolve the flexDirection for a row whose CONTENT should read in
 * `contentRTL` direction, given the device's current `managerRTL`
 * (I18nManager.isRTL) state.
 *
 * React Native auto-flips `flexDirection: "row"` when I18nManager.isRTL is
 * true. So when the content's desired direction already matches the manager,
 * a plain "row" lays out correctly; when they differ (e.g. right after a
 * language switch but before the native reload), we counteract with
 * "row-reverse". This preserves the exact behavior the codebase relied on.
 */
export const resolveRowDirection = (
  contentRTL: boolean,
  managerRTL: boolean = I18nManager.isRTL,
): "row" | "row-reverse" => (contentRTL === managerRTL ? "row" : "row-reverse");

/** Resolve textAlign for content reading in `rtl` direction. */
export const resolveTextAlign = (rtl: boolean): "right" | "left" =>
  rtl ? "right" : "left";

/**
 * Pick the localized string from a backend object, honoring the active
 * direction. Tries a series of common key shapes returned by the API.
 * Pure so it can be unit-tested without the i18n init module.
 */
export const pickTranslation = (obj: any, rtl: boolean): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  if (rtl) {
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

// ──────────────────────────────────────────────────────────
// React hook: the single API components should consume
// ──────────────────────────────────────────────────────────

export interface DirectionInfo {
  /** True when the active language is RTL (Arabic). */
  isRTL: boolean;
  /** flexDirection to use for a content-direction row. */
  rowDirection: "row" | "row-reverse";
  /** textAlign matching the active language. */
  textAlign: "right" | "left";
}

/**
 * Single source of truth for direction in components.
 * Derives everything from `i18n.language` (canonical) and the native
 * I18nManager.isRTL, so components never read those directly.
 */
export function useDirection(): DirectionInfo {
  const { i18n } = useTranslation();
  const isRTL = isContentRTL(i18n.language);
  return {
    isRTL,
    rowDirection: resolveRowDirection(isRTL, I18nManager.isRTL),
    textAlign: resolveTextAlign(isRTL),
  };
}
