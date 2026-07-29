import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────────────────
// Direction model v2 (single source of truth)
// ──────────────────────────────────────────────────────────
// Native RTL (React Native's I18nManager) is permanently DISABLED — see
// i18n/index.ts `ensureNativeLTR`. Layout direction is driven by a single
// `direction: 'rtl' | 'ltr'` style applied on container roots (the navigators'
// contentStyle/sceneStyle, GestureHandlerRootView, and every NEW NATIVE ROOT —
// i.e. each RN <Modal>'s top content view), derived from the active language.
//
// Inside an RTL container, Yoga auto-mirrors `flexDirection: 'row'` and every
// LOGICAL edge (start/end, marginStart/End, paddingStart/End, borderStart*).
// Components therefore write NATURAL LTR layout and never reverse manually.
//
// ── The text-alignment contract (platform-verified against RN 0.81 source) ──
//
// 1. <Text> — `textAlign: 'left' | 'right'` is LOGICAL, not physical.
//    Fabric swaps left↔right whenever the text node's Yoga-resolved direction
//    is RTL (iOS: RCTAttributedTextUtils.mm; Android: TextLayoutManager.kt).
//    The swap is keyed on the CONTAINER `direction` style — NOT I18nManager.
//    ⇒ To start-align a <Text>, always write `textAlign` from this hook
//      (it is the constant logical-start value). To end-align, use
//      `textAlignEnd`. NEVER write `isRTL ? 'right' : 'left'` for a <Text> —
//      that renders on the WRONG side in Arabic (the old app-wide bug).
//
// 2. <TextInput> — textAlign is PHYSICAL. Inputs do NOT get the logical swap
//    (verified: ReactTextInputManager.kt maps left/right straight to gravity;
//    iOS TextInput props never populate the paragraph layoutDirection).
//    ⇒ For inputs, always use `inputTextAlign` from this hook.
//
// 3. Never reintroduce `row-reverse` or any isRTL-derived flip of
//    flexDirection / alignItems / alignSelf / start/end — those values are
//    already logical under the container direction (double-flip bug).
//
// 4. Horizontal scrollers (ScrollView/FlatList/FlashList with `horizontal`):
//    scroll-offset semantics stay physical-LTR even inside an RTL container,
//    so carousels/chip-strips break under inherited rtl. Use the helpers at
//    the bottom of this file (`ltrScrollContent` + `useRtlListOrder`) — see
//    docs/RTL.md for the recipe.
// ──────────────────────────────────────────────────────────

export type Direction = "rtl" | "ltr";

const IS_WEB = Platform.OS === "web";

/** Whether the given language code represents RTL content (Arabic). */
export const isContentRTL = (lang?: string | null): boolean =>
  !!lang && lang.startsWith("ar");

/**
 * PHYSICAL start-side text alignment for the given direction — for
 * <TextInput> only (inputs don't get RN's logical left/right swap).
 * For <Text>, use `textAlign` from `useDirection()` instead.
 */
export const resolveTextAlign = (rtl: boolean): "right" | "left" =>
  rtl ? "right" : "left";

/**
 * @deprecated Rows mirror via the container `direction` style now; just write
 * `flexDirection: 'row'`. Kept (always returns 'row') for backward-compat.
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
  /** The `direction` value to apply on a container/portal root subtree. */
  direction: Direction;
  /** @deprecated always 'row' — rows mirror via the container direction. */
  rowDirection: "row" | "row-reverse";
  /**
   * Logical START alignment for <Text>. Constant 'left' on native — RN swaps
   * it to the right edge inside an rtl container (see contract above).
   * NOT for <TextInput> — use `inputTextAlign` there.
   */
  textAlign: "right" | "left";
  /** Logical END alignment for <Text>. Constant 'right' on native. */
  textAlignEnd: "right" | "left";
  /** PHYSICAL start alignment for <TextInput> (inputs skip the logical swap). */
  inputTextAlign: "right" | "left";
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
    // Web CSS has no logical swap for left/right — use real logical keywords.
    textAlign: (IS_WEB ? "start" : "left") as "left",
    textAlignEnd: (IS_WEB ? "end" : "right") as "right",
    inputTextAlign: resolveTextAlign(isRTL),
  };
}

// ──────────────────────────────────────────────────────────
// Horizontal-scroller helpers
// ──────────────────────────────────────────────────────────
// A horizontal ScrollView/FlatList/FlashList inside an rtl container lays its
// children right-to-left, but contentOffset stays physical (0 = left edge), so
// the list mounts showing its LAST item and every `index * width` /
// `scrollTo({x})` computation addresses the mirrored item.
//
// Recipe: force the CONTENT container back to physical LTR with
// `ltrScrollContent`, and, when the item order should read right-to-left in
// Arabic (chip strips, "All"-first filters), feed it `useRtlListOrder(data)`.
// IMPORTANT: items with internal directional layout (rows, aligned text) must
// re-apply `direction` on their own root, since they now sit in an ltr subtree.

/** Spread into `contentContainerStyle` of every horizontal scroller. */
export const ltrScrollContent = { direction: "ltr" } as const;

/**
 * Reverses `data` when the app is RTL so a horizontal, LTR-forced list keeps
 * reading right-to-left in Arabic (first item at the right edge AND visible
 * at the initial scroll offset). Identity in LTR.
 */
export function useRtlListOrder<T>(data: readonly T[]): T[] {
  const { i18n } = useTranslation();
  const isRTL = isContentRTL(i18n.language);
  // Cheap enough for chip strips; avoids stale memo deps on array identity.
  return isRTL ? [...data].reverse() : ([...data] as T[]);
}
