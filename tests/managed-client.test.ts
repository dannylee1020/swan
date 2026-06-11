import { describe, expect, it, vi } from "vitest";

import { ManagedClient } from "../lib/managed/client";
import type { ManagedAccount, UrgeEvent } from "../lib/types";

const account: ManagedAccount = {
  userId: "user_123",
  phoneNumber: "+15551234567",
  sessionToken: "session-token",
  eventIngestToken: "ingest-token",
  refreshToken: "refresh-token",
  expiresAt: "2026-05-20T11:00:00.000Z",
  entitlementActive: true,
  subscriptionStatus: "active",
  currentPeriodEnd: null,
};

const event: UrgeEvent = {
  id: "event:managed",
  timestamp: "2026-05-20T10:00:00.000Z",
  domain: "example.com",
  ruleId: "rule:example",
  trigger: "navigation",
  callStatus: { state: "pending" },
};

describe("managed client", () => {
  it("verifies OTP using browser device metadata", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        account: {
          userId: "user_123",
          phoneNumber: "+15551234567",
          sessionToken: "session-token",
          eventIngestToken: "ingest-token",
        },
        refreshToken: "refresh-token",
        expiresAt: "2026-05-20T11:00:00.000Z",
      }),
    ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).verifyOtp({ challengeId: "challenge_123", code: "000000" });

    expect(result.account.eventIngestToken).toBe("ingest-token");
    const [_url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      challengeId: "challenge_123",
      code: "000000",
      devicePlatform: "browser",
    });
  });

  it("sends browser events with the event-ingest token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        callStatus: {
          state: "accepted",
          deliveryId: "delivery_123",
        },
      }),
    ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test/",
      fetchImpl,
    }).sendBrowserEvent(account, event);

    expect(result.callStatus).toEqual({
      state: "accepted",
      providerId: "delivery_123",
    });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe("https://managed.swan.test/v1/browser/events");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer ingest-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      eventId: "event:managed",
      timestamp: "2026-05-20T10:00:00.000Z",
      domain: "example.com",
      ruleId: "rule:example",
      trigger: "navigation",
    });
  });

  it("refreshes once when browser event ingest returns 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          account: {
            userId: "user_123",
            phoneNumber: "+15551234567",
            sessionToken: "session-token-2",
            eventIngestToken: "ingest-token-2",
          },
          refreshToken: "refresh-token-2",
          expiresAt: "2026-05-20T12:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          callStatus: {
            state: "accepted",
            deliveryId: "delivery_456",
          },
        }),
      ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).sendBrowserEvent(account, event);

    expect(result.account.eventIngestToken).toBe("ingest-token-2");
    expect(result.callStatus).toEqual({
      state: "accepted",
      providerId: "delivery_456",
    });
    expect(vi.mocked(fetchImpl)).toHaveBeenCalledTimes(3);
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}
