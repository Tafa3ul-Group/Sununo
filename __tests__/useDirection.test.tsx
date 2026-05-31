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

  it("reports RTL for Arabic with matching native manager", () => {
    mockLang = "ar";
    (I18nManager as any).isRTL = true;
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(true);
    expect(result.current.rowDirection).toBe("row");
    expect(result.current.textAlign).toBe("right");
  });

  it("reports LTR for English with matching native manager", () => {
    mockLang = "en";
    (I18nManager as any).isRTL = false;
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(false);
    expect(result.current.rowDirection).toBe("row");
    expect(result.current.textAlign).toBe("left");
  });

  it("compensates with row-reverse during a language/manager mismatch", () => {
    // Arabic content selected but native manager not yet flipped (pre-reload)
    mockLang = "ar";
    (I18nManager as any).isRTL = false;
    const { result } = renderHook(() => useDirection());
    expect(result.current.isRTL).toBe(true);
    expect(result.current.rowDirection).toBe("row-reverse");
  });
});
