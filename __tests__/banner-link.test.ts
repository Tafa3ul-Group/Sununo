import {
  BannerLinkTarget,
  hasBannerLink,
  openBannerLink,
  resolveBannerLink,
} from "@/utils/banner-link";
import { router } from "expo-router";
import { Linking } from "react-native";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const push = router.push as jest.Mock;
let openURL: jest.SpyInstance;

beforeEach(() => {
  push.mockReset();
  openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
});

afterEach(() => {
  openURL.mockRestore();
});

const UUID = "9f8c1b4e-2a3d-4c5f-8b7a-1d2e3f4a5b6c";

/**
 * One table drives both `resolveBannerLink` and `hasBannerLink`, so the two can
 * never drift apart on any input.
 */
const CASES: Array<{ name: string; link?: string | null; expected: BannerLinkTarget | null }> = [
  // ---- nothing to open -------------------------------------------------
  { name: "undefined", link: undefined, expected: null },
  { name: "null", link: null, expected: null },
  { name: "empty string", link: "", expected: null },
  { name: "spaces only", link: "   ", expected: null },
  { name: "tabs and newlines only", link: "\n\t \r\n", expected: null },

  // ---- chalet UUIDs ----------------------------------------------------
  { name: "lowercase uuid", link: UUID, expected: { kind: "chalet", id: UUID } },
  {
    name: "uppercase uuid",
    link: UUID.toUpperCase(),
    expected: { kind: "chalet", id: UUID.toUpperCase() },
  },
  {
    name: "mixed-case uuid",
    link: "9F8c1B4e-2a3D-4c5F-8b7A-1d2E3f4A5b6C",
    expected: { kind: "chalet", id: "9F8c1B4e-2a3D-4c5F-8b7A-1d2E3f4A5b6C" },
  },
  {
    name: "uuid padded with whitespace",
    link: `  ${UUID}\n`,
    expected: { kind: "chalet", id: UUID },
  },

  // ---- near-miss UUIDs must NOT be treated as a chalet ------------------
  {
    // last segment is 11 chars instead of 12
    name: "uuid with a short final segment",
    link: "9f8c1b4e-2a3d-4c5f-8b7a-1d2e3f4a5b6",
    expected: { kind: "external", url: "https://9f8c1b4e-2a3d-4c5f-8b7a-1d2e3f4a5b6" },
  },
  {
    // first segment is 9 chars instead of 8
    name: "uuid with a long first segment",
    link: "9f8c1b4ee-2a3d-4c5f-8b7a-1d2e3f4a5b6c",
    expected: { kind: "external", url: "https://9f8c1b4ee-2a3d-4c5f-8b7a-1d2e3f4a5b6c" },
  },
  {
    // "g" is not a hex digit
    name: "uuid with a non-hex character",
    link: "9f8c1b4g-2a3d-4c5f-8b7a-1d2e3f4a5b6c",
    expected: { kind: "external", url: "https://9f8c1b4g-2a3d-4c5f-8b7a-1d2e3f4a5b6c" },
  },
  {
    name: "uuid wrapped in braces",
    link: `{${UUID}}`,
    expected: { kind: "external", url: `https://{${UUID}}` },
  },
  {
    name: "uuid with the dashes stripped",
    link: UUID.replace(/-/g, ""),
    expected: { kind: "external", url: `https://${UUID.replace(/-/g, "")}` },
  },

  // ---- internal routes -------------------------------------------------
  { name: "/search", link: "/search", expected: { kind: "route", path: "/search" } },
  {
    name: "/chalet-details/<id>",
    link: "/chalet-details/x",
    expected: { kind: "route", path: "/chalet-details/x" },
  },
  { name: "bare slash", link: "/", expected: { kind: "route", path: "/" } },
  {
    name: "route with a query string",
    link: "/search?city=بغداد&sort=price",
    expected: { kind: "route", path: "/search?city=بغداد&sort=price" },
  },
  {
    name: "route padded with whitespace",
    link: "  /search  ",
    expected: { kind: "route", path: "/search" },
  },

  // ---- external URLs (already carry a scheme) --------------------------
  { name: "https", link: "https://x.com", expected: { kind: "external", url: "https://x.com" } },
  { name: "http", link: "http://x.com", expected: { kind: "external", url: "http://x.com" } },
  {
    name: "mailto",
    link: "mailto:a@b.c",
    expected: { kind: "external", url: "mailto:a@b.c" },
  },
  {
    name: "tel",
    link: "tel:+9647701234567",
    expected: { kind: "external", url: "tel:+9647701234567" },
  },
  {
    name: "app deep link",
    link: "sununo://deep",
    expected: { kind: "external", url: "sununo://deep" },
  },
  {
    name: "uppercase scheme",
    link: "HTTPS://X.COM/Promo",
    expected: { kind: "external", url: "HTTPS://X.COM/Promo" },
  },
  {
    name: "scheme with + . - in it",
    link: "x-web+app.v2://open",
    expected: { kind: "external", url: "x-web+app.v2://open" },
  },
  {
    name: "https url padded with whitespace",
    link: "\t https://x.com/promo \n",
    expected: { kind: "external", url: "https://x.com/promo" },
  },

  // ---- bare hosts get a scheme prepended -------------------------------
  {
    name: "sununo.app",
    link: "sununo.app",
    expected: { kind: "external", url: "https://sununo.app" },
  },
  {
    name: "www.example.com",
    link: "www.example.com",
    expected: { kind: "external", url: "https://www.example.com" },
  },
  {
    name: "bare host with a path and query",
    link: "sununo.app/offers?x=1",
    expected: { kind: "external", url: "https://sununo.app/offers?x=1" },
  },
  {
    name: "arabic host",
    link: "شاليهات.عراق",
    expected: { kind: "external", url: "https://شاليهات.عراق" },
  },
  {
    name: "arabic path on a bare host",
    link: " سنونو.شبكة/عروض ",
    expected: { kind: "external", url: "https://سنونو.شبكة/عروض" },
  },
];

