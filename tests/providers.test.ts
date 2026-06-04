import { afterEach, describe, expect, it, vi } from "vitest";
import { ElevenLabsCallProvider } from "../lib/providers/elevenlabs";
import type { AlertContext } from "../lib/types";

const context: AlertContext = {
  event: {
    id: "event:1",
    timestamp: "2026-05-20T10:00:00.000Z",
    domain: "example.com",
    ruleId: "rule:example",
    trigger: "navigation",
    callStatus: { state: "pending" },
  },
  settings: {
    enabled: true,
    phoneNumber: "+15551234567",
    cooldownMinutes: 10,
    callEnabled: true,
    elevenLabs: {
      apiKey: "elevenlabs-key",
      agentId: "agent_123",
      agentPhoneNumberId: "phnum_123",
    },
  },
};

describe("provider request builders", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts ElevenLabs call with event metadata and opening variables", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
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
      swan_opening_message:
        "Stop. Stand up now. Close it, lock the screen, and step away.",
      swan_opening_style: "stop",
      swan_intervention_tone:
        "Direct, urgent, and serious. Interrupt fast without softening the instruction.",
    });
    expect(String(init.body)).not.toContain("/watch");
    expect(String(init.body)).not.toContain("private=true");
  });

  it("requires ElevenLabs call configuration before starting a call", async () => {
    const missingElevenLabsContext: AlertContext = {
      ...context,
      settings: {
        ...context.settings,
        elevenLabs: {
          ...context.settings.elevenLabs,
          agentPhoneNumberId: "",
        },
      },
    };

    await expect(
      new ElevenLabsCallProvider().start(missingElevenLabsContext),
    ).rejects.toThrow("ElevenLabs call is not configured");
  });
});
