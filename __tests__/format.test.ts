import {
  currencySymbol,
  formatDuration,
  formatPrice,
  getStartingPrice,
} from "@/utils/format";

describe("currencySymbol", () => {
  it("is the Iraqi dinar short form", () => {
    expect(currencySymbol).toBe("د.ع");
  });
});

describe("formatPrice — nullish and empty input", () => {
  it("returns '0' for null, undefined and empty string", () => {
    expect(formatPrice(null)).toBe("0");
    expect(formatPrice(undefined)).toBe("0");
    expect(formatPrice("")).toBe("0");
  });

  it("returns '0' for strings that are not numbers", () => {
    expect(formatPrice("abc")).toBe("0");
    expect(formatPrice("د.ع")).toBe("0");
    // Arabic-Indic digits are not parsed by parseFloat.
    expect(formatPrice("١٢٣٤")).toBe("0");
    expect(formatPrice(" ")).toBe("0");
  });

  it("returns '0' for NaN", () => {
    expect(formatPrice(NaN)).toBe("0");
  });
});

describe("formatPrice — thousand grouping", () => {
  it("leaves values under four digits untouched", () => {
    expect(formatPrice(0)).toBe("0");
    expect(formatPrice(1)).toBe("1");
    expect(formatPrice(12)).toBe("12");
    expect(formatPrice(999)).toBe("999");
  });

  it("groups at 4, 6, 7 and 10 digits", () => {
    expect(formatPrice(1234)).toBe("1,234");
    expect(formatPrice(123456)).toBe("123,456");
    expect(formatPrice(1234567)).toBe("1,234,567");
    expect(formatPrice(1234567890)).toBe("1,234,567,890");
  });

  it("formats realistic chalet prices", () => {
    expect(formatPrice(150000)).toBe("150,000");
    expect(formatPrice(1000000)).toBe("1,000,000");
  });

  it("groups negative numbers without eating the minus sign", () => {
    expect(formatPrice(-999)).toBe("-999");
    expect(formatPrice(-1234)).toBe("-1,234");
    expect(formatPrice(-1234567)).toBe("-1,234,567");
  });

  it("normalises -0 to '0'", () => {
    expect(formatPrice(-0)).toBe("0");
  });
});

describe("formatPrice — numeric strings", () => {
  it("parses numeric strings the same as numbers", () => {
    expect(formatPrice("1234")).toBe("1,234");
    expect(formatPrice("250000")).toBe("250,000");
    expect(formatPrice("0")).toBe("0");
    expect(formatPrice("-1234")).toBe("-1,234");
  });

  it("drops a trailing fractional zero because it parses through Number", () => {
    expect(formatPrice("12.30")).toBe("12.3");
  });

  it("parses the leading numeric prefix of a mixed string", () => {
    // parseFloat("1234abc") === 1234 — trailing junk is ignored, not rejected.
    expect(formatPrice("1234abc")).toBe("1,234");
  });
});

describe("formatPrice — decimals", () => {
  it("keeps a short fractional part intact", () => {
    expect(formatPrice(1234.5)).toBe("1,234.5");
    expect(formatPrice(0.5)).toBe("0.5");
    expect(formatPrice(1234.567)).toBe("1,234.567");
  });

  // Only the integer part is grouped; the fraction is re-attached untouched.
  it("does not insert separators inside the fractional part", () => {
    expect(formatPrice(12345.6789)).toBe("12,345.6789");
    expect(formatPrice(0.1234567)).toBe("0.1234567");
  });
});

describe("formatPrice — non-finite and very large values", () => {
  // ±Infinity must degrade to "0" like every other bad input instead of leaking
  // the literal word "Infinity" into the UI.
  it("degrades non-finite numbers to '0'", () => {
    expect(formatPrice(Infinity)).toBe("0");
    expect(formatPrice(-Infinity)).toBe("0");
  });

  // Number(1e21).toString() is "1e+21", which the digit-grouping regex cannot
  // handle — the value has to be expanded to plain digits first.
  it("groups numbers big enough to stringify exponentially", () => {
    expect(formatPrice(1e21)).toBe("1,000,000,000,000,000,000,000");
  });

  it("still groups the largest non-exponential integer range", () => {
    expect(formatPrice(1e20)).toBe("100,000,000,000,000,000,000");
  });

  // Re-formatting an already formatted string must not truncate it — parseFloat
  // stops at the comma, so the separators are stripped before parsing.
  it("is idempotent for an already formatted amount", () => {
    expect(formatPrice("1,234")).toBe("1,234");
  });
});

describe("formatPrice — currency suffix", () => {
  it("appends the dinar symbol when asked", () => {
    expect(formatPrice(1234, true)).toBe("1,234 د.ع");
    expect(formatPrice(0, true)).toBe(`0 ${currencySymbol}`);
    expect(formatPrice("250000", true)).toBe("250,000 د.ع");
  });

  it("omits the symbol by default", () => {
    expect(formatPrice(1234)).toBe("1,234");
    expect(formatPrice(1234, false)).toBe("1,234");
  });

  // The nullish/NaN fallbacks must keep the suffix too, otherwise the same
  // sentence reads "أرجعنا 0 د.ع" for 0 but "أرجعنا 0" for undefined.
  it("keeps the currency suffix on the zero fallback", () => {
    expect(formatPrice(undefined, true)).toBe("0 د.ع");
    expect(formatPrice(null, true)).toBe("0 د.ع");
    expect(formatPrice("", true)).toBe("0 د.ع");
    expect(formatPrice(NaN, true)).toBe("0 د.ع");
  });
});

