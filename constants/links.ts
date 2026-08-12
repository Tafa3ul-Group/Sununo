// External links and contact info used across the app.

// Published privacy policy URL.
// NOTE: set this same URL in App Store Connect → App Information → Privacy Policy URL.
export const PRIVACY_POLICY_URL =
  "https://privacy-policy.dudes.studio/privacy?app=sununo";

// Store listing URLs used by the in-app update sheet. These are FALLBACKS only —
// the live URLs come from the backend config (GET /config → update[platform].storeUrl),
// so they can be changed without an app release. Update the iOS id once the app
// is live on the App Store.
// BUG: `ios` is still the placeholder id000000000 — it 404s whenever the
// backend config is missing/unreachable. BLOCKED on the real numeric App Store
// ID, which does not exist anywhere in this repo (app.json only has the bundle
// identifier). Guessing one would open the wrong app, which is worse than a
// 404, so it stays a placeholder until App Store Connect gives us the id.
export const STORE_URLS = {
  android: "https://play.google.com/store/apps/details?id=com.sununo.app",
  ios: "https://apps.apple.com/app/id000000000",
} as const;

// Support / admin WhatsApp number. FALLBACK only — the live number is set by
// the admin in the portal (الإعدادات العامة → رقم الدعم) and served by
// GET /config → adminPhone. Read it through `useSupportContact()`, never
// directly, so changing it in the portal doesn't need an app release.
// International format WITHOUT the leading "+" (used for wa.me links).
export const SUPPORT_WHATSAPP = "9647712684012";

// Arabic-Indic (٠-٩) and extended Arabic-Indic (۰-۹) digits map onto ASCII by a
// fixed code-point offset. Numbers pasted from an Arabic keyboard or a contact
// card arrive in these ranges, and /[^\d]/g would strip them to nothing — the
// user would silently be sent to the support number instead of their contact.
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

function toAsciiDigits(s: string): string {
  return s.replace(ARABIC_INDIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    const base = code <= 0x0669 ? 0x0660 : 0x06f0;
    return String(code - base);
  });
}

// An Iraqi subscriber number is exactly 10 digits starting with 7 (e.g.
// 7712345678). Anything else that happens to start with a 7 is a foreign
// number (+7 Russia/Kazakhstan) and must NOT get "964" glued in front.
const IRAQI_SUBSCRIBER = /^7\d{9}$/;

// Normalize a phone number to international wa.me format (Iraq), no leading "+".
// "07712345678" -> "9647712345678", "+9647..." -> "9647...", empty -> fallback.
export function toWhatsAppNumber(raw?: string | null): string {
  let n = toAsciiDigits(String(raw || "")).replace(/[^\d]/g, "");
  if (!n) return SUPPORT_WHATSAPP;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("964")) {
    // "+964 0770 …" — the trunk "0" is redundant after the country code and
    // leaves a number WhatsApp cannot resolve, so strip it here too.
    const rest = n.slice(3);
    return rest.startsWith("0") ? "964" + rest.slice(1) : n;
  }
  if (n.startsWith("0")) n = n.slice(1); // drop local trunk "0"
  if (IRAQI_SUBSCRIBER.test(n)) n = "964" + n; // Iraqi mobile prefix
  // Input that was nothing but trunk zeros ("0", "00") is now empty; returning
  // it would produce a dead "wa.me/" link, so fall back to support.
  return n || SUPPORT_WHATSAPP;
}
