import { describe, expect, it, vi } from "vitest";

import { ManagedClient } from "../lib/managed/client";
import type { ManagedAccount, UrgeEvent } from "../lib/types";

const account: ManagedAccount = {
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
  pendingStripeCheckoutSessionId: null,
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
  it("calls the default browser fetch with the global receiver", async () => {
    const originalFetch = globalThis.fetch;
    const fetchImpl = vi.fn(function (this: typeof globalThis) {
      expect(this).toBe(globalThis);
      return Promise.resolve(jsonResponse({
        challengeId: "challenge_123",
        expiresAt: "2026-05-20T11:00:00.000Z",
      }));
    }) as unknown as typeof fetch;

    vi.stubGlobal("fetch", fetchImpl);
    try {
      const result = await new ManagedClient({
        baseUrl: "https://managed.swan.test",
      }).startSigninOtp("5551234567");

      expect(result.challengeId).toBe("challenge_123");
      expect(vi.mocked(fetchImpl)).toHaveBeenCalledOnce();
      const [_url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
      expect(JSON.parse(String(init?.body))).toMatchObject({
        phoneNumber: "+15551234567",
        intent: "signin",
      });
    } finally {
      vi.stubGlobal("fetch", originalFetch);
    }
  });

  it("verifies OTP using browser device metadata", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        account: {
          userId: "user_123",
          name: "Danny Lee",
          email: "danny@example.com",
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
    }).verifySigninOtp({ challengeId: "challenge_123", code: "000000" });

    expect(result.account.eventIngestToken).toBe("ingest-token");
    const [_url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      challengeId: "challenge_123",
      code: "000000",
      intent: "signin",
      devicePlatform: "browser",
    });
  });

  it("verifies signup OTP with profile fields", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        account: {
          userId: "user_123",
          name: "Danny Lee",
          email: "danny@example.com",
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
    }).verifySignupOtp({
      challengeId: "challenge_123",
      code: "000000",
      name: "Danny Lee",
      email: "danny@example.com",
      phoneNumber: "+15551234567",
    });

    expect(result.account.email).toBe("danny@example.com");
    const [_url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      intent: "signup",
      name: "Danny Lee",
      email: "danny@example.com",
      phoneNumber: "+15551234567",
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

  it("creates Stripe checkout sessions with the user session token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        checkoutUrl: "https://checkout.stripe.test/session",
        providerSessionId: "cs_test_123",
      }),
    ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).createCheckout(account, {
      successUrl: "chrome-extension://swan/options.html?swanBilling=success",
      cancelUrl: "chrome-extension://swan/options.html?swanBilling=cancelled",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session");
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe("https://managed.swan.test/v1/billing/stripe/checkout");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer session-token",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      successUrl: "chrome-extension://swan/options.html?swanBilling=success",
      cancelUrl: "chrome-extension://swan/options.html?swanBilling=cancelled",
    });
  });

  it("refreshes an expired user session before retrying Stripe checkout", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid bearer token" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          account: {
            userId: "user_123",
            name: "Danny Lee",
            email: "danny@example.com",
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
          checkoutUrl: "https://checkout.stripe.test/session",
          providerSessionId: "cs_test_123",
        }),
      ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).createCheckoutWithSessionRefresh(account);

    expect(result.account.sessionToken).toBe("session-token-2");
    expect(result.account.eventIngestToken).toBe("ingest-token-2");
    expect(result.account.subscriptionStatus).toBe("active");
    expect(result.checkout.providerSessionId).toBe("cs_test_123");

    const refreshCall = vi.mocked(fetchImpl).mock.calls[1]!;
    expect(refreshCall[0]).toBe("https://managed.swan.test/v1/auth/session/refresh");
    expect(JSON.parse(String(refreshCall[1]?.body))).toEqual({
      refreshToken: "refresh-token",
      eventIngestToken: "ingest-token",
    });

    const retriedCheckout = vi.mocked(fetchImpl).mock.calls[2]!;
    expect(retriedCheckout[0]).toBe(
      "https://managed.swan.test/v1/billing/stripe/checkout",
    );
    expect(retriedCheckout[1]?.headers).toMatchObject({
      Authorization: "Bearer session-token-2",
    });
  });

  it("opens Stripe billing portal sessions with the user session token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        portalUrl: "https://billing.stripe.test/session",
      }),
    ) as unknown as typeof fetch;

    const result = await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).createPortal(account);

    expect(result.portalUrl).toBe("https://billing.stripe.test/session");
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe("https://managed.swan.test/v1/billing/stripe/portal");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer session-token",
    });
  });

  it("syncs Stripe checkout sessions with the user session token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ok: true,
        subscriptionStatus: "trialing",
        currentPeriodEnd: "2026-06-20T11:00:00.000Z",
      }),
    ) as unknown as typeof fetch;

    await new ManagedClient({
      baseUrl: "https://managed.swan.test",
      fetchImpl,
    }).syncCheckout(account, { providerSessionId: "cs_test_123" });

    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe("https://managed.swan.test/v1/billing/stripe/checkout/sync");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      Authorization: "Bearer session-token",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      providerSessionId: "cs_test_123",
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
            name: "Danny Lee",
            email: "danny@example.com",
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
    expect(result.account.entitlementActive).toBe(true);
    expect(result.account.subscriptionStatus).toBe("active");
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
