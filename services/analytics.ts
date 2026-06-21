/**
 * Firebase Analytics (Google Analytics 4) service
 *
 * ── Why this wrapper ────────────────────────────────────────────────────────
 * GA4 on mobile is implemented via Firebase Analytics. This module is a thin,
 * crash-safe wrapper around @react-native-firebase/analytics so that:
 *   • tracking never throws into the UI — every call is wrapped in try/catch
 *   • the app still runs if the native module is unavailable (Expo Go, Jest,
 *     web, or before the dev build is rebuilt) — calls become silent no-ops
 *     via the safe dynamic require below (mirrors services/notifications.ts)
 *   • events are echoed to the console in __DEV__ for quick debugging
 *
 * Uses the namespaced API (analytics().logEvent(...)). It can be migrated to
 * the modular API (getAnalytics/logEvent) later without touching call sites.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Safe dynamic require ──────────────────────────────────────────────────────
// Prevents a crash if the native module isn't present (Expo Go / Jest / web /
// pre-rebuild). Same pattern as services/notifications.ts.
let analyticsModule: (() => any) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  analyticsModule = require("@react-native-firebase/analytics").default;
} catch {
  if (__DEV__) {
    console.warn(
      "[Analytics] @react-native-firebase/analytics not available — tracking is a no-op until the dev build is rebuilt.",
    );
  }
}

function getAnalytics(): any | null {
  if (!analyticsModule) return null;
  try {
    return analyticsModule();
  } catch {
    return null;
  }
}

type Params = Record<string, any>;

// GA4 rejects null/undefined param values; strip them so events stay clean.
function sanitize(params?: Params): Params | undefined {
  if (!params) return undefined;
  const out: Params = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

// ── Generic event ────────────────────────────────────────────────────────────
export async function logEvent(name: string, params?: Params): Promise<void> {
  if (__DEV__) console.log(`[Analytics] ${name}`, params ?? "");
  const a = getAnalytics();
  if (!a) return;
  try {
    await a.logEvent(name, sanitize(params));
  } catch (e: any) {
    if (__DEV__) console.warn(`[Analytics] logEvent(${name}) failed:`, e?.message);
  }
}

// ── Screen view ──────────────────────────────────────────────────────────────
export async function logScreenView(
  screenName: string,
  screenClass?: string,
): Promise<void> {
  if (__DEV__) console.log(`[Analytics] screen_view: ${screenName}`);
  const a = getAnalytics();
  if (!a) return;
  try {
    await a.logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  } catch (e: any) {
    if (__DEV__) console.warn("[Analytics] logScreenView failed:", e?.message);
  }
}

// ── User identity ────────────────────────────────────────────────────────────
export async function setAnalyticsUserId(id: string | null): Promise<void> {
  const a = getAnalytics();
  if (!a) return;
  try {
    await a.setUserId(id);
  } catch (e: any) {
    if (__DEV__) console.warn("[Analytics] setUserId failed:", e?.message);
  }
}

/** setUserProperties accepts string | null values only — values are coerced. */
export async function setUserProps(
  props: Record<string, string | number | null | undefined>,
): Promise<void> {
  const a = getAnalytics();
  if (!a) return;
  try {
    const clean: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(props)) {
      clean[key] = value == null ? null : String(value);
    }
    await a.setUserProperties(clean);
  } catch (e: any) {
    if (__DEV__) console.warn("[Analytics] setUserProperties failed:", e?.message);
  }
}

// ── Consent / opt-out (ready for a future consent screen) ─────────────────────
export async function setAnalyticsCollectionEnabled(
  enabled: boolean,
): Promise<void> {
  const a = getAnalytics();
  if (!a) return;
  try {
    await a.setAnalyticsCollectionEnabled(enabled);
  } catch (e: any) {
    if (__DEV__) {
      console.warn("[Analytics] setAnalyticsCollectionEnabled failed:", e?.message);
    }
  }
}
