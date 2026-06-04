import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertCoordinator } from "../lib/alerts";
import { defaultSettings } from "../lib/defaults";
import type { CallProvider, ProviderResult, SmsProvider, UrgeEvent } from "../lib/types";

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
  smsStatus: { state: "pending" },
  callStatus: { state: "pending" },
};

describe("alert coordination", () => {
  beforeEach(() => {
    storage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts voice calls without Twilio SMS settings when SMS is disabled", async () => {
    storage.set("settings", {
      ...defaultSettings,
      phoneNumber: "+15551234567",
      smsEnabled: false,
      callEnabled: true,
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
      twilio: {
        accountSid: "",
        apiKeySid: "",
        clientSecret: "",
        fromNumber: "",
      },
    });
    storage.set("events", []);

    const smsProvider: SmsProvider = {
      send: vi.fn(),
    };
    const callProvider: CallProvider = {
      start: vi.fn(async () => ({ providerId: "conv_123" })),
    };

    const result = await new AlertCoordinator({
      smsProvider,
      callProvider,
    }).handle(event);

    expect(smsProvider.send).not.toHaveBeenCalled();
    expect(callProvider.start).toHaveBeenCalledOnce();
    expect(result.smsStatus).toEqual({
      state: "skipped",
      reason: "SMS disabled",
    });
    expect(result.callStatus).toEqual({
      state: "success",
      providerId: "conv_123",
    });
  });

  it("saves a pending event before provider delivery finishes", async () => {
    storage.set("settings", {
      ...defaultSettings,
      phoneNumber: "+15551234567",
      smsEnabled: false,
      callEnabled: true,
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
      twilio: {
        accountSid: "",
        apiKeySid: "",
        clientSecret: "",
        fromNumber: "",
      },
    });
    storage.set("events", []);

    let resolveCall: (value: { providerId: string }) => void = () => {};
    const callProvider: CallProvider = {
      start: vi.fn(
        () =>
          new Promise<ProviderResult>((resolve) => {
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

    resolveCall({ providerId: "conv_123" });
    await expect(started.completion).resolves.toMatchObject({
      callStatus: { state: "success", providerId: "conv_123" },
    });
    expect(storage.get("events")).toEqual([
      {
        ...event,
        smsStatus: { state: "skipped", reason: "SMS disabled" },
        callStatus: { state: "success", providerId: "conv_123" },
      },
    ]);
  });
});
