import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// ── Stable per-install device id ──────────────────────────────────────────────
// Sent with every request as X-Device-Id so the backend can reconstruct a
// GUEST's journey (no user) and cross-reference a logged-in user's devices.
// This is an analytics identifier, not a security token — a non-crypto UUID is
// sufficient and keeps the app free of extra native dependencies.

const DEVICE_ID_KEY = "device-id";
let cachedDeviceId: string | null = null;
// The read is async, so the module-level cache alone cannot stop two callers that
// race before the first getItem resolves. Memoizing the in-flight promise makes
// every concurrent caller await the SAME read/generate/persist, so an install can
// never split into two X-Device-Id values (which would fork its analytics).
let inFlightDeviceId: Promise<string> | null = null;

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function readOrCreateDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable — fall back to an in-memory id so the session still groups.
    return uuidv4();
  }
}

/** Resolve (and lazily persist) the stable device id. Cached after first read. */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (!inFlightDeviceId) {
    inFlightDeviceId = readOrCreateDeviceId().then((id) => {
      cachedDeviceId = id;
      inFlightDeviceId = null;
      return id;
    });
  }
  return inFlightDeviceId;
}

/** Current app version (e.g. "2.1.1"), read from the native/app config. */
export function getAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    // @ts-ignore — older SDKs expose nativeAppVersion
    (Constants.nativeAppVersion as string | undefined) ??
    "unknown"
  );
}

/** Platform tag sent to the backend: "ios" | "android" | "web". */
export function getPlatform(): string {
  return Platform.OS;
}
