import {
  PRIVACY_POLICY_URL,
  STORE_URLS,
  SUPPORT_WHATSAPP,
  toWhatsAppNumber,
} from "@/constants/links";

const UUID_LIKE_DIGITS = /^\d+$/;

describe("toWhatsAppNumber", () => {
  it("converts a local Iraqi mobile to international format", () => {
    expect(toWhatsAppNumber("07712345678")).toBe("9647712345678");
  });

  it("accepts an already-international number with a leading +", () => {
    expect(toWhatsAppNumber("+9647712345678")).toBe("9647712345678");
  });

  it("strips the 00 international prefix", () => {
    expect(toWhatsAppNumber("009647712345678")).toBe("9647712345678");
  });

  it("leaves a bare 964… number unchanged", () => {
    expect(toWhatsAppNumber("9647712345678")).toBe("9647712345678");
  });

  it("adds the country code to a trunk-less local number", () => {
    expect(toWhatsAppNumber("7712345678")).toBe("9647712345678");
  });

  it("ignores separators, spaces and parentheses", () => {
    expect(toWhatsAppNumber("(0770) 123-4567")).toBe("9647701234567");
    expect(toWhatsAppNumber(" +964 771 234 5678 ")).toBe("9647712345678");
    expect(toWhatsAppNumber("0770.123.4567")).toBe("9647701234567");
  });

  it("falls back to the support number for empty / unusable input", () => {
    expect(toWhatsAppNumber(null)).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber(undefined)).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber()).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber("")).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber("   ")).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber("abc")).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber("+++")).toBe(SUPPORT_WHATSAPP);
  });

  it("keeps a foreign number that does not collide with the Iraqi prefix", () => {
    // US: no leading 0/7 and no 964, so it is returned as the caller typed it.
    expect(toWhatsAppNumber("+1 555 123 4567")).toBe("15551234567");
    expect(toWhatsAppNumber("+15551234567")).toBe("15551234567");
    // UK, via the 00 prefix.
    expect(toWhatsAppNumber("00447700900123")).toBe("447700900123");
  });

  it("always returns digits only, never a + or separators", () => {
    for (const raw of ["+9647712345678", "07712345678", "(0770) 123-4567"]) {
      expect(toWhatsAppNumber(raw)).toMatch(UUID_LIKE_DIGITS);
    }
  });

  it("handles absurdly long digit strings without throwing", () => {
    const long = "9".repeat(200);
    expect(() => toWhatsAppNumber(long)).not.toThrow();
    expect(toWhatsAppNumber(long)).toBe(long);
  });

  // Regression: "0" (and any input whose digits are only trunk zeros) used to
  // become "" and be returned as-is, producing a dead "wa.me/" link.
  it("falls back to support for a lone trunk zero", () => {
    expect(toWhatsAppNumber("0")).toBe(SUPPORT_WHATSAPP);
    expect(toWhatsAppNumber("00")).toBe(SUPPORT_WHATSAPP);
  });

  // Regression: a country code + trunk zero ("+964 0770 …") used to keep the
  // redundant 0 — the early `startsWith("964")` return skipped the trunk-zero
  // strip, leaving a 14-digit number WhatsApp cannot resolve.
  it("drops the trunk zero after the 964 country code", () => {
    expect(toWhatsAppNumber("+964 0770 123 4567")).toBe("9647701234567");
    expect(toWhatsAppNumber("0096407701234567")).toBe("9647701234567");
  });

  // Regression: any foreign number starting with 7 (Russia/Kazakhstan +7, and
  // every 00-stripped number beginning with 7) used to get "964" glued in
  // front, e.g. "+7 916 123 45 67" -> "96479161234567" — an undiallable
  // 14-digit number. The Iraqi prefix now only applies to 10-digit locals.
  it("does not prepend 964 to a foreign +7 number", () => {
    expect(toWhatsAppNumber("+79161234567")).toBe("79161234567");
  });

  // Regression: Arabic-Indic digits (٠١٢…) were stripped by /[^\d]/g, so a
  // number copied from an Arabic keyboard/contact silently resolved to the
  // support fallback instead of the intended contact.
  it("normalizes Arabic-Indic digits", () => {
    expect(toWhatsAppNumber("٠٧٧١٢٣٤٥٦٧٨")).toBe("9647712345678");
  });
});

describe("link constants", () => {
  it("exposes a well-formed https privacy policy URL", () => {
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\/[^\s]+$/);
    expect(() => new URL(PRIVACY_POLICY_URL)).not.toThrow();
    expect(new URL(PRIVACY_POLICY_URL).protocol).toBe("https:");
  });

  it("exposes well-formed https store URLs", () => {
    for (const url of Object.values(STORE_URLS)) {
      expect(url).toMatch(/^https:\/\/[^\s]+$/);
      expect(new URL(url).protocol).toBe("https:");
    }
    expect(new URL(STORE_URLS.android).hostname).toBe("play.google.com");
    expect(new URL(STORE_URLS.ios).hostname).toBe("apps.apple.com");
  });

  // BUG: the iOS fallback store URL is still the placeholder "id000000000",
  // so the in-app update sheet opens a 404 whenever the backend config
  // (GET /config -> update.ios.storeUrl) is missing or unreachable.
  // BLOCKED: the real numeric App Store ID exists nowhere in this repo
  // (app.json only carries bundleIdentifier "com.sununo.app"), and inventing
  // one would send users to somebody else's app — strictly worse than a 404.
  // Fill in STORE_URLS.ios from App Store Connect and flip this to it().
  it.failing("points at a real App Store listing id", () => {
    expect(STORE_URLS.ios).not.toMatch(/id0+$/);
  });

  it("keeps the support WhatsApp number in wa.me format", () => {
    expect(SUPPORT_WHATSAPP).toMatch(/^964\d{10}$/);
    // The fallback must survive its own normalizer untouched.
    expect(toWhatsAppNumber(SUPPORT_WHATSAPP)).toBe(SUPPORT_WHATSAPP);
  });
});
