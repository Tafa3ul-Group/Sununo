import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

// ──────────────────────────────────────────────────────────
// Direction model v3 — NATIVE RTL
// ──────────────────────────────────────────────────────────
// Native RTL (React Native's I18nManager) is ON for Arabic — see
// i18n/index.ts `syncNativeRTL`. The OPERATING SYSTEM mirrors the app, which is
// what v2's container-`direction` model could never do.
//
// Why we moved off v2: a `direction: 'rtl'` style only mirrors what Yoga lays
// out in JS. Everything the platform owns stayed LTR — the iOS back-swipe
// gesture, horizontal scroll offsets, native headers, Alert, the date picker,
// text-selection handles. v2 needed ~93 hand-written workarounds
// (`ltrScroller`, `ltrScrollContent`, `useRtlListOrder`, per-screen gesture and
// animation mirroring) to paper over what `forceRTL` does for free, and it
// still did not feel RTL. Under v3 all of those become no-ops.
//
// COST OF v3: changing language must RESTART the app (I18nManager only takes
// effect on a fresh native start). `changeLanguage` in i18n/index.ts handles
// that with a confirmation prompt.
//
// ── The rules ──
//
// 1. Write NATURAL LTR layout. `flexDirection: 'row'` and every LOGICAL edge
//    (start/end, marginStart/End, paddingStart/End, borderStart*) auto-mirror
//    under native RTL. NEVER hand-reverse with `row-reverse` or an isRTL
//    ternary — that double-flips.
//
// 2. `textAlign: 'left'` is the START side for BOTH <Text> and <TextInput>.
//    With `swapLeftAndRightInRTL` at its default ON, RN swaps left↔right for
//    both, so 'left' renders on the right in Arabic. Use `textAlign` from
//    `useDirection()` (constant 'left') and `textAlignEnd` for the end side.
//    NEVER write `isRTL ? 'right' : 'left'` — that renders on the WRONG side.
//
// 3. Horizontal scrollers need NOTHING. Native RTL mirrors scroll offsets, so
//    `ltrScroller` / `ltrScrollContent` / `useRtlListOrder` are retained as
//    NO-OPS purely so the ~80 existing call sites keep compiling. Do not add
//    new ones, and delete them opportunistically.
//
// 4. PHYSICAL left/right still mean physical. Reach for them only when a
//    subtree must stay LTR regardless of language (phone numbers, OTP boxes,
//    the Mapbox subtree) — and pin those with an explicit `direction: 'ltr'`.
// ──────────────────────────────────────────────────────────

export type Direction = "rtl" | "ltr";

const IS_WEB = Platform.OS === "web";

/** Whether the given language code represents RTL content (Arabic). */
export const isContentRTL = (lang?: string | null): boolean =>
  !!lang && lang.startsWith("ar");

/**
 * Start-side text alignment. Constant logical "left".
 *
 * Under native RTL (`I18nManager.isRTL`, with `swapLeftAndRightInRTL` left at
 * its default ON) React Native swaps left↔right for BOTH <Text> and
 * <TextInput>, so "left" is the start side in Arabic and the left side in
 * English. The `rtl` argument is ignored and kept only so existing call sites
 * keep compiling.
 *
 * Writing `rtl ? "right" : "left"` — what this used to do — double-flips under
 * native RTL and lands the text on the WRONG side.
 */
export const resolveTextAlign = (_rtl?: boolean): "right" | "left" => "left";

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
 *
 * ── The `string` return type is a hard guarantee, not a hint ────────────────
 * The API's own shape is `{ ar, en }`, and an admin is free to save either side
 * empty. Every hand-rolled `obj?.ar || obj` at a call site therefore fell
 * through the falsy `""` and handed back the WHOLE OBJECT. Reaching a native
 * string prop (`accessibilityLabel`) with that value throws a ClassCastException
 * inside Fabric's Android prop setter and takes down the entire surface — a
 * blank, frozen screen with no JS error to trace. So: never return `obj.name`
 * without proving it's a string first, and recurse when it isn't.
 */
const MAX_NEST = 3;

