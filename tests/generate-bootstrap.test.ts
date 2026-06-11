import { describe, expect, it } from "vitest";

// @ts-ignore The generator is a Node ESM script exercised directly in Vitest.
const { buildBootstrapFromConfig, parseConfig } = await import("../scripts/generate-bootstrap.mjs");

describe("generate-bootstrap", () => {
  it("builds bootstrap data from config yaml", () => {
    const config = parseConfig(`
phoneNumber: "+15551234567"
monitoringEnabled: true
callEnabled: true
elevenLabs:
  apiKey: "eleven-key"
  agentId: "agent-id"
  agentPhoneNumberId: "phnum_123"
trackedDomains:
  - https://www.example.com/path
  - example.com
`);

    const bootstrap = buildBootstrapFromConfig(
      config,
      new Date("2026-05-23T00:00:00.000Z"),
    );

    expect(bootstrap).toMatchObject({
      app: "swan",
      schemaVersion: 1,
      source: "config.yaml",
      generatedAt: "2026-05-23T00:00:00.000Z",
      data: {
        settings: {
          phoneNumber: "+15551234567",
          enabled: true,
          callEnabled: true,
          elevenLabs: {
            apiKey: "eleven-key",
            agentId: "agent-id",
            agentPhoneNumberId: "phnum_123",
          },
        },
        trackedDomains: ["example.com"],
      },
    });
  });

  it("rejects malformed tracked domains", () => {
    const config = parseConfig(`
trackedDomains:
  - "bad..domain"
`);

    expect(() => buildBootstrapFromConfig(config)).toThrow(
      "trackedDomains[0] is not a valid domain",
    );
  });

  it("ignores legacy SMS and Twilio config fields", () => {
    const config = parseConfig(`
smsEnabled: true
twilio:
  accountSid: "AC123"
  apiKeySid: "SK123"
  clientSecret: "secret"
  fromNumber: "+15550000000"
`);

    expect(buildBootstrapFromConfig(config).data).toEqual({});
  });
});
