import { renderHook } from "@testing-library/react-native";
import { I18nManager } from "react-native";

// Must be `mock`-prefixed to be referenced inside jest.mock's factory.
let mockLang = "ar";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: mockLang } }),
}));

import { useDirection } from "@/i18n/direction";

describe("useDirection (contract v2)", () => {
  const originalRTL = I18nManager.isRTL;
  afterEach(() => {
    (I18nManager as any).isRTL = originalRTL;
  });

  it("reports RTL + direction 'rtl' for Arabic", () => {
    mockLang = "ar";
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(true);
    expect(result.current.direction).toBe("rtl");
    expect(result.current.rowDirection).toBe("row");
  });

  it("reports LTR + direction 'ltr' for English", () => {
    mockLang = "en";
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(false);
    expect(result.current.direction).toBe("ltr");
    expect(result.current.rowDirection).toBe("row");
  });

  it("textAlign/textAlignEnd are LOGICAL constants for <Text> (RN swaps left/right per container direction)", () => {
    // 'left' means START and 'right' means END inside a direction-driven
    // subtree — the same literal is correct in BOTH languages.
    mockLang = "ar";
    let { result } = renderHook(() => useDirection());
    expect(result.current.textAlign).toBe("left");
    expect(result.current.textAlignEnd).toBe("right");

    mockLang = "en";
    ({ result } = renderHook(() => useDirection()));
    expect(result.current.textAlign).toBe("left");
    expect(result.current.textAlignEnd).toBe("right");
  });

  it("inputTextAlign is the LOGICAL start side, identical to textAlign (v3)", () => {
    // Native RTL swaps left↔right for <TextInput> too, so inputs no longer need
    // their own physical value — 'left' is the start side in both languages.
    mockLang = "ar";
    let { result } = renderHook(() => useDirection());
    expect(result.current.inputTextAlign).toBe("left");
    expect(result.current.inputTextAlign).toBe(result.current.textAlign);

    mockLang = "en";
    ({ result } = renderHook(() => useDirection()));
    expect(result.current.inputTextAlign).toBe("left");
    expect(result.current.inputTextAlign).toBe(result.current.textAlign);
  });

  it("derives direction from the language ONLY — never from native I18nManager (no drift)", () => {
    // Arabic content while native manager claims LTR: direction must still be
    // 'rtl' and rowDirection must stay 'row' (the container mirrors; we never
    // reverse manually).
    mockLang = "ar";
    (I18nManager as any).isRTL = false;
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(true);
    expect(result.current.direction).toBe("rtl");
    expect(result.current.rowDirection).toBe("row");
  });
});
