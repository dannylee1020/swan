import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElevenLabsCallProvider } from "../lib/providers/elevenlabs";
import { TwilioSmsProvider } from "../lib/providers/twilio";
import type { AlertContext } from "../lib/types";

const context: AlertContext = {
  event: {
    id: "event:1",
    timestamp: "2026-05-20T10:00:00.000Z",
    domain: "example.com",
    ruleId: "rule:example",
    trigger: "navigation",
    smsStatus: { state: "pending" },
    callStatus: { state: "pending" },
  },
  settings: {
    enabled: true,
    phoneNumber: "+15551234567",
    cooldownMinutes: 10,
    smsEnabled: true,
    callEnabled: true,
    twilio: {
      accountSid: "AC123",
      authToken: "token",
      fromNumber: "+15550000000",
    },
    elevenLabs: {
      apiKey: "elevenlabs-key",
      agentId: "agent_123",
      agentPhoneNumberId: "phnum_123",
    },
  },
};

describe("provider request builders", () => {
  beforeEach(() => {
    vi.stubGlobal("btoa", (value: string) =>
      Buffer.from(value, "binary").toString("base64"),
    );
  });

  it("sends Twilio SMS without full URL context", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sid: "SM123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(new TwilioSmsProvider().send(context)).resolves.toEqual({
      providerId: "SM123",
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(String(init.body)).toContain("example.com");
    expect(String(init.body)).not.toContain("/watch");
    expect(String(init.body)).not.toContain("private=true");
  });

  it("starts ElevenLabs call with event metadata only", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ conversation_id: "conv_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ElevenLabsCallProvider().start(context)).resolves.toEqual({
      providerId: "conv_123",
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    );
    expect(init.headers).toMatchObject({
      "xi-api-key": "elevenlabs-key",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init.body));
    expect(body.agent_id).toBe("agent_123");
    expect(body.agent_phone_number_id).toBe("phnum_123");
    expect(body.to_number).toBe("+15551234567");
    expect(body.conversation_initiation_client_data.dynamic_variables).toEqual({
      swan_event_id: "event:1",
      swan_detected_domain: "example.com",
      swan_detected_at: "2026-05-20T10:00:00.000Z",
    });
    expect(String(init.body)).not.toContain("/watch");
    expect(String(init.body)).not.toContain("private=true");
  });
});
