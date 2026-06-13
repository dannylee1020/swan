import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertCoordinator } from "../lib/alerts";
import { defaultSettings } from "../lib/defaults";
import type { AlertStatus, CallProvider, UrgeEvent } from "../lib/types";

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

const event: UrgeEvent = {
  id: "event:voice-only",
  timestamp: "2026-05-20T10:00:00.000Z",
  domain: "example.com",
  ruleId: "rule:example",
  trigger: "navigation",
  callStatus: { state: "pending" },
};

describe("alert coordination", () => {
  beforeEach(() => {
    storage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts voice calls without SMS settings", async () => {
    storage.set("settings", {
      ...defaultSettings,
      phoneNumber: "+15551234567",
      callEnabled: true,
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
    });
    storage.set("events", []);

    const callProvider: CallProvider = {
      start: vi.fn(async () => ({
        state: "success" as const,
        providerId: "conv_123",
      })),
    };

    const result = await new AlertCoordinator({
      callProvider,
    }).handle(event);

    expect(callProvider.start).toHaveBeenCalledOnce();
    expect(result.callStatus).toEqual({
      state: "success",
      providerId: "conv_123",
    });
  });

  it("saves a pending event before provider delivery finishes", async () => {
    storage.set("settings", {
      ...defaultSettings,
      phoneNumber: "+15551234567",
      callEnabled: true,
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
    });
    storage.set("events", []);

    let resolveCall: (value: AlertStatus) => void = () => {};
    const callProvider: CallProvider = {
      start: vi.fn(
        () =>
          new Promise<AlertStatus>((resolve) => {
            resolveCall = resolve;
          }),
      ),
    };

    const started = await new AlertCoordinator({
      callProvider,
    }).start(event);

    expect(started.event).toBe(event);
    expect(storage.get("events")).toEqual([event]);
    expect(callProvider.start).toHaveBeenCalledOnce();

    resolveCall({ state: "success", providerId: "conv_123" });
    await expect(started.completion).resolves.toMatchObject({
      callStatus: { state: "success", providerId: "conv_123" },
    });
    expect(storage.get("events")).toEqual([
      {
        ...event,
        callStatus: { state: "success", providerId: "conv_123" },
      },
    ]);
  });

  it("starts BYOK delivery immediately for repeat detections", async () => {
    storage.set("settings", {
      ...defaultSettings,
      phoneNumber: "+15551234567",
      callEnabled: true,
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
    });
    storage.set("events", [
      {
        ...event,
        id: "event:previous",
        callStatus: { state: "success", providerId: "conv_previous" },
      },
    ]);

    const callProvider: CallProvider = {
      start: vi.fn(async () => ({
        state: "success" as const,
        providerId: "conv_123",
      })),
    };

    const result = await new AlertCoordinator({
      callProvider,
    }).handle(event);

    expect(callProvider.start).toHaveBeenCalledOnce();
    expect(result.callStatus).toEqual({
      state: "success",
      providerId: "conv_123",
    });
  });

  it("uses managed delivery for repeat detections", async () => {
    storage.set("settings", {
      ...defaultSettings,
      deliveryMode: "managed",
      managedAccount: {
        userId: "user_123",
        name: "Danny Lee",
        email: "danny@example.com",
        phoneNumber: "+15551234567",
        sessionToken: "session-token",
        eventIngestToken: "ingest-token",
        refreshToken: "refresh-token",
        expiresAt: "2026-05-20T11:00:00.000Z",
        entitlementActive: true,
        subscriptionStatus: "active",
        currentPeriodEnd: null,
      },
    });
    storage.set("events", [
      {
        ...event,
        id: "event:previous",
        callStatus: { state: "accepted", providerId: "delivery_1" },
      },
    ]);

    const callProvider: CallProvider = {
      start: vi.fn(async () => ({
        state: "success" as const,
        providerId: "conv_123",
      })),
    };
    const managedCallProvider: CallProvider = {
      start: vi.fn(async () => ({
        state: "accepted" as const,
        providerId: "delivery_2",
      })),
    };

    const result = await new AlertCoordinator({
      callProvider,
      managedCallProvider,
    }).handle(event);

    expect(callProvider.start).not.toHaveBeenCalled();
    expect(managedCallProvider.start).toHaveBeenCalledOnce();
    expect(result.callStatus).toEqual({
      state: "accepted",
      providerId: "delivery_2",
    });
  });
});
