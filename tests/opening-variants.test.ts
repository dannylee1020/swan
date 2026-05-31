import { describe, expect, it } from "vitest";
import { openingVariants, selectOpeningVariant } from "../lib/opening-variants";

describe("opening variants", () => {
  it("keeps every curated variant usable", () => {
    expect(openingVariants.length).toBeGreaterThan(0);

    for (const variant of openingVariants) {
      expect(variant.style).not.toBe("");
      expect(variant.message).not.toBe("");
      expect(variant.tone).not.toBe("");
      expect(variant.weight).toBeGreaterThan(0);
    }
  });

  it("selects variants from deterministic weighted random values", () => {
    expect(selectOpeningVariant(0).style).toBe("stop");
    expect(selectOpeningVariant(0.3).style).toBe("cycle");
    expect(selectOpeningVariant(0.6).style).toBe("worth");
    expect(selectOpeningVariant(0.99).style).toBe("reset");
  });

  it("clamps out-of-range random values", () => {
    expect(selectOpeningVariant(-1).style).toBe("stop");
    expect(selectOpeningVariant(Number.NaN).style).toBe("stop");
    expect(selectOpeningVariant(1).style).toBe("reset");
  });
});
