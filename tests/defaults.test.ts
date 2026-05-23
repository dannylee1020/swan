import { describe, expect, it } from "vitest";

import { defaultSettings } from "../lib/defaults";

describe("default settings", () => {
  it("uses voice calls by default and leaves SMS opt-in", () => {
    expect(defaultSettings.callEnabled).toBe(true);
    expect(defaultSettings.smsEnabled).toBe(false);
  });
});
