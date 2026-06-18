import type { ManagedAccount } from "../types";

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