describe("formatDuration — no limit", () => {
  it("treats zero and negatives as 'no limit'", () => {
    expect(formatDuration(0, true)).toBe("بدون مهلة");
    expect(formatDuration(0, false)).toBe("No limit");
    expect(formatDuration(-1, true)).toBe("بدون مهلة");
    expect(formatDuration(-90, false)).toBe("No limit");
  });

  it("treats NaN and Infinity as 'no limit'", () => {
    expect(formatDuration(NaN, true)).toBe("بدون مهلة");
    expect(formatDuration(NaN, false)).toBe("No limit");
    expect(formatDuration(Infinity, true)).toBe("بدون مهلة");
    expect(formatDuration(Infinity, false)).toBe("No limit");
    expect(formatDuration(-Infinity, false)).toBe("No limit");
  });
});

describe("formatDuration — Arabic", () => {
  it("formats sub-hour values in minutes", () => {
    expect(formatDuration(1, true)).toBe("1 دقيقة");
    expect(formatDuration(15, true)).toBe("15 دقيقة");
    expect(formatDuration(45, true)).toBe("45 دقيقة");
    expect(formatDuration(59, true)).toBe("59 دقيقة");
  });

  it("says 'نصف ساعة' only when there is no hour part", () => {
    expect(formatDuration(30, true)).toBe("نصف ساعة");
    // 90 minutes keeps the explicit "30 دقيقة" instead of the half-hour wording.
    expect(formatDuration(90, true)).toBe("ساعة و30 دقيقة");
    expect(formatDuration(150, true)).toBe("ساعتان و30 دقيقة");
  });

  it("uses the bare singular at one hour and the dual at exactly two", () => {
    expect(formatDuration(60, true)).toBe("ساعة");
    expect(formatDuration(120, true)).toBe("ساعتان");
  });

  it("joins hours and minutes with ' و'", () => {
    expect(formatDuration(61, true)).toBe("ساعة و1 دقيقة");
    expect(formatDuration(75, true)).toBe("ساعة و15 دقيقة");
    expect(formatDuration(135, true)).toBe("ساعتان و15 دقيقة");
    expect(formatDuration(135, true)).toContain(" و");
  });

  it("counts hours numerically past two", () => {
    // 11 and up take the singular again ("24 ساعة"); 3–10 take the small plural.
    expect(formatDuration(1440, true)).toBe("24 ساعة");
    expect(formatDuration(185, true)).toBe("3 ساعات و5 دقيقة");
  });

  // Arabic plural for 3–10 is "ساعات", not "ساعة".
  it("uses the Arabic small plural for 3–10 hours", () => {
    expect(formatDuration(180, true)).toBe("3 ساعات");
    expect(formatDuration(300, true)).toBe("5 ساعات");
  });
});

describe("formatDuration — English", () => {
  it("formats minutes only under an hour", () => {
    expect(formatDuration(15, false)).toBe("15m");
    expect(formatDuration(30, false)).toBe("30m");
    expect(formatDuration(45, false)).toBe("45m");
  });

  it("formats whole hours without a minutes part", () => {
    expect(formatDuration(60, false)).toBe("1h");
    expect(formatDuration(120, false)).toBe("2h");
    expect(formatDuration(1440, false)).toBe("24h");
  });

  it("joins hours and minutes with a single space", () => {
    expect(formatDuration(90, false)).toBe("1h 30m");
    expect(formatDuration(135, false)).toBe("2h 15m");
    expect(formatDuration(185, false)).toBe("3h 5m");
  });
});

describe("formatDuration — fractional minutes", () => {
  it("rounds the minutes part to the nearest whole minute", () => {
    expect(formatDuration(59.4, false)).toBe("59m");
    expect(formatDuration(0.6, false)).toBe("1m");
    expect(formatDuration(2.5, true)).toBe("3 دقيقة");
    expect(formatDuration(90.5, false)).toBe("1h 31m");
  });

  // Math.round(minutes % 60) can produce 60, which has to be carried into the
  // hours part — otherwise 59.6 minutes renders as "60m" instead of "1h".
  it("carries a rounded-up 60 minutes into the hours", () => {
    expect(formatDuration(59.6, false)).toBe("1h");
    expect(formatDuration(59.6, true)).toBe("ساعة");
    expect(formatDuration(119.9, false)).toBe("2h");
    expect(formatDuration(119.9, true)).toBe("ساعتان");
  });

  // A positive duration below half a minute rounds to 0 minutes and, with no
  // hours either, would join to an EMPTY string — the UI would show nothing.
  it("never renders an empty string for a positive duration", () => {
    expect(formatDuration(0.4, false)).not.toBe("");
    expect(formatDuration(0.4, true)).not.toBe("");
  });
});

