import { describe, expect, it } from "vitest";

import {
  getReadinessState,
  getTestAlertBlockers,
  validatePhoneNumber,
} from "../entrypoints/options/readiness";
import { defaultSettings } from "../lib/defaults";
import type { DetectionRule, ManagedAccount, UrgeEvent } from "../lib/types";

const activeManagedAccount: ManagedAccount = {
  userId: "user_123",
  phoneNumber: "+15551234567",
  sessionToken: "session-token",
  eventIngestToken: "ingest-token",
  refreshToken: "refresh-token",
  expiresAt: "2026-06-20T11:00:00.000Z",
  entitlementActive: true,
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-07-20T11:00:00.000Z",
};

const enabledRule: DetectionRule = {
  id: "user:example.com:1",
  domain: "example.com",
  enabled: true,
  source: "user",
  createdAt: "2026-06-10T10:00:00.000Z",
};

const testEvent: UrgeEvent = {
  id: "event:test",
  timestamp: "2026-06-10T11:00:00.000Z",
  domain: "test.swan.local",
  ruleId: "test:manual",
  trigger: "navigation",
  callStatus: { state: "success", providerId: "conv_123" },
};

describe("options readiness", () => {
  it("blocks BYOK test alerts until local delivery settings are complete", () => {
    expect(getTestAlertBlockers(defaultSettings, false)).toEqual([
      "Enter a recipient number.",
      "Enter an ElevenLabs API key.",
      "Enter an ElevenLabs agent ID.",
      "Enter an ElevenLabs phone number ID.",
    ]);
  });

  it("treats managed delivery as ready when the build and entitlement are active", () => {
    const settings = {
      ...defaultSettings,
      deliveryMode: "managed" as const,
      callEnabled: true,
      enabled: true,
      managedAccount: activeManagedAccount,
    };

    const readiness = getReadinessState({
      events: [testEvent],
      managedApiConfigured: true,
      rules: [enabledRule],
      settings,
    });

    expect(readiness.summary).toBe("Ready");
    expect(readiness.blockers).toEqual([]);
    expect(readiness.items.find((item) => item.id === "last-test")?.value).toBe(
      "Success",
    );
  });

  it("warns about missing domains without blocking provider tests", () => {
    const settings = {
      ...defaultSettings,
      enabled: true,
      phoneNumber: "+15551234567",
      elevenLabs: {
        apiKey: "elevenlabs-key",
        agentId: "agent_123",
        agentPhoneNumberId: "phnum_123",
      },
    };

    const readiness = getReadinessState({
      events: [],
      managedApiConfigured: false,
      rules: [],
      settings,
    });

    expect(readiness.summary).toBe("Add tracked domains");
    expect(readiness.tone).toBe("warning");
    expect(readiness.blockers).toEqual([]);
  });

  it("validates phone inputs", () => {
    expect(validatePhoneNumber("555")).toBe("Phone number is too short.");
    expect(validatePhoneNumber("+1 (555) 123-4567")).toBeUndefined();
  });
});
