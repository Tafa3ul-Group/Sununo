import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

import { STORE_URLS } from "@/constants/links";

// The hook only needs the query result, and importing the real apiSlice would drag
// the whole store in; mock the two leaf dependencies instead.
jest.mock("@/store/api/apiSlice", () => ({
  useGetAppConfigQuery: jest.fn(),
}));
jest.mock("@/utils/device", () => ({
  getAppVersion: jest.fn(),
}));

import { useAppUpdate } from "@/hooks/use-app-update";
import { useGetAppConfigQuery } from "@/store/api/apiSlice";
import { getAppVersion } from "@/utils/device";

const mockQuery = useGetAppConfigQuery as unknown as jest.Mock;
const mockVersion = getAppVersion as unknown as jest.Mock;

/** Platform.OS is a getter on the RN module, so it must be redefined, not assigned. */
function setOS(os: string) {
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
}

type Partial = { latestVersion?: string | null; forceUpdate?: boolean; storeUrl?: string | null };

function config(ios: Partial | null, android: Partial | null = null): any {
  const fill = (p: Partial | null) =>
    p === null
      ? undefined
      : { latestVersion: null, forceUpdate: false, storeUrl: null, ...p };
  return { update: { ios: fill(ios), android: fill(android) } };
}

function render(data: any, version = "1.0.0") {
  mockQuery.mockReturnValue({ data });
  mockVersion.mockReturnValue(version);
  return renderHook(() => useAppUpdate()).result.current;
}