describe("resolveBannerLink", () => {
  it.each(CASES)("resolves $name", ({ link, expected }) => {
    expect(resolveBannerLink(link)).toEqual(expected);
  });

  it("keeps a very long bare host intact instead of truncating it", () => {
    const long = `${"a".repeat(5000)}.example.com`;
    expect(resolveBannerLink(long)).toEqual({ kind: "external", url: `https://${long}` });
  });

  it("returns a fresh object each call so callers cannot poison the next resolve", () => {
    const first = resolveBannerLink(UUID);
    const second = resolveBannerLink(UUID);
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  // BUG: a protocol-relative URL ("//host/path") starts with "/", so it is
  // classified as an internal route and pushed at the router, which has no such
  // route — the banner tap silently goes nowhere instead of opening the site.
  it("treats a protocol-relative URL as external, not as a route", () => {
    expect(resolveBannerLink("//cdn.sununo.app/promo")).toEqual({
      kind: "external",
      url: "https://cdn.sununo.app/promo",
    });
  });

  // BUG: SCHEME_RE matches the host of a bare "host:port" link ("example.com:"
  // is a syntactically valid scheme), so no "https://" is prepended and
  // Linking.openURL gets a URL the OS cannot open.
  it("prepends https:// to a bare host that carries a port", () => {
    expect(resolveBannerLink("example.com:8080/offers")).toEqual({
      kind: "external",
      url: "https://example.com:8080/offers",
    });
  });

  // BUG: `link?.trim()` throws a TypeError on any non-string value. `link`
  // comes straight off an untyped API payload and hasBannerLink runs inside
  // BannerSwiper's renderItem, so one malformed row takes down the home screen.
  it("returns null for a non-string link from a malformed payload", () => {
    expect(resolveBannerLink(42 as never)).toBeNull();
    expect(resolveBannerLink({} as never)).toBeNull();
  });
});

describe("hasBannerLink", () => {
  it.each(CASES)("agrees with resolveBannerLink on $name", ({ link, expected }) => {
    expect(hasBannerLink(link)).toBe(expected !== null);
  });

  it("is false for every flavour of blank", () => {
    expect([undefined, null, "", " ", " "].map((v) => hasBannerLink(v))).toEqual([
      false,
      false,
      false,
      false,
      // The last input is a non-breaking space: trim() counts U+00A0 as
      // whitespace, so a banner whose link is a stray NBSP stays inert.
      false,
    ]);
  });
});

describe("openBannerLink", () => {
  it("pushes the chalet details route for a UUID", () => {
    // Group segments are transparent in expo-router URLs, so this string
    // matches app/(customer)/chalet-details/[id].tsx — the same path every
    // other screen in the app pushes.
    expect(openBannerLink(UUID)).toBe(true);
    expect(push).toHaveBeenCalledWith(`/chalet-details/${UUID}`);
    expect(openURL).not.toHaveBeenCalled();
  });

  it("passes the UUID through verbatim, including its case and padding", () => {
    const upper = UUID.toUpperCase();
    expect(openBannerLink(`  ${upper}  `)).toBe(true);
    expect(push).toHaveBeenCalledWith(`/chalet-details/${upper}`);
  });

  it("pushes the raw path for an internal route", () => {
    expect(openBannerLink(" /search?city=بغداد ")).toBe(true);
    expect(push).toHaveBeenCalledWith("/search?city=بغداد");
  });

  it("opens an external URL through Linking", () => {
    expect(openBannerLink("https://x.com/promo")).toBe(true);
    expect(openURL).toHaveBeenCalledWith("https://x.com/promo");
    expect(push).not.toHaveBeenCalled();
  });

  it("adds the missing scheme before handing a bare host to Linking", () => {
    expect(openBannerLink("sununo.app")).toBe(true);
    expect(openURL).toHaveBeenCalledWith("https://sununo.app");
  });

  it("does nothing at all when there is no link", () => {
    expect(openBannerLink(undefined)).toBe(false);
    expect(openBannerLink(null)).toBe(false);
    expect(openBannerLink("")).toBe(false);
    expect(openBannerLink("   ")).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("returns false without throwing when pushing an admin-typed route fails", () => {
    push.mockImplementation(() => {
      throw new Error("No route named /nope exists");
    });
    expect(() => openBannerLink("/nope")).not.toThrow();
    expect(openBannerLink("/nope")).toBe(false);
  });

  it("swallows a rejected openURL instead of leaking an unhandled rejection", async () => {
    const unhandled = jest.fn();
    process.on("unhandledRejection", unhandled);
    openURL.mockReturnValue(Promise.reject(new Error("no activity found")) as never);

    expect(openBannerLink("sununo://deep")).toBe(true);

    // Let the rejection settle and give node a turn to report it.
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  // BUG: only the "route" branch guards router.push. A chalet banner tapped
  // before the root layout has mounted (or any other push throw) propagates out
  // of openBannerLink and crashes the home screen, which is exactly what the
  // route branch's try/catch exists to prevent.
  it("returns false instead of throwing when the chalet push fails", () => {
    push.mockImplementation(() => {
      throw new Error("Attempted to navigate before mounting the Root Layout");
    });
    expect(openBannerLink(UUID)).toBe(false);
  });
});
