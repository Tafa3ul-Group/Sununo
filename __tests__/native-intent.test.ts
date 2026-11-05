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

  describe("WhatsApp template buttons", () => {
    const ID = "3f1c9a2e-7b4d-4e8a-9c21-5d6f8a0b1e23";

    it("opens a booking on the renter's side by default", () => {
      expect(go(`https://sununo.app/b/${ID}`)).toBe(`/link?type=booking&id=${ID}&role=customer`);
    });

    it("opens a booking on the owner's side when the tail starts with o-", () => {
      expect(go(`https://sununo.app/b/o-${ID}`)).toBe(`/link?type=booking&id=${ID}&role=owner`);
    });

    it("opens a payout receipt on the side that requested it", () => {
      expect(go(`https://sununo.app/tx/${ID}`)).toBe(`/link?type=payout&id=${ID}&role=customer`);
      expect(go(`https://sununo.app/tx/o-${ID}`)).toBe(`/link?type=payout&id=${ID}&role=owner`);
    });

    it("always opens chalet management on the owner's side", () => {
      expect(go(`https://sununo.app/manage/${ID}`)).toBe(`/link?type=chalet&id=${ID}&role=owner`);
    });

    it("normalises case and ignores a trailing query", () => {
      expect(go(`https://www.sununo.app/b/O-${ID.toUpperCase()}?utm=wa`)).toBe(
        `/link?type=booking&id=${ID}&role=owner`,
      );
    });

    it("sends a button link without an id home rather than to a broken screen", () => {
      expect(go("https://sununo.app/b/-")).toBe("/");
      expect(go("https://sununo.app/tx")).toBe("/");
    });
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
