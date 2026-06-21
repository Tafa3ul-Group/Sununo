import { isVersionOlder } from "@/utils/version";

describe("isVersionOlder", () => {
  it("is true when current is strictly older", () => {
    expect(isVersionOlder("2.1.0", "2.1.1")).toBe(true);
    expect(isVersionOlder("2.0.9", "2.1.0")).toBe(true);
    expect(isVersionOlder("1.9.9", "2.0.0")).toBe(true);
  });

  it("is false when current is equal or newer", () => {
    expect(isVersionOlder("2.1.1", "2.1.1")).toBe(false);
    expect(isVersionOlder("2.1.2", "2.1.1")).toBe(false);
    expect(isVersionOlder("3.0.0", "2.9.9")).toBe(false);
  });

  it("handles differing segment counts", () => {
    expect(isVersionOlder("2.1", "2.1.1")).toBe(true);
    expect(isVersionOlder("2.1.0", "2.1")).toBe(false);
    expect(isVersionOlder("2", "2.0.0")).toBe(false);
  });

  it("ignores pre-release / build suffixes by comparing numeric parts", () => {
    expect(isVersionOlder("2.1.0-beta.1", "2.1.1")).toBe(true);
    expect(isVersionOlder("2.1.1", "2.1.1-rc.1")).toBe(false);
  });

  it("never prompts without a valid target version", () => {
    expect(isVersionOlder("2.1.0", "")).toBe(false);
    expect(isVersionOlder("2.1.0", null)).toBe(false);
    expect(isVersionOlder("2.1.0", undefined)).toBe(false);
  });

  it("treats unknown current as oldest", () => {
    expect(isVersionOlder("unknown", "1.0.0")).toBe(true);
  });
});
