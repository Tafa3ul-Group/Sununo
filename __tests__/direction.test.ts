import {
  isContentRTL,
  pickTranslation,
  resolveRowDirection,
  resolveTextAlign,
} from "@/i18n/direction";

describe("isContentRTL", () => {
  it("treats Arabic as RTL", () => {
    expect(isContentRTL("ar")).toBe(true);
    expect(isContentRTL("ar-IQ")).toBe(true);
  });

  it("treats English / others as LTR", () => {
    expect(isContentRTL("en")).toBe(false);
    expect(isContentRTL("en-US")).toBe(false);
    expect(isContentRTL("fr")).toBe(false);
  });

  it("handles missing language safely", () => {
    expect(isContentRTL(undefined)).toBe(false);
    expect(isContentRTL(null)).toBe(false);
    expect(isContentRTL("")).toBe(false);
  });
});

describe("resolveRowDirection — guards against double-flip", () => {
  // When content direction matches the native manager, RN's auto-flip already
  // does the right thing, so we must use plain "row" (NOT row-reverse).
  it('returns "row" when content matches the manager', () => {
    expect(resolveRowDirection(true, true)).toBe("row"); // RTL content, RTL device
    expect(resolveRowDirection(false, false)).toBe("row"); // LTR content, LTR device
  });

  // When they differ (transient state right after a language switch, before
  // the native reload), we compensate with "row-reverse".
  it('returns "row-reverse" when content differs from the manager', () => {
    expect(resolveRowDirection(true, false)).toBe("row-reverse");
    expect(resolveRowDirection(false, true)).toBe("row-reverse");
  });
});

describe("resolveTextAlign", () => {
  it("aligns RTL content right and LTR content left", () => {
    expect(resolveTextAlign(true)).toBe("right");
    expect(resolveTextAlign(false)).toBe("left");
  });
});

describe("pickTranslation", () => {
  it("returns empty string for nullish input", () => {
    expect(pickTranslation(null, true)).toBe("");
    expect(pickTranslation(undefined, false)).toBe("");
  });

  it("passes through plain strings", () => {
    expect(pickTranslation("hello", true)).toBe("hello");
    expect(pickTranslation("hello", false)).toBe("hello");
  });

  it("picks Arabic fields when RTL", () => {
    expect(pickTranslation({ nameAr: "شاليه", nameEn: "Chalet" }, true)).toBe("شاليه");
    expect(pickTranslation({ name_ar: "شاليه", name_en: "Chalet" }, true)).toBe("شاليه");
    expect(pickTranslation({ translation: { ar: "نص" } }, true)).toBe("نص");
    expect(pickTranslation({ name_translation: { ar: "نص" } }, true)).toBe("نص");
  });

  it("picks English fields when LTR", () => {
    expect(pickTranslation({ nameAr: "شاليه", nameEn: "Chalet" }, false)).toBe("Chalet");
    expect(pickTranslation({ name_ar: "شاليه", name_en: "Chalet" }, false)).toBe("Chalet");
    expect(pickTranslation({ displayName: "Disp" }, false)).toBe("Disp");
    expect(pickTranslation({ display_name: "Disp" }, false)).toBe("Disp");
  });

  it("falls back to `name` when localized fields are absent", () => {
    expect(pickTranslation({ name: "Fallback" }, true)).toBe("Fallback");
    expect(pickTranslation({ name: "Fallback" }, false)).toBe("Fallback");
  });
});
