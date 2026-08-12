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

describe("resolveRowDirection — deprecated, always 'row'", () => {
  // Direction is now driven by the container `direction` style (native RTL is
  // permanently off), so rows are never reversed manually. resolveRowDirection
  // ignores its arguments and always returns plain "row".
  it("always returns 'row' regardless of arguments", () => {
    expect(resolveRowDirection(true, true)).toBe("row");
    expect(resolveRowDirection(true, false)).toBe("row");
    expect(resolveRowDirection(false, true)).toBe("row");
    expect(resolveRowDirection(false, false)).toBe("row");
    expect(resolveRowDirection()).toBe("row");
  });
});

describe("resolveTextAlign — LOGICAL start side (direction model v3)", () => {
  // Under native RTL with swapLeftAndRightInRTL at its default ON, RN swaps
  // left↔right for <Text> AND <TextInput>, so 'left' IS the start side in both
  // languages. The old v2 value (`rtl ? 'right' : 'left'`) double-flipped and
  // landed input text on the wrong side.
  it("is always the logical start side, whatever the argument", () => {
    expect(resolveTextAlign(true)).toBe("left");
    expect(resolveTextAlign(false)).toBe("left");
    expect(resolveTextAlign()).toBe("left");
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

  it("reads the API's own { ar, en } shape", () => {
    expect(pickTranslation({ ar: "شاليه", en: "Chalet" }, true)).toBe("شاليه");
    expect(pickTranslation({ ar: "شاليه", en: "Chalet" }, false)).toBe("Chalet");
  });

  it("descends into a nested `name` object rather than returning it", () => {
    expect(pickTranslation({ name: { ar: "بغداد", en: "Baghdad" } }, true)).toBe("بغداد");
    expect(pickTranslation({ name: { ar: "بغداد", en: "Baghdad" } }, false)).toBe("Baghdad");
  });

  it("falls back to the other language when the preferred one is blank", () => {
    expect(pickTranslation({ ar: "", en: "Chalet" }, true)).toBe("Chalet");
    expect(pickTranslation({ ar: "شاليه", en: "" }, false)).toBe("شاليه");
  });

  // The regression that blanked the Android app: `/banners` returns
  // `{ ar: "", en: "" }`, the old `obj?.ar || obj` handed the object to
  // `accessibilityLabel`, and Fabric's Android prop setter threw a
  // ClassCastException that killed the whole surface.
  it("NEVER returns a non-string, whatever the input", () => {
    const inputs: any[] = [
      { ar: "", en: "" },
      { name: { ar: "", en: "" } },
      { name: {} },
      { name: 42 },
      { title: { ar: "x" } },
      {},
      [],
      123,
      true,
    ];
    for (const input of inputs) {
      expect(typeof pickTranslation(input, true)).toBe("string");
      expect(typeof pickTranslation(input, false)).toBe("string");
    }
  });

  it("terminates on a self-referential object", () => {
    const loop: any = {};
    loop.name = loop;
    expect(typeof pickTranslation(loop, true)).toBe("string");
  });
});