export const pickTranslation = (obj: any, rtl: boolean, depth = 0): string => {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return "";

  // Preferred language first, then the other one — a half-translated record
  // should still render a label rather than an empty string.
  const arabic = [obj.ar, obj.nameAr, obj.arName, obj.name_ar, obj.translation?.ar, obj.name_translation?.ar];
  const english = [obj.en, obj.nameEn, obj.enName, obj.name_en, obj.displayName, obj.display_name, obj.translation?.en];

  for (const value of rtl ? [...arabic, ...english] : [...english, ...arabic]) {
    if (typeof value === "string" && value) return value;
  }

  // `name` is the last resort, and on this API it is itself frequently an
  // `{ ar, en }` object (region.name, city.name, shift.name…) — so descend
  // into it instead of returning it.
  if (depth < MAX_NEST && obj.name != null && typeof obj.name === "object") {
    return pickTranslation(obj.name, rtl, depth + 1);
  }
  return typeof obj.name === "string" ? obj.name : "";
};

// ──────────────────────────────────────────────────────────
// React hook: the single API components should consume
// ──────────────────────────────────────────────────────────

export interface DirectionInfo {
  /** True when the active language is RTL (Arabic). */
  isRTL: boolean;
  /**
   * The active direction. Under v3 the OS already mirrors the whole tree, so
   * you do NOT apply this on ordinary containers — that double-flips. Use it
   * only to PIN a subtree that must stay LTR (`direction: 'ltr'`), or on web,
   * where there is no I18nManager.
   */
  direction: Direction;
  /** @deprecated always 'row' — rows mirror natively. */
  rowDirection: "row" | "row-reverse";
  /** START alignment. Constant 'left' — RN swaps it to the right in Arabic. */
  textAlign: "right" | "left";
  /** END alignment. Constant 'right' — RN swaps it to the left in Arabic. */
  textAlignEnd: "right" | "left";
  /**
   * START alignment for <TextInput>. Identical to `textAlign` under native RTL,
   * which swaps left/right for inputs too. Kept as its own field so the ~30
   * existing input call sites keep compiling.
   */
  inputTextAlign: "right" | "left";
}

/**
 * Single source of truth for direction in components. Derives everything from
 * `i18n.language`, which i18n/index.ts keeps in lockstep with I18nManager.
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
    inputTextAlign: (IS_WEB ? "start" : "left") as "left",
  };
}

// ──────────────────────────────────────────────────────────
// Horizontal-scroller helpers — NO-OPS under the native-RTL model (v3)
// ──────────────────────────────────────────────────────────
// These three existed only to undo v2's damage. Under v2 the container
// `direction: 'rtl'` style mirrored a horizontal list's CHILDREN while
// `contentOffset` stayed physical (0 = left edge), so the list mounted on its
// LAST item and `index * width` addressed the mirrored one. The fix was to
// force the scroller back to physical LTR and hand-reverse the data.
//
// Native RTL mirrors scroll offsets itself, so all of that is not just
// unnecessary — it is actively WRONG: pinning a scroller to `direction: 'ltr'`
// now un-mirrors a list the OS had already mirrored correctly, and reversing
// the data on top of that flips it a second time.
//
// They are kept as no-ops rather than deleted so the ~80 existing call sites
// keep compiling and can be removed gradually. Do not add new ones.

/** @deprecated No-op. Native RTL mirrors scroll offsets; remove the call site. */
export const ltrScroller = {} as const;

/** @deprecated No-op. Native RTL mirrors scroll offsets; remove the call site. */
export const ltrScrollContent = {} as const;

/**
 * Pins a subtree to physical LTR regardless of language. UNLIKE the deprecated
 * helpers above this is a real, deliberate opt-out — use it only where physical
 * left-to-right is genuinely correct:
 *
 *  • a paged carousel whose active index is derived from `contentOffset.x`.
 *    Native RTL flips those offset semantics, and it flips them DIFFERENTLY on
 *    iOS and Android, so `Math.round(x / pageWidth)` stops matching the visible
 *    page. Pinning keeps the arithmetic valid on both platforms.
 *  • content that is inherently LTR: phone numbers, OTP boxes, IBANs, the
 *    Mapbox subtree.
 *
 * Apply it to BOTH `style` and `contentContainerStyle` of a scroller, and
 * remember that children needing directional layout must re-apply `direction`
 * on their own root, since they now sit in an LTR subtree.
 */
export const pinLTR = { direction: "ltr" } as const;

/**
 * @deprecated Identity. Native RTL already lays a horizontal list out
 * right-to-left in Arabic and starts it at the correct end, so reversing the
 * data flips it back. Remove the call site.
 */
export function useRtlListOrder<T>(data: readonly T[]): T[] {
  return data as T[];
}
