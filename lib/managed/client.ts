import type { AlertStatus, ManagedAccount, UrgeEvent } from "../types";

export interface ManagedAuthResponse {
  account: ManagedAccount;
}

interface ManagedClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface OTPStartResponse {
  challengeId: string;
  expiresAt: string;
}

interface OTPVerifyResponse {
  account: {
    userId: string;
    phoneNumber: string;
    sessionToken: string;
    eventIngestToken: string;
  };
  refreshToken: string;
  expiresAt: string;
}

interface MeResponse {
  userId: string;
  phoneNumber: string;
  entitlementActive: boolean;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
}

interface CheckoutResponse {
  checkoutUrl: string;
  providerSessionId: string;
}

interface PortalResponse {
  portalUrl: string;
}

interface InterventionResponse {
  callStatus: {
    state: string;
    reason?: string | null;
    deliveryId?: string | null;
    error?: string | null;
  };
}

export function getManagedApiBaseUrl(): string | null {
  const value = import.meta.env.WXT_SWAN_MANAGED_API_BASE_URL as
    | string
    | undefined;
  return normalizeBaseUrl(value);
}

export class ManagedApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ManagedApiError";
  }
}

export class ManagedClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ManagedClientOptions = {}) {
    const baseUrl = normalizeBaseUrl(options.baseUrl) ?? getManagedApiBaseUrl();
    if (!baseUrl) {
      throw new Error("Swan Managed API is not configured");
    }

    this.baseUrl = baseUrl;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async startOtp(phoneNumber: string): Promise<OTPStartResponse> {
    return this.request<OTPStartResponse>("/v1/auth/otp/start", {
      method: "POST",
      body: { phoneNumber },
    });
  }

  async verifyOtp(input: {
    challengeId: string;
    code: string;
  }): Promise<ManagedAuthResponse> {
    const response = await this.request<OTPVerifyResponse>("/v1/auth/otp/verify", {
      method: "POST",
      body: {
        challengeId: input.challengeId,
        code: input.code,
        devicePlatform: "browser",
        deviceLabel: "Chrome extension",
      },
    });
    return { account: accountFromAuthResponse(response) };
  }

  async refreshAccount(account: ManagedAccount): Promise<ManagedAuthResponse> {
    const response = await this.request<OTPVerifyResponse>(
      "/v1/auth/session/refresh",
      {
        method: "POST",
        body: { refreshToken: account.refreshToken },
      },
    );
    return { account: accountFromAuthResponse(response) };
  }

  async fetchMe(account: ManagedAccount): Promise<ManagedAccount> {
    const response = await this.request<MeResponse>("/v1/me", {
      token: account.sessionToken,
    });
    return {
      ...account,
      userId: response.userId,
      phoneNumber: response.phoneNumber,
      entitlementActive: response.entitlementActive,
      subscriptionStatus: response.subscriptionStatus ?? null,
      currentPeriodEnd: response.currentPeriodEnd ?? null,
    };
  }

  async updateSettings(account: ManagedAccount, input: {
    enabled?: boolean;
  }): Promise<void> {
    await this.request("/v1/settings", {
      method: "PATCH",
      token: account.sessionToken,
      body: input,
    });
  }

  async createCheckout(account: ManagedAccount): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>("/v1/billing/stripe/checkout", {
      method: "POST",
      token: account.sessionToken,
    });
  }

  async createPortal(account: ManagedAccount): Promise<PortalResponse> {
    return this.request<PortalResponse>("/v1/billing/stripe/portal", {
      method: "POST",
      token: account.sessionToken,
    });
  }

  async logout(account: ManagedAccount): Promise<void> {
    await this.request("/v1/auth/logout", {
      method: "POST",
      token: account.sessionToken,
    });
  }

  async sendBrowserEvent(account: ManagedAccount, event: UrgeEvent): Promise<{
    account: ManagedAccount;
    callStatus: AlertStatus;
  }> {
    return this.sendBrowserEventWithRetry(account, event, false);
  }

  private async sendBrowserEventWithRetry(
    account: ManagedAccount,
    event: UrgeEvent,
    retried: boolean,
  ): Promise<{ account: ManagedAccount; callStatus: AlertStatus }> {
    try {
      const response = await this.request<InterventionResponse>(
        "/v1/browser/events",
        {
          method: "POST",
          token: account.eventIngestToken,
          body: {
            eventId: event.id,
            timestamp: event.timestamp,
            domain: event.domain,
            ruleId: event.ruleId,
            trigger: event.trigger,
          },
        },
      );
      return {
        account,
        callStatus: alertStatusFromManagedResponse(response.callStatus),
      };
    } catch (error) {
      if (error instanceof ManagedApiError && error.status === 401 && !retried) {
        const refreshed = await this.refreshAccount(account);
        return this.sendBrowserEventWithRetry(refreshed.account, event, true);
      }
      throw error;
    }
  }

  private async request<T = unknown>(
    path: string,
    init: {
      method?: string;
      token?: string;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.token) headers.Authorization = `Bearer ${init.token}`;

    const requestInit: RequestInit = {
      method: init.method ?? "GET",
      headers,
    };
    if (init.body !== undefined) {
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, requestInit);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ManagedApiError(readErrorMessage(payload, response.status), response.status);
    }

    return payload as T;
  }
}

function accountFromAuthResponse(response: OTPVerifyResponse): ManagedAccount {
  return {
    userId: response.account.userId,
    phoneNumber: response.account.phoneNumber,
    sessionToken: response.account.sessionToken,
    eventIngestToken: response.account.eventIngestToken,
    refreshToken: response.refreshToken,
    expiresAt: response.expiresAt,
    entitlementActive: false,
    subscriptionStatus: null,
    currentPeriodEnd: null,
  };
}

function alertStatusFromManagedResponse(status: InterventionResponse["callStatus"]): AlertStatus {
  if (status.state === "accepted") {
    return {
      state: "accepted",
      ...(status.deliveryId ? { providerId: status.deliveryId } : {}),
    };
  }
  if (status.state === "success") {
    return {
      state: "success",
      ...(status.deliveryId ? { providerId: status.deliveryId } : {}),
    };
  }
  if (status.state === "skipped") {
    return { state: "skipped", reason: status.reason ?? "Call skipped" };
  }
  if (status.state === "failed") {
    return { state: "failed", error: status.error ?? "Managed call failed" };
  }
  return { state: "pending" };
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

function readErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.message === "string") return payload.message;
  }
  return `Swan Managed request failed: ${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
