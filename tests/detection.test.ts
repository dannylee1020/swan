import { describe, expect, it } from "vitest";
import { findMatchingRule, shouldAlert } from "../lib/detection";
import type { DetectionRule, UrgeEvent } from "../lib/types";

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

  it("suppresses repeat alerts inside cooldown", () => {
    const previous: UrgeEvent = {
      id: "event:1",
      timestamp: "2026-05-20T10:00:00.000Z",
      domain: "example.com",
      ruleId: rule.id,
      trigger: "navigation",
      smsStatus: { state: "success" },
      callStatus: { state: "success" },
    };

    expect(
      shouldAlert(
        { domain: "example.com", timestamp: "2026-05-20T10:05:00.000Z" },
        [previous],
        10,
      ),
    ).toBe(false);
    expect(
      shouldAlert(
        { domain: "example.com", timestamp: "2026-05-20T10:11:00.000Z" },
        [previous],
        10,
      ),
    ).toBe(true);
  });
});
