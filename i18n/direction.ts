import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────────────────
// Direction model (single source of truth)
// ──────────────────────────────────────────────────────────
// Native RTL (React Native's I18nManager) is permanently DISABLED — see
// i18n/index.ts `ensureNativeLTR`. Layout direction is instead driven by a
// single `direction: 'rtl' | 'ltr'` style applied on container roots (the
// navigators' contentStyle/sceneStyle and every portal root — bottom sheets,
// toasts, dialogs), derived from the active i18n language.
//
// Inside an RTL container, Yoga auto-mirrors `flexDirection: 'row'` and every
// LOGICAL edge (start/end, marginStart/End, paddingStart/End, borderStart*).
// So components write NATURAL left-to-right layout and never reverse manually.
//
// Consequences for this file:
//   • `rowDirection` is ALWAYS 'row' (kept only so the many existing
//     `flexDirection: rowDirection` call sites keep compiling — they now mirror
//     via the container, not here).
//   • Never reintroduce a `row-reverse` / counter derived from `isRTL` or
//     `I18nManager.isRTL`. That was the old double-flip bug.
//   • `textAlign` is set explicitly because textAlign is NOT part of RN's
//     logical-edge swap.
// ──────────────────────────────────────────────────────────

export type Direction = "rtl" | "ltr";

/** Whether the given language code represents RTL content (Arabic). */
export const isContentRTL = (lang?: string | null): boolean =>
  !!lang && lang.startsWith("ar");

/** Resolve textAlign for content reading in `rtl` direction. */
export const resolveTextAlign = (rtl: boolean): "right" | "left" =>
  rtl ? "right" : "left";

/**
 * @deprecated Rows mirror via the container `direction` style now; just write
 * `flexDirection: 'row'`. Kept (always returns 'row') for backward-compat of
 * existing `flexDirection: rowDirection` / `resolveRowDirection(...)` call sites.
 * The previous signature accepted (contentRTL, managerRTL) — both are ignored.
 */
export const resolveRowDirection = (
  _contentRTL?: boolean,
  _managerRTL?: boolean,
): "row" | "row-reverse" => "row";

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
  /** The `direction` value to apply on a container root subtree. */
  direction: Direction;
  /** @deprecated always 'row' — rows mirror via the container direction. */
  rowDirection: "row" | "row-reverse";
  /** textAlign matching the active language (textAlign is not auto-swapped). */
  textAlign: "right" | "left";
}

/**
 * Single source of truth for direction in components. Derives everything from
 * `i18n.language` (canonical). Native I18nManager state is never read.
 */
export function useDirection(): DirectionInfo {
  const { i18n } = useTranslation();
  const isRTL = isContentRTL(i18n.language);
  return {
    isRTL,
    direction: isRTL ? "rtl" : "ltr",
    rowDirection: "row",
    textAlign: resolveTextAlign(isRTL),
  };
}
