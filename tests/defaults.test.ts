import { describe, expect, it } from "vitest";

import { defaultSettings, seedRules } from "../lib/defaults";

describe("default settings", () => {
  it("uses voice calls by default", () => {
    expect(defaultSettings.callEnabled).toBe(true);
  });

  it("ships enabled seed rules as an editable starting point", () => {
    expect(seedRules.length).toBeGreaterThan(0);
    expect(seedRules.every((rule) => rule.enabled)).toBe(true);
    expect(seedRules.every((rule) => rule.source === "seed")).toBe(true);
  });
});
