import { describe, expect, it } from "vitest";
import { findMatchingRule } from "../lib/detection";
import type { DetectionRule } from "../lib/types";

const rule: DetectionRule = {
  id: "rule:example",
  domain: "example.com",
  enabled: true,
  source: "user",
  createdAt: "2026-05-20T00:00:00.000Z",
};

describe("detection", () => {
  it("finds a matching enabled rule from a full URL", () => {
    expect(
      findMatchingRule("https://media.example.com/watch/123?private=true", [rule]),
    ).toEqual({ domain: "media.example.com", rule });
  });

  it("ignores disabled rules", () => {
    expect(
      findMatchingRule("https://example.com", [{ ...rule, enabled: false }]),
    ).toBeNull();
  });

});
