// The `@/i18n` barrel boots i18next against AsyncStorage on import, which the
// slider reaches transitively through <ThemedText>; swap it for the pure
// direction module the way the other component tests do.
jest.mock("@/i18n", () => jest.requireActual("@/i18n/direction"));

import { mirrorX } from "@/components/user/price-range-slider";

// `mirrorX` is the whole of the RTL story for the price slider: the thumbs,
// the fill anchor and the pan deltas are all expressed through it, so pinning
// its two directions down here covers the reversal bug without a render.
const USABLE = 300;

describe("mirrorX", () => {
  it("is the identity when the tree is not mirrored (LTR, and web)", () => {
    expect(mirrorX(0, USABLE, false)).toBe(0);
    expect(mirrorX(USABLE, USABLE, false)).toBe(USABLE);
    expect(mirrorX(75, USABLE, false)).toBe(75);
  });

  it("puts the cheap end on the RIGHT when mirrored", () => {
    expect(mirrorX(0, USABLE, true)).toBe(USABLE);
    expect(mirrorX(USABLE, USABLE, true)).toBe(0);
  });

  it("keeps the midpoint fixed and is its own inverse", () => {
    expect(mirrorX(USABLE / 2, USABLE, true)).toBe(USABLE / 2);
    expect(mirrorX(mirrorX(75, USABLE, true), USABLE, true)).toBe(75);
  });

  it("preserves the gap between the thumbs, so the fill keeps its width", () => {
    const low = 60;
    const high = 220;
    // Mirrored, the physical left edge is the HIGH thumb — which is why the
    // fill anchors off `highX` in RTL — but the span is unchanged.
    expect(mirrorX(high, USABLE, true)).toBeLessThan(mirrorX(low, USABLE, true));
    expect(mirrorX(low, USABLE, true) - mirrorX(high, USABLE, true)).toBe(
      high - low,
    );
  });
});