describe("getStartingPrice — missing chalet", () => {
  it("returns '0' for null, undefined and an empty object", () => {
    expect(getStartingPrice(null)).toBe("0");
    expect(getStartingPrice(undefined)).toBe("0");
    expect(getStartingPrice({})).toBe("0");
  });
});

describe("getStartingPrice — API startingPrice", () => {
  it("prefers the API-provided starting price", () => {
    expect(getStartingPrice({ startingPrice: 150000 })).toBe("150,000");
    expect(getStartingPrice({ startingPrice: "250000" })).toBe("250,000");
  });

  it("wins over both the shifts fallback and the legacy price", () => {
    const chalet = {
      startingPrice: 90000,
      shifts: [{ pricing: [{ price: 50000 }] }],
      price: 30000,
    };
    expect(getStartingPrice(chalet)).toBe("90,000");
  });

  it("skips a zero or negative starting price and falls through", () => {
    expect(getStartingPrice({ startingPrice: 0, price: 75000 })).toBe("75,000");
    expect(getStartingPrice({ startingPrice: "0", price: 75000 })).toBe("75,000");
    expect(getStartingPrice({ startingPrice: -5, price: 75000 })).toBe("75,000");
    expect(getStartingPrice({ startingPrice: 0 })).toBe("0");
  });

  it("skips a non-numeric starting price", () => {
    expect(getStartingPrice({ startingPrice: "abc", price: 40000 })).toBe("40,000");
    expect(getStartingPrice({ startingPrice: {}, price: 40000 })).toBe("40,000");
    expect(getStartingPrice({ startingPrice: "" })).toBe("0");
  });
});

describe("getStartingPrice — shifts fallback", () => {
  it("takes the minimum price across all shifts", () => {
    const chalet = {
      shifts: [
        { pricing: [{ price: 100000 }, { price: 80000 }] },
        { pricing: [{ price: 120000 }] },
      ],
    };
    expect(getStartingPrice(chalet)).toBe("80,000");
  });

  it("excludes the <= 1 closed-day sentinel", () => {
    const chalet = { shifts: [{ pricing: [{ price: 1 }, { price: 0 }, { price: 90000 }] }] };
    expect(getStartingPrice(chalet)).toBe("90,000");
  });

  it("falls through to the legacy price when every shift price is a sentinel", () => {
    const chalet = { shifts: [{ pricing: [{ price: 1 }, { price: 0 }] }], price: 55000 };
    expect(getStartingPrice(chalet)).toBe("55,000");
  });

  it("returns '0' when every shift price is a sentinel and there is no legacy price", () => {
    expect(getStartingPrice({ shifts: [{ pricing: [{ price: 1 }] }] })).toBe("0");
    expect(getStartingPrice({ shifts: [{ pricing: [{ price: -3 }] }] })).toBe("0");
  });

  it("survives null shifts, null pricing and pricing rows without a price", () => {
    const chalet = {
      shifts: [null, undefined, { pricing: null }, {}, { pricing: [{}] }, { pricing: [{ price: 70000 }] }],
    };
    expect(getStartingPrice(chalet)).toBe("70,000");
  });

  it("ignores non-numeric shift prices but keeps numeric strings", () => {
    const chalet = { shifts: [{ pricing: [{ price: "abc" }, { price: "60000" }] }] };
    expect(getStartingPrice(chalet)).toBe("60,000");
  });

  it("falls through when every shift price is non-numeric", () => {
    const chalet = { shifts: [{ pricing: [{ price: "abc" }, { price: null }] }], price: 12000 };
    expect(getStartingPrice(chalet)).toBe("12,000");
  });

  it("ignores an empty shifts array and a non-array shifts value", () => {
    expect(getStartingPrice({ shifts: [], price: 44000 })).toBe("44,000");
    expect(getStartingPrice({ shifts: { pricing: [{ price: 5 }] }, price: 1200 })).toBe("1,200");
    expect(getStartingPrice({ shifts: [{ pricing: [] }], price: 33000 })).toBe("33,000");
  });
});

describe("getStartingPrice — legacy price", () => {
  it("uses the legacy single price as the last resort", () => {
    expect(getStartingPrice({ price: 99000 })).toBe("99,000");
    expect(getStartingPrice({ price: "1500000" })).toBe("1,500,000");
  });

  it("returns '0' for a zero, negative or missing legacy price", () => {
    expect(getStartingPrice({ price: 0 })).toBe("0");
    expect(getStartingPrice({ price: -10 })).toBe("0");
    expect(getStartingPrice({ price: null })).toBe("0");
    expect(getStartingPrice({ price: "abc" })).toBe("0");
  });

  // Card lists store the already-formatted "80,000" back onto `price`, and
  // Number("80,000") is NaN — a re-resolved chalet must not lose its price.
  it("still resolves a price that was already formatted", () => {
    expect(getStartingPrice({ price: "80,000" })).toBe("80,000");
  });
});
