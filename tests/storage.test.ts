import { beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupLegacySmsData, getEvents, getSettings } from "../lib/storage";

const storage = vi.hoisted(() => new Map<string, unknown>());

vi.mock("wxt/browser", () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.entries(items).forEach(([key, value]) => storage.set(key, value));
        }),
      },
    },
  },
}));

describe("storage normalization", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("ignores legacy SMS and Twilio settings", async () => {
    storage.set("settings", {
      enabled: true,
      phoneNumber: "+15551234567",
      cooldownMinutes: 10,
      callEnabled: true,
      smsEnabled: true,
      twilio: {
        accountSid: "AC123",
        apiKeySid: "SK123",
        clientSecret: "secret",
        fromNumber: "+15550000000",
      },
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
    });

    const settings = await getSettings();

    expect(settings).not.toHaveProperty("smsEnabled");
    expect(settings).not.toHaveProperty("twilio");
    expect(settings.elevenLabs.agentId).toBe("agent_123");
  });

  it("cleans legacy SMS fields from stored settings and events", async () => {
    storage.set("settings", {
      enabled: true,
      phoneNumber: "+15551234567",
      cooldownMinutes: 10,
      callEnabled: true,
      smsEnabled: true,
      twilio: { accountSid: "AC123" },
      elevenLabs: { agentId: "agent_123" },
    });
    storage.set("events", [
      {
        id: "event:1",
        timestamp: "2026-05-20T10:00:00.000Z",
        domain: "example.com",
        ruleId: "rule:example",
        trigger: "navigation",
        smsStatus: { state: "success", providerId: "SM123" },
        callStatus: { state: "success", providerId: "conv_123" },
      },
    ]);

    await cleanupLegacySmsData();

    expect(storage.get("settings")).not.toHaveProperty("smsEnabled");
    expect(storage.get("settings")).not.toHaveProperty("twilio");
    expect(await getEvents()).toEqual([
      {
        id: "event:1",
        timestamp: "2026-05-20T10:00:00.000Z",
        domain: "example.com",
        ruleId: "rule:example",
        trigger: "navigation",
        callStatus: { state: "success", providerId: "conv_123" },
      },
    ]);
    expect(storage.get("events")).toEqual(await getEvents());
  });
});
