import { describe, expect, it, vi } from "vitest";

import {
  billingReturnDashboardPath,
  handleExternalBillingReturnMessage,
  isAllowedBillingReturnSender,
  isSwanExternalBillingMessage,
} from "../lib/billing-return";

describe("billing return bridge", () => {
  it("accepts Swan billing return messages", () => {
    expect(
      isSwanExternalBillingMessage({
        type: "SWAN_BILLING_RETURN",
        status: "success",
      }),
    ).toBe(true);
    expect(
      isSwanExternalBillingMessage({
        type: "SWAN_BILLING_RETURN",
        status: "unknown",
      }),
    ).toBe(false);
  });

  it("allows the configured managed API origin", () => {
    expect(
      isAllowedBillingReturnSender(
        "https://api.swan.test/v1/billing/stripe/return/success",
        "https://api.swan.test",
      ),
    ).toBe(true);
    expect(
      isAllowedBillingReturnSender(
        "https://evil.example/v1/billing/stripe/return/success",
        "https://api.swan.test",
      ),
    ).toBe(false);
  });

  it("allows localhost and 127.0.0.1 interchangeably for local testing", () => {
    expect(
      isAllowedBillingReturnSender(
        "http://localhost:8000/v1/billing/stripe/return/success",
        "http://127.0.0.1:8000",
      ),
    ).toBe(true);
  });

  it("opens the dashboard for valid external billing messages", async () => {
    const openDashboard = vi.fn(async () => {});

    const handled = await handleExternalBillingReturnMessage({
      managedApiBaseUrl: "http://127.0.0.1:8000",
      message: { type: "SWAN_BILLING_RETURN", status: "success" },
      senderUrl: "http://127.0.0.1:8000/v1/billing/stripe/return/success",
      openDashboard,
    });

    expect(handled).toBe(true);
    expect(openDashboard).toHaveBeenCalledWith("/options.html?swanBilling=success");
  });

  it("ignores valid message shapes from unknown origins", async () => {
    const openDashboard = vi.fn(async () => {});

    const handled = await handleExternalBillingReturnMessage({
      managedApiBaseUrl: "https://api.swan.test",
      message: { type: "SWAN_BILLING_RETURN", status: "cancelled" },
      senderUrl: "https://evil.example/return",
      openDashboard,
    });

    expect(handled).toBe(false);
    expect(openDashboard).not.toHaveBeenCalled();
  });

  it("builds the dashboard return path", () => {
    expect(billingReturnDashboardPath("cancelled")).toBe(
      "/options.html?swanBilling=cancelled",
    );
  });
});
