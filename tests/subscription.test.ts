import { describe, expect, it } from "vitest";

import { getManagedPlanDisplay } from "../lib/managed/subscription";
import type { ManagedAccount } from "../lib/types";

const account: ManagedAccount = {
  userId: "user_123",
  name: "Danny Lee",
  email: "danny@example.com",
  phoneNumber: "+15551234567",
  sessionToken: "session-token",
  eventIngestToken: "ingest-token",
  refreshToken: "refresh-token",
  expiresAt: "2026-05-20T11:00:00.000Z",
  entitlementActive: false,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  pendingStripeCheckoutSessionId: null,
};

describe("managed subscription display", () => {
  it("shows the free trial offer before checkout starts", () => {
    expect(getManagedPlanDisplay(account)).toEqual({
      headline: "7-day free trial",
      detail: "Then $9.99/month for hosted Managed calls.",
    });
  });

  it("shows trial status with the trial end date", () => {
    expect(
      getManagedPlanDisplay({
        ...account,
        entitlementActive: true,
        subscriptionStatus: "trialing",
        currentPeriodEnd: "2026-06-20T11:00:00.000Z",
      }),
    ).toEqual({
      headline: "On trial",
      detail: "Ends Jun 20, 2026.",
    });
  });

  it("shows trial status when the trial end date is unavailable", () => {
    expect(
      getManagedPlanDisplay({
        ...account,
        entitlementActive: true,
        subscriptionStatus: "trialing",
      }),
    ).toEqual({
      headline: "On trial",
      detail: "Trial is active.",
    });
  });

  it("shows active plan status", () => {
    expect(
      getManagedPlanDisplay({
        ...account,
        entitlementActive: true,
        subscriptionStatus: "active",
      }),
    ).toEqual({
      headline: "Plan active",
      detail: "$9.99/month for hosted Managed calls.",
    });
  });

  it("shows billing attention status", () => {
    expect(
      getManagedPlanDisplay({
        ...account,
        subscriptionStatus: "past_due",
      }),
    ).toEqual({
      headline: "Needs attention",
      detail: "Update your subscription to keep hosted Managed calls enabled.",
    });
  });
});
