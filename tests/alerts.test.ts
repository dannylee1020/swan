import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertCoordinator } from "../lib/alerts";
import { defaultSettings } from "../lib/defaults";
import type { CallProvider, SmsProvider, UrgeEvent } from "../lib/types";

const storage = new Map<string, unknown>();

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
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.entries(items).forEach(([key, value]) => storage.set(key, value));
          }),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
});
