import { Platform } from "react-native";

// utils/device caches the id in a module-level variable, so every test loads a
// fresh copy of the module (and therefore a fresh AsyncStorage mock instance).
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
  },
}));

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type Storage = {
  getItem: jest.Mock;
  setItem: jest.Mock;
};

type DeviceModule = typeof import("@/utils/device");

function loadDevice() {
  jest.resetModules();
  const storage = require("@react-native-async-storage/async-storage")
    .default as Storage;
  const device = require("@/utils/device") as DeviceModule;
  return { storage, device };
}

function loadDeviceWithConstants(constants: unknown): DeviceModule {
  jest.resetModules();
  jest.doMock("expo-constants", () => ({ __esModule: true, default: constants }));
  return require("@/utils/device") as DeviceModule;
}

afterEach(() => {
  jest.dontMock("expo-constants");
});

describe("getDeviceId", () => {
  it("generates and persists a v4 uuid on first call", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockResolvedValueOnce(null);

    const id = await device.getDeviceId();

    expect(id).toMatch(UUID_V4);
    // Version nibble and RFC-4122 variant nibble.
    expect(id[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(id[19]);
    expect(storage.getItem).toHaveBeenCalledWith("device-id");
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith("device-id", id);
  });

  it("serves the cached id on later calls without touching storage again", async () => {
    const { storage, device } = loadDevice();

    const first = await device.getDeviceId();
    const second = await device.getDeviceId();
    const third = await device.getDeviceId();

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("reuses an id already in storage and never overwrites it", async () => {
    const { storage, device } = loadDevice();
    const stored = "11111111-2222-4333-8444-555555555555";
    storage.getItem.mockResolvedValue(stored);

    expect(await device.getDeviceId()).toBe(stored);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("returns a stored value verbatim even when it is not a uuid", async () => {
    // Legacy installs may hold anything the previous release wrote.
    const { storage, device } = loadDevice();
    storage.getItem.mockResolvedValue("جهاز-٢٠٢٤");

    expect(await device.getDeviceId()).toBe("جهاز-٢٠٢٤");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("treats an empty stored value as missing and regenerates", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockResolvedValue("");

    const id = await device.getDeviceId();

    expect(id).toMatch(UUID_V4);
    expect(storage.setItem).toHaveBeenCalledWith("device-id", id);
  });

  it("falls back to an in-memory id when getItem throws", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockRejectedValue(new Error("storage unavailable"));

    const id = await device.getDeviceId();

    expect(id).toMatch(UUID_V4);
    expect(storage.setItem).not.toHaveBeenCalled();
    // The fallback id is cached too, so the session stays groupable.
    expect(await device.getDeviceId()).toBe(id);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("does not reject when setItem throws", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockRejectedValue(new Error("disk full"));

    const id = await device.getDeviceId();

    expect(id).toMatch(UUID_V4);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    // Nothing was persisted, but the id stays stable for this process.
    expect(await device.getDeviceId()).toBe(id);
  });

  it("survives a storage layer that returns undefined instead of null", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockResolvedValue(undefined);

    const id = await device.getDeviceId();

    expect(id).toMatch(UUID_V4);
    expect(storage.setItem).toHaveBeenCalledWith("device-id", id);
  });

  it("produces a different id per install", async () => {
    const a = loadDevice();
    const b = loadDevice();

    expect(await a.device.getDeviceId()).not.toBe(await b.device.getDeviceId());
  });

  // getDeviceId memoizes the in-flight promise, so two callers that race before
  // the first getItem resolves share one read and one generated/persisted uuid.
  it("returns one id for concurrent callers", async () => {
    const { storage, device } = loadDevice();
    storage.getItem.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 0)),
    );

    const [first, second] = await Promise.all([
      device.getDeviceId(),
      device.getDeviceId(),
    ]);

    expect(first).toBe(second);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});

describe("getAppVersion", () => {
  it("reads expoConfig.version when present", async () => {
    const device = loadDeviceWithConstants({
      expoConfig: { version: "2.1.1" },
      nativeAppVersion: "9.9.9",
    });

    expect(device.getAppVersion()).toBe("2.1.1");
  });

  it("falls back to nativeAppVersion when expoConfig has no version", async () => {
    const device = loadDeviceWithConstants({
      expoConfig: {},
      nativeAppVersion: "1.4.0",
    });

    expect(device.getAppVersion()).toBe("1.4.0");
  });

  it("falls back to nativeAppVersion when expoConfig is null", async () => {
    const device = loadDeviceWithConstants({
      expoConfig: null,
      nativeAppVersion: "1.4.0",
    });

    expect(device.getAppVersion()).toBe("1.4.0");
  });

  it("returns 'unknown' when both sources are missing", async () => {
    const device = loadDeviceWithConstants({
      expoConfig: null,
      nativeAppVersion: undefined,
    });

    expect(device.getAppVersion()).toBe("unknown");
  });

  it("returns 'unknown' for an empty config object", async () => {
    const device = loadDeviceWithConstants({});

    expect(device.getAppVersion()).toBe("unknown");
  });

  it("keeps an empty-string version instead of falling through", async () => {
    // ?? only skips null/undefined, so "" is a legitimate (if useless) version.
    const device = loadDeviceWithConstants({
      expoConfig: { version: "" },
      nativeAppVersion: "1.4.0",
    });

    expect(device.getAppVersion()).toBe("");
  });
});

describe("getPlatform", () => {
  it("reports the react-native platform tag", async () => {
    const { device } = loadDevice();

    expect(device.getPlatform()).toBe(Platform.OS);
    expect(["ios", "android", "web", "windows", "macos"]).toContain(
      device.getPlatform(),
    );
  });
});
