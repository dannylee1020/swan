import type { ManagedAccount } from "../types";

const MANAGED_PLAN_TRIAL = "7-day free trial";
const MANAGED_PLAN_PRICE = "$9.99/month";

export type ManagedPlanDisplay = {
  headline: string;
  detail: string;
};

export function hasActiveManagedSubscription(
  account: ManagedAccount | null | undefined,
): boolean {
  return Boolean(
    account?.entitlementActive &&
      isManagedSubscriptionStatusActive(account.subscriptionStatus),
  );
}

export function isManagedSubscriptionStatusActive(
  status: string | null | undefined,
): boolean {
  return status === "active" || status === "trialing";
}

export function getManagedPlanDisplay(account: ManagedAccount): ManagedPlanDisplay {
  const status = account.subscriptionStatus;

  if (status === "trialing") {
    return {
      headline: "On trial",
      detail: account.currentPeriodEnd
        ? `Ends ${formatManagedPlanDate(account.currentPeriodEnd)}.`
        : "Trial is active.",
    };
  }

  if (status === "active") {
    return {
      headline: "Plan active",
      detail: `${MANAGED_PLAN_PRICE} for hosted Managed calls.`,
    };
  }

  if (requiresBillingAttention(status)) {
    return {
      headline: "Needs attention",
      detail: "Update your subscription to keep hosted Managed calls enabled.",
    };
  }

  if (status === "canceled" || status === "incomplete_expired") {
    return {
      headline: "Plan ended",
      detail: "Start a new subscription to enable hosted Managed calls.",
    };
  }

  if (status) {
    return {
      headline: formatSubscriptionStatus(status),
      detail: "Refresh or update billing to confirm hosted Managed call access.",
    };
  }

  return {
    headline: MANAGED_PLAN_TRIAL,
    detail: `Then ${MANAGED_PLAN_PRICE} for hosted Managed calls.`,
  };
}

export function requiresBillingAttention(status: string | null | undefined): boolean {
  return (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "paused"
  );
}

function formatManagedPlanDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function formatSubscriptionStatus(status: string): string {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
