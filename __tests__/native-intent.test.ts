import { redirectSystemPath } from "@/app/+native-intent";

const go = (path: string) => redirectSystemPath({ path, initial: false });

describe("redirectSystemPath", () => {
  it("opens the chalet a web slug points at", () => {
    expect(
      go("https://sununo.app/ar/chalets/شاليه-الوردة-186f24c5-3845-4abd-9abe-f4ff8c7980f0"),
    ).toBe("/chalet-details/186f24c5-3845-4abd-9abe-f4ff8c7980f0");
  });

  it("works from either locale and from www", () => {
    const target = "/chalet-details/186f24c5-3845-4abd-9abe-f4ff8c7980f0";
    expect(go("https://sununo.app/en/chalets/rose-186F24C5-3845-4ABD-9ABE-F4FF8C7980F0")).toBe(target);
    expect(go("https://www.sununo.app/ar/chalets/x-186f24c5-3845-4abd-9abe-f4ff8c7980f0")).toBe(target);
  });

  it("survives a percent-encoded Arabic slug", () => {
    expect(
      go("https://sununo.app/ar/chalets/%D8%B4%D8%A7%D9%84%D9%8A%D9%87-186f24c5-3845-4abd-9abe-f4ff8c7980f0"),
    ).toBe("/chalet-details/186f24c5-3845-4abd-9abe-f4ff8c7980f0");
  });

  it("sends every other site URL to the home tab instead of +not-found", () => {
    expect(go("https://sununo.app/ar/cities/basra")).toBe("/");
    expect(go("https://sununo.app/ar/chalets")).toBe("/");
    expect(go("https://sununo.app/ar/legal/privacy")).toBe("/");
    expect(go("https://sununo.app/")).toBe("/");
  });

  it("leaves the app's own scheme and in-app paths untouched", () => {
    expect(go("sununo://chalet-details/abc")).toBe("sununo://chalet-details/abc");
    expect(go("/chalet-details/abc")).toBe("/chalet-details/abc");
    expect(go("/(customer)/wallet-transactions")).toBe("/(customer)/wallet-transactions");
  });

  it("passes an unparseable path through rather than throwing", () => {
    expect(go("::::")).toBe("::::");
  });
});
