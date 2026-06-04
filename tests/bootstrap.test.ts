import { describe, expect, it } from "vitest";

import { applyBootstrap, parseSwanBootstrap } from "../lib/bootstrap";
import { defaultSettings } from "../lib/defaults";
import type { DetectionRule } from "../lib/types";

const existingRule: DetectionRule = {
  id: "user:example.com",
  domain: "example.com",
  enabled: false,
  source: "user",
  createdAt: "2026-05-20T00:00:00.000Z",
};

describe("bootstrap import", () => {
  it("parses schema v1 bootstrap data", () => {
    const bootstrap = parseSwanBootstrap({
      app: "swan",
      schemaVersion: 1,
      source: "config.yaml",
      generatedAt: "2026-05-23T00:00:00.000Z",
      data: {
        settings: {
          phoneNumber: "+15551234567",
          enabled: true,
          elevenLabs: { agentId: "agent_123" },
        },
        trackedDomains: ["https://www.example.com/watch", "example.com"],
      },
    });

    expect(bootstrap.data.settings?.phoneNumber).toBe("+15551234567");
    expect(bootstrap.data.settings?.elevenLabs?.agentId).toBe("agent_123");
    expect(bootstrap.data.trackedDomains).toEqual(["example.com"]);
  });

  it("rejects unsupported bootstrap data", () => {
    expect(() =>
      parseSwanBootstrap({
        app: "swan",
        schemaVersion: 2,
        source: "config.yaml",
        generatedAt: "2026-05-23T00:00:00.000Z",
        data: {},
      }),
    ).toThrow("unsupported schema");
  });

  it("merges settings and enables configured domains", () => {
    const bootstrap = parseSwanBootstrap({
      app: "swan",
      schemaVersion: 1,
      source: "config.yaml",
      generatedAt: "2026-05-23T00:00:00.000Z",
      data: {
        settings: {
          phoneNumber: "+15551234567",
          elevenLabs: { apiKey: "eleven-key" },
        },
        trackedDomains: ["example.com", "new.example"],
      },
    });

    const result = applyBootstrap(
      defaultSettings,
      [existingRule],
      bootstrap,
      new Date("2026-05-23T00:00:00.000Z"),
    );

    expect(result.settings.phoneNumber).toBe("+15551234567");
    expect(result.settings.callEnabled).toBe(true);
    expect(result.settings.elevenLabs.apiKey).toBe("eleven-key");
    expect(result.addedRules).toBe(1);
    expect(result.updatedRules).toBe(1);
    expect(result.rules.map((rule) => [rule.domain, rule.enabled])).toEqual([
      ["new.example", true],
      ["example.com", true],
    ]);
  });

  it("ignores legacy SMS and Twilio fields in schema v1 data", () => {
    const bootstrap = parseSwanBootstrap({
      app: "swan",
      schemaVersion: 1,
      source: "config.yaml",
      generatedAt: "2026-05-23T00:00:00.000Z",
      data: {
        settings: {
          phoneNumber: "+15551234567",
          smsEnabled: true,
          twilio: { accountSid: "AC123", apiKeySid: "SK123" },
        },
      },
    });

    const result = applyBootstrap(defaultSettings, [], bootstrap);

    expect(result.settings).not.toHaveProperty("smsEnabled");
    expect(result.settings).not.toHaveProperty("twilio");
    expect(result.settings.phoneNumber).toBe("+15551234567");
  });
});