describe("useAppUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOS("ios");
  });

  afterAll(() => setOS("ios"));

  describe("before the config arrives", () => {
    it("is not ready and gates nothing when data is undefined", () => {
      const state = render(undefined, "1.2.3");
      expect(state.ready).toBe(false);
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
      expect(state.latestVersion).toBeNull();
      expect(state.currentVersion).toBe("1.2.3");
      // Still hands back a usable store link so the sheet can never open blank.
      expect(state.storeUrl).toBe(STORE_URLS.ios);
    });

    it("becomes ready as soon as any config object arrives, even without an update block", () => {
      const state = render({});
      expect(state.ready).toBe(true);
      expect(state.updateAvailable).toBe(false);
      expect(state.latestVersion).toBeNull();
    });

    it("treats a config missing the platform key entirely as no-update", () => {
      setOS("ios");
      // Backend rolled out android only: `update.ios` is absent.
      const state = render({ update: { android: { latestVersion: "9.9.9", forceUpdate: true, storeUrl: "x" } } });
      expect(state.ready).toBe(true);
      expect(state.latestVersion).toBeNull();
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
      expect(state.storeUrl).toBe(STORE_URLS.ios);
    });
  });

  describe("version comparison", () => {
    it("flags an update when the installed version is older", () => {
      const state = render(config({ latestVersion: "2.0.0" }), "1.9.9");
      expect(state.updateAvailable).toBe(true);
      expect(state.latestVersion).toBe("2.0.0");
    });

    it("does not flag an update when the versions are equal", () => {
      expect(render(config({ latestVersion: "2.1.1" }), "2.1.1").updateAvailable).toBe(false);
    });

    it("does not flag an update when the installed version is newer (TestFlight / dev build)", () => {
      expect(render(config({ latestVersion: "2.1.1" }), "2.2.0").updateAvailable).toBe(false);
    });

    it("compares segments numerically, not lexically", () => {
      expect(render(config({ latestVersion: "9.0.0" }), "10.0.0").updateAvailable).toBe(false);
      expect(render(config({ latestVersion: "10.0.0" }), "9.0.0").updateAvailable).toBe(true);
    });

    it("handles very large and zero-padded release numbers", () => {
      expect(render(config({ latestVersion: "999999999.0.0" }), "1.0.0").updateAvailable).toBe(true);
      expect(render(config({ latestVersion: "0.0.1" }), "0.0.0").updateAvailable).toBe(true);
      expect(render(config({ latestVersion: "0.0.0" }), "0.0.0").updateAvailable).toBe(false);
    });

    it("never prompts when latestVersion is null or empty", () => {
      const nullState = render(config({ latestVersion: null }), "1.0.0");
      expect(nullState.updateAvailable).toBe(false);
      expect(nullState.latestVersion).toBeNull();

      const emptyState = render(config({ latestVersion: "" }), "1.0.0");
      expect(emptyState.updateAvailable).toBe(false);
      // "" is falsy, so the ?? chain keeps it rather than collapsing to null.
      expect(emptyState.latestVersion).toBe("");
    });
  });

  describe("platform isolation", () => {
    it("reads the ios branch on ios and ignores android", () => {
      setOS("ios");
      const state = render(
        config(
          { latestVersion: "1.0.0", storeUrl: "https://ios.example" },
          { latestVersion: "9.9.9", forceUpdate: true, storeUrl: "https://android.example" },
        ),
        "1.0.0",
      );
      expect(state.latestVersion).toBe("1.0.0");
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
      expect(state.storeUrl).toBe("https://ios.example");
    });

    it("reads the android branch on android and ignores ios", () => {
      setOS("android");
      const state = render(
        config(
          { latestVersion: "9.9.9", forceUpdate: true, storeUrl: "https://ios.example" },
          { latestVersion: "1.0.0", storeUrl: "https://android.example" },
        ),
        "1.0.0",
      );
      expect(state.latestVersion).toBe("1.0.0");
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
      expect(state.storeUrl).toBe("https://android.example");
    });

    it("is a no-op on web and on any unknown platform", () => {
      for (const os of ["web", "windows", "macos"]) {
        setOS(os);
        const state = render(
          config({ latestVersion: "9.9.9", forceUpdate: true, storeUrl: "https://ios.example" }),
          "1.0.0",
        );
        expect(state).toEqual({
          ready: true,
          updateAvailable: false,
          isForced: false,
          storeUrl: "",
          currentVersion: "1.0.0",
          latestVersion: null,
        });
      }
    });
  });

  describe("forceUpdate", () => {
    it("marks the update forced when one is available and the admin flagged it", () => {
      const state = render(config({ latestVersion: "2.0.0", forceUpdate: true }), "1.0.0");
      expect(state.updateAvailable).toBe(true);
      expect(state.isForced).toBe(true);
    });

    it("does NOT force when there is no update to install (fail open)", () => {
      // Leaving forceUpdate on after a rollout must not trap users who are current.
      const current = render(config({ latestVersion: "2.0.0", forceUpdate: true }), "2.0.0");
      expect(current.updateAvailable).toBe(false);
      expect(current.isForced).toBe(false);

      const ahead = render(config({ latestVersion: "2.0.0", forceUpdate: true }), "3.0.0");
      expect(ahead.isForced).toBe(false);

      const noTarget = render(config({ latestVersion: null, forceUpdate: true }), "1.0.0");
      expect(noTarget.isForced).toBe(false);
    });

    it("requires a literal true — truthy junk from the API does not force", () => {
      const state = render(config({ latestVersion: "2.0.0", forceUpdate: "true" as any }), "1.0.0");
      expect(state.updateAvailable).toBe(true);
      expect(state.isForced).toBe(false);
    });

    it("does not force when forceUpdate is missing or false", () => {
      expect(render(config({ latestVersion: "2.0.0" }), "1.0.0").isForced).toBe(false);
      expect(
        render(config({ latestVersion: "2.0.0", forceUpdate: false }), "1.0.0").isForced,
      ).toBe(false);
    });
  });

  describe("unreadable installed version (the lock-everyone-out guard)", () => {
    it("never gates when getAppVersion() returns 'unknown', even with forceUpdate on", () => {
      const state = render(config({ latestVersion: "99.0.0", forceUpdate: true }), "unknown");
      expect(state.currentVersion).toBe("unknown");
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
      // The target is still reported so the UI can show it if it wants to.
      expect(state.latestVersion).toBe("99.0.0");
    });

    it("never gates on an empty or digit-less version string", () => {
      for (const version of ["", "   ", "vNext", "unknown", "--"]) {
        const state = render(config({ latestVersion: "99.0.0", forceUpdate: true }), version);
        expect(state.updateAvailable).toBe(false);
        expect(state.isForced).toBe(false);
      }
    });

    it("never gates on Arabic-Indic digits, which /\\d/ does not match", () => {
      // "١.٢.٣" carries no ASCII digit, so the guard fails open rather than
      // comparing a version it cannot parse.
      const state = render(config({ latestVersion: "99.0.0", forceUpdate: true }), "١.٢.٣");
      expect(state.updateAvailable).toBe(false);
      expect(state.isForced).toBe(false);
    });

    it("does gate on a version that contains at least one digit", () => {
      const state = render(config({ latestVersion: "2.0.0", forceUpdate: true }), "1.0.0-beta.3");
      expect(state.updateAvailable).toBe(true);
      expect(state.isForced).toBe(true);
    });
  });

  describe("storeUrl", () => {
    it("prefers the backend URL when present", () => {
      setOS("android");
      expect(render(config(null, { storeUrl: "https://play.example/app" })).storeUrl).toBe(
        "https://play.example/app",
      );
    });

    it("falls back to STORE_URLS when the backend value is null or empty", () => {
      setOS("ios");
      expect(render(config({ storeUrl: null })).storeUrl).toBe(STORE_URLS.ios);
      expect(render(config({ storeUrl: "" })).storeUrl).toBe(STORE_URLS.ios);

      setOS("android");
      expect(render(config(null, { storeUrl: null })).storeUrl).toBe(STORE_URLS.android);
      expect(render(config(null, { storeUrl: "" })).storeUrl).toBe(STORE_URLS.android);
    });

    it("keeps returning a store URL while an update is pending", () => {
      setOS("android");
      const state = render(config(null, { latestVersion: "5.0.0", forceUpdate: true }), "1.0.0");
      expect(state.isForced).toBe(true);
      expect(state.storeUrl).toBe(STORE_URLS.android);
    });
  });
});
