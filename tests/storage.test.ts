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
    expect(settings.deliveryMode).toBe("byok");
    expect(settings.managedAccount).toBeNull();
    expect(settings.elevenLabs.agentId).toBe("agent_123");
  });

  it("normalizes managed settings and accepted call statuses", async () => {
    storage.set("settings", {
      enabled: true,
      deliveryMode: "managed",
      callEnabled: true,
      managedAccount: {
        userId: "user_123",
        phoneNumber: "+15551234567",
        sessionToken: "session-token",
        eventIngestToken: "ingest-token",
        refreshToken: "refresh-token",
        expiresAt: "2026-05-20T11:00:00.000Z",
        entitlementActive: true,
        subscriptionStatus: "active",
        currentPeriodEnd: "2026-06-20T11:00:00.000Z",
      },
    });
    storage.set("events", [
      {
        id: "event:managed",
        timestamp: "2026-05-20T10:00:00.000Z",
        domain: "example.com",
        ruleId: "rule:example",
        trigger: "navigation",
        callStatus: { state: "accepted", providerId: "delivery_123" },
      },
    ]);

    const settings = await getSettings();

    expect(settings.deliveryMode).toBe("managed");
    expect(settings.managedAccount?.eventIngestToken).toBe("ingest-token");
    expect(await getEvents()).toEqual([
      {
        id: "event:managed",
        timestamp: "2026-05-20T10:00:00.000Z",
        domain: "example.com",
        ruleId: "rule:example",
        trigger: "navigation",
        callStatus: { state: "accepted", providerId: "delivery_123" },
      },
    ]);
  });

  it("drops incomplete managed account tokens", async () => {
    storage.set("settings", {
      deliveryMode: "managed",
      managedAccount: {
        userId: "user_123",
        phoneNumber: "+15551234567",
      },
    });

    const settings = await getSettings();

    expect(settings.deliveryMode).toBe("managed");
    expect(settings.managedAccount).toBeNull();
  });

  it("cleans legacy SMS fields from stored settings and events", async () => {
    storage.set("settings", {
      enabled: true,
      phoneNumber: "+15551234567",
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
