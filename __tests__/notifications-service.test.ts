// Covers the token <-> backend contract in services/notifications.ts.
//
// The unregister path is the session-isolation fix: the device keeps the same
// Expo push token across accounts, so on logout the backend must be told to
// forget it — otherwise the next person to sign in on the phone keeps getting
// the previous user's booking notifications.

// The service only reads i18n for the Android channel label; mocking the barrel
// keeps i18next, AsyncStorage and the store out of this unit test (same pattern
// as __tests__/useFormatTime.test.tsx).
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    language: "ar",
    t: (_key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? _key,
    on: jest.fn(),
  },
}));

import {
  registerTokenWithBackend,
  unregisterTokenWithBackend,
} from "@/services/notifications";

const TOKEN = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";
const AUTH = "jwt-of-the-session-that-is-ending";

describe("services/notifications — backend token calls", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
  });

  const ok = () =>
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });

  describe("registerTokenWithBackend", () => {
    it("POSTs to /api/v1/notifications/expo-token with the bearer token", async () => {
      ok();

      const result = await registerTokenWithBackend(
        TOKEN,
        AUTH,
        "https://api.sununo.app",
      );

      expect(result).toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.sununo.app/api/v1/notifications/expo-token");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe(`Bearer ${AUTH}`);
      expect(JSON.parse(init.body).token).toBe(TOKEN);
    });

    it("strips trailing slashes from the base url", async () => {
      ok();
      await registerTokenWithBackend(TOKEN, AUTH, "https://api.sununo.app///");
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://api.sununo.app/api/v1/notifications/expo-token",
      );
    });
  });

  describe("unregisterTokenWithBackend", () => {
    it("DELETEs the same route with the token in the body", async () => {
      ok();

      const result = await unregisterTokenWithBackend(
        TOKEN,
        AUTH,
        "https://api.sununo.app",
      );

      expect(result).toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.sununo.app/api/v1/notifications/expo-token");
      expect(init.method).toBe("DELETE");
      expect(init.headers.Authorization).toBe(`Bearer ${AUTH}`);
      expect(JSON.parse(init.body)).toMatchObject({ token: TOKEN });
    });

    it("resolves false instead of throwing while the route is not deployed yet", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Cannot DELETE /api/v1/notifications/expo-token",
      });

      await expect(
        unregisterTokenWithBackend(TOKEN, AUTH, "https://api.sununo.app"),
      ).resolves.toBe(false);
    });

    it("swallows network errors — logout must never be blocked by it", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));

      await expect(
        unregisterTokenWithBackend(TOKEN, AUTH, "https://api.sununo.app"),
      ).resolves.toBe(false);
    });
  });
});
