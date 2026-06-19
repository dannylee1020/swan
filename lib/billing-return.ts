export type BillingReturnStatus = "success" | "cancelled";

export type SwanExternalBillingMessage = {
  type: "SWAN_BILLING_RETURN";
  status: BillingReturnStatus;
};

export type BillingReturnDashboardPath = `/options.html?swanBilling=${BillingReturnStatus}`;

export function isSwanExternalBillingMessage(
  message: unknown,
): message is SwanExternalBillingMessage {
  if (!isRecord(message)) return false;
  if (message.type !== "SWAN_BILLING_RETURN") return false;
  return message.status === "success" || message.status === "cancelled";
}

export function billingReturnDashboardPath(
  status: BillingReturnStatus,
): BillingReturnDashboardPath {
  return `/options.html?swanBilling=${status}`;
}

export function isAllowedBillingReturnSender(
  senderUrl: string | undefined,
  managedApiBaseUrl: string | null,
): boolean {
  if (!senderUrl || !managedApiBaseUrl) return false;

  const sender = parseUrl(senderUrl);
  const managedApi = parseUrl(managedApiBaseUrl);
  if (!sender || !managedApi) return false;

  if (isLocalHost(managedApi.hostname) && isLocalHost(sender.hostname)) {
    return sender.protocol === managedApi.protocol;
  }

  return sender.origin === managedApi.origin;
}

export async function handleExternalBillingReturnMessage({
  managedApiBaseUrl,
  message,
  openDashboard,
  senderUrl,
}: {
  managedApiBaseUrl: string | null;
  message: unknown;
  openDashboard: (path: BillingReturnDashboardPath) => Promise<void>;
  senderUrl: string | undefined;
}): Promise<boolean> {
  if (!isSwanExternalBillingMessage(message)) return false;
  if (!isAllowedBillingReturnSender(senderUrl, managedApiBaseUrl)) return false;

  await openDashboard(billingReturnDashboardPath(message.status));
  return true;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "0.0.0.0";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
