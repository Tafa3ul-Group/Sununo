import { renderHook } from "@testing-library/react-native";

// The hook only consumes `isRTL`; mocking the whole i18n barrel keeps i18next,
// AsyncStorage and the store out of this unit test.
jest.mock("@/i18n", () => ({ useDirection: jest.fn() }));

import { useDirection } from "@/i18n";
import { useFormatTime } from "@/hooks/useFormatTime";

const mockedUseDirection = useDirection as unknown as jest.Mock;

/** Renders the hook with a fixed direction and returns the formatter. */
const formatterFor = (isRTL: boolean) => {
  mockedUseDirection.mockReturnValue({ isRTL });
  const { result } = renderHook(() => useFormatTime());
  return result.current.formatShiftTime;
};

describe("useFormatTime / formatShiftTime", () => {
  beforeEach(() => {
    mockedUseDirection.mockReset();
  });

  describe("English (LTR)", () => {
    it("formats midnight as 12 AM", () => {
      expect(formatterFor(false)("00:00")).toBe("12:00 AM");
    });

    it("formats noon as 12 PM", () => {
      expect(formatterFor(false)("12:00")).toBe("12:00 PM");
    });

    it("formats an afternoon time in 12-hour form", () => {
      expect(formatterFor(false)("13:30")).toBe("1:30 PM");
    });

    it("keeps the leading zero on minutes but drops it from the hour", () => {
      expect(formatterFor(false)("09:05")).toBe("9:05 AM");
    });

    it("formats the last minute of the day", () => {
      expect(formatterFor(false)("23:59")).toBe("11:59 PM");
    });

    it("formats 11:59 as the last AM minute", () => {
      expect(formatterFor(false)("11:59")).toBe("11:59 AM");
    });

    it("formats 12:01 as PM (the >= 12 boundary)", () => {
      expect(formatterFor(false)("12:01")).toBe("12:01 PM");
    });
  });

  describe("Arabic (RTL)", () => {
    it("formats midnight with the Arabic ص marker", () => {
      expect(formatterFor(true)("00:00")).toBe("12:00 ص");
    });

    it("formats noon with the Arabic م marker", () => {
      expect(formatterFor(true)("12:00")).toBe("12:00 م");
    });

    it("formats an afternoon time with م", () => {
      expect(formatterFor(true)("13:30")).toBe("1:30 م");
    });

    it("keeps the leading zero on minutes in Arabic too", () => {
      expect(formatterFor(true)("09:05")).toBe("9:05 ص");
    });

    it("formats the last minute of the day with م", () => {
      expect(formatterFor(true)("23:59")).toBe("11:59 م");
    });
  });

  describe("input shapes", () => {
    it("drops the seconds from an HH:mm:ss value", () => {
      expect(formatterFor(false)("13:30:45")).toBe("1:30 PM");
      expect(formatterFor(true)("13:30:45")).toBe("1:30 م");
    });

    it("returns an empty string for undefined", () => {
      expect(formatterFor(false)(undefined)).toBe("");
      expect(formatterFor(true)(undefined)).toBe("");
    });

    it("returns an empty string when called with no argument at all", () => {
      expect(formatterFor(false)()).toBe("");
    });

    it("returns an empty string for an empty input", () => {
      expect(formatterFor(false)("")).toBe("");
      expect(formatterFor(true)("")).toBe("");
    });

    it("returns a colon-less value unchanged", () => {
      expect(formatterFor(false)("12")).toBe("12");
      expect(formatterFor(true)("noon")).toBe("noon");
    });

    it("formats a single-digit hour without a leading zero", () => {
      expect(formatterFor(false)("7:05")).toBe("7:05 AM");
    });

    it("passes the minutes segment through verbatim, whatever it contains", () => {
      // No validation on the minutes half — it is echoed as-is.
      expect(formatterFor(false)("10:xy")).toBe("10:xy AM");
    });
  });

  describe("out-of-range and malformed hours", () => {
    // "24:00" is a legal end-of-shift value meaning midnight; the hour is folded
    // to 0 before the meridiem decision, otherwise 24 >= 12 would render noon.
    it("formats 24:00 as midnight", () => {
      expect(formatterFor(false)("24:00")).toBe("12:00 AM");
      expect(formatterFor(true)("24:00")).toBe("12:00 ص");
    });

    it("silently wraps an out-of-range hour instead of rejecting it", () => {
      // 25 % 12 === 1 and 25 >= 12, so "25:00" becomes a plausible-looking
      // "1:00 PM". There is no range validation anywhere in the hook.
      expect(formatterFor(false)("25:00")).toBe("1:00 PM");
      expect(formatterFor(true)("25:00")).toBe("1:00 م");
    });

    it("keeps a negative hour visible rather than wrapping it (|| 12 never fires)", () => {
      // -1 % 12 === -1, which is truthy, so the negative survives into the UI.
      expect(formatterFor(false)("-1:30")).toBe("-1:30 AM");
    });

    // A non-numeric hour yields NaN, and `NaN % 12` is falsy enough for `|| 12`
    // to invent an hour — so the raw value is passed through instead, exactly
    // like the colon-less branch does.
    it("does not fabricate an hour for a non-numeric time", () => {
      expect(formatterFor(false)("ab:cd")).toBe("ab:cd");
      expect(formatterFor(true)("ab:cd")).toBe("ab:cd");
    });

    // Arabic-Indic digits are folded to ASCII before parsing, so "١٢:٣٠" is
    // recognised as noon rather than falling into the NaN path above.
    it("parses Arabic-Indic digits in the hour", () => {
      expect(formatterFor(true)("١٢:٣٠")).toBe("12:٣٠ م");
    });

    it("tolerates a leading-whitespace hour because parseInt skips it", () => {
      expect(formatterFor(false)(" 13:30")).toBe("1:30 PM");
    });

    it("parses a trailing-garbage hour up to the first non-digit", () => {
      // parseInt("13abc", 10) === 13 — no strictness here either.
      expect(formatterFor(false)("13abc:30")).toBe("1:30 PM");
    });
  });

  describe("memoization", () => {
    it("keeps the same formatter identity across re-renders with the same direction", () => {
      mockedUseDirection.mockReturnValue({ isRTL: true });
      const { result, rerender } = renderHook(() => useFormatTime());
      const first = result.current.formatShiftTime;

      rerender({});

      expect(result.current.formatShiftTime).toBe(first);
    });

    it("produces a new formatter (and new output) when the direction flips", () => {
      mockedUseDirection.mockReturnValue({ isRTL: true });
      const { result, rerender } = renderHook(() => useFormatTime());
      const arabic = result.current.formatShiftTime;
      expect(arabic("13:30")).toBe("1:30 م");

      mockedUseDirection.mockReturnValue({ isRTL: false });
      rerender({});

      expect(result.current.formatShiftTime).not.toBe(arabic);
      expect(result.current.formatShiftTime("13:30")).toBe("1:30 PM");
    });
  });
});
