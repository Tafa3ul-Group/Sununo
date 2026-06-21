import { Platform } from "react-native";

import { STORE_URLS } from "@/constants/links";
import { useGetAppConfigQuery } from "@/store/api/apiSlice";
import { getAppVersion } from "@/utils/device";
import { isVersionOlder } from "@/utils/version";

export interface AppUpdateState {
  /** Config has loaded at least once. */
  ready: boolean;
  /** Installed version is older than the store version for this platform. */
  updateAvailable: boolean;
  /** Update is available AND the admin flagged it mandatory for this platform. */
  isForced: boolean;
  /** Store URL to open (backend value, falling back to constants/links). */
  storeUrl: string;
  currentVersion: string;
  latestVersion: string | null;
}

/**
 * Reads the public /config version gate and compares it to the installed
 * version. Drives the in-app update sheet. A no-op on web / unknown platforms.
 */
export function useAppUpdate(): AppUpdateState {
  // refetchOnFocus (set on the apiSlice) keeps this fresh when the app
  // foregrounds, so flipping force-update in the portal reaches open apps.
  const { data } = useGetAppConfigQuery();
  const currentVersion = getAppVersion();

  const platform: "ios" | "android" | null =
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : null;

  if (!platform) {
    return {
      ready: !!data,
      updateAvailable: false,
      isForced: false,
      storeUrl: "",
      currentVersion,
      latestVersion: null,
    };
  }

  const cfg = data?.update?.[platform];
  const latestVersion = cfg?.latestVersion ?? null;
  // Fail open: if we can't read a real installed version (no digits → "unknown"),
  // never gate — a false "must update" the user can't escape is worse than a
  // missed prompt, and force-update would otherwise lock everyone out.
  const canCompare = /\d/.test(currentVersion);
  const updateAvailable = canCompare && isVersionOlder(currentVersion, latestVersion);
  const isForced = updateAvailable && cfg?.forceUpdate === true;
  const storeUrl = cfg?.storeUrl || STORE_URLS[platform];

  return {
    ready: !!data,
    updateAvailable,
    isForced,
    storeUrl,
    currentVersion,
    latestVersion,
  };
}
