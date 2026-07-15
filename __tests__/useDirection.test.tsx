import { renderHook } from "@testing-library/react-native";
import { I18nManager } from "react-native";

// Must be `mock`-prefixed to be referenced inside jest.mock's factory.
let mockLang = "ar";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: mockLang } }),
}));

import { useDirection } from "@/i18n/direction";

describe("useDirection", () => {
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
    expect(result.current.textAlign).toBe("right");
  });

  it("reports LTR + direction 'ltr' for English", () => {
    mockLang = "en";
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(false);
    expect(result.current.direction).toBe("ltr");
    expect(result.current.rowDirection).toBe("row");
    expect(result.current.textAlign).toBe("left");
  });

  it("derives direction from the language ONLY — never from native I18nManager (no drift)", () => {
    // Arabic content while native manager claims LTR: direction must still be 'rtl'
    // and rowDirection must stay 'row' (the container mirrors; we never reverse).
    mockLang = "ar";
    (I18nManager as any).isRTL = false;
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(true);
    expect(result.current.direction).toBe("rtl");
    expect(result.current.rowDirection).toBe("row");
  });
});
