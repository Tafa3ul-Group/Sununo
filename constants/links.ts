// External links and contact info used across the app.

// Published privacy policy URL.
// NOTE: set this same URL in App Store Connect → App Information → Privacy Policy URL.
export const PRIVACY_POLICY_URL =
  "https://privacy-policy.dudes.studio/privacy?app=sununo";

// Store listing URLs used by the in-app update sheet. These are FALLBACKS only —
// the live URLs come from the backend config (GET /config → update[platform].storeUrl),
// so they can be changed without an app release. Update the iOS id once the app
// is live on the App Store.
export const STORE_URLS = {
  android: "https://play.google.com/store/apps/details?id=com.sununo.app",
  ios: "https://apps.apple.com/app/id000000000",
} as const;

// Support / admin WhatsApp number, used as a fallback for "Contact Us" when
// the backend /settings response does not provide an adminPhone.
// International format WITHOUT the leading "+" (used for wa.me links).
export const SUPPORT_WHATSAPP = "9647712684012";

// Normalize a phone number to international wa.me format (Iraq), no leading "+".
// "07712345678" -> "9647712345678", "+9647..." -> "9647...", empty -> fallback.
export function toWhatsAppNumber(raw?: string | null): string {
  let n = String(raw || "").replace(/[^\d]/g, "");
  if (!n) return SUPPORT_WHATSAPP;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("964")) return n;
  if (n.startsWith("0")) n = n.slice(1); // drop local trunk "0"
  if (n.startsWith("7")) n = "964" + n; // Iraqi mobile prefix
  return n;
}
