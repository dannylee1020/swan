import type { AlertStatus, DetectionRule, UrgeEvent, UserSettings } from "../../lib/types";

export type ReadinessTone = "ready" | "warning" | "blocked" | "neutral";

export interface ReadinessItem {
  id: string;
  label: string;
  value: string;
  tone: ReadinessTone;
  detail?: string;
}

export interface ReadinessState {
  summary: string;
  tone: ReadinessTone;
  blockers: string[];
  items: ReadinessItem[];
}

export interface SettingsFieldErrors {
  phoneNumber?: string;
  apiKey?: string;
  agentId?: string;
  agentPhoneNumberId?: string;
}

export function getReadinessState({
  events,
  managedApiConfigured,
  rules,
  settings,
}: {
  events: UrgeEvent[];
  managedApiConfigured: boolean;
  rules: DetectionRule[];
  settings: UserSettings;
}): ReadinessState {
  const blockers = getTestAlertBlockers(settings, managedApiConfigured);
  const enabledRules = rules.filter((rule) => rule.enabled).length;
  const lastTest = events.find((event) => event.ruleId === "test:manual");
  const deliveryReady = blockers.length === 0;
  const domainReady = enabledRules > 0;
  const tone: ReadinessTone = !settings.enabled || !deliveryReady
    ? "blocked"
    : domainReady
      ? "ready"
      : "warning";

  return {
    summary: getReadinessSummary(settings, deliveryReady, domainReady),
    tone,
    blockers,
    items: [
      {
        id: "monitoring",
        label: "Monitoring",
        value: settings.enabled ? "On" : "Off",
        tone: settings.enabled ? "ready" : "blocked",
        detail: settings.enabled
          ? "Watching enabled domains."
          : "Turn monitoring on.",
      },
      {
        id: "mode",
        label: "Mode",
        value: settings.deliveryMode === "managed" ? "Swan Managed" : "BYOK",
        tone: "neutral",
        detail:
          settings.deliveryMode === "managed"
            ? "Swan places hosted managed calls."
            : "Your provider places calls.",
      },
      getRecipientReadiness(settings),
      getProviderReadiness(settings, managedApiConfigured),
      {
        id: "domains",
        label: "Domains",
        value: `${enabledRules} enabled`,
        tone: domainReady ? "ready" : "warning",
        detail: domainReady
          ? "Ready for live browsing."
          : "Add or enable a domain.",
      },
      {
        id: "last-test",
        label: "Test",
        value: lastTest ? formatStatusLabel(lastTest.callStatus) : "None",
        tone: lastTest ? toneForStatus(lastTest.callStatus) : "neutral",
        detail: lastTest
          ? new Date(lastTest.timestamp).toLocaleString()
          : "Send a test alert after setup is ready.",
      },
    ],
  };
}

export function getTestAlertBlockers(
  settings: UserSettings,
  managedApiConfigured: boolean,
): string[] {
  const blockers: string[] = [];

  if (!settings.enabled) {
    blockers.push("Turn on monitoring.");
  }

  if (!settings.callEnabled) {
    blockers.push("Turn on voice calls.");
  }

  if (settings.deliveryMode === "managed") {
    if (!managedApiConfigured) {
      blockers.push("Use a build with Swan calls enabled.");
    } else if (!settings.managedAccount) {
      blockers.push("Sign in for Swan calls.");
    } else if (!settings.managedAccount.entitlementActive) {
      blockers.push("Start a Swan Managed subscription or trial. BYOK is still available.");
    }
    return blockers;
  }

  const fieldErrors = getSettingsFieldErrors(settings);
  if (fieldErrors.phoneNumber) blockers.push(fieldErrors.phoneNumber);
  if (fieldErrors.apiKey) blockers.push(fieldErrors.apiKey);
  if (fieldErrors.agentId) blockers.push(fieldErrors.agentId);
  if (fieldErrors.agentPhoneNumberId) blockers.push(fieldErrors.agentPhoneNumberId);
  return blockers;
}

export function getSettingsFieldErrors(settings: UserSettings): SettingsFieldErrors {
  const errors: SettingsFieldErrors = {};
  const phoneNumber = validatePhoneNumber(settings.phoneNumber, "Recipient number");

  if (phoneNumber) errors.phoneNumber = phoneNumber;
  if (!settings.elevenLabs.apiKey.trim()) {
    errors.apiKey = "Enter an ElevenLabs API key.";
  }
  if (!settings.elevenLabs.agentId.trim()) {
    errors.agentId = "Enter an ElevenLabs agent ID.";
  }
  if (!settings.elevenLabs.agentPhoneNumberId.trim()) {
    errors.agentPhoneNumberId = "Enter an ElevenLabs phone number ID.";
  }
  return errors;
}

export function validatePhoneNumber(
  value: string,
  label = "Phone number",
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `Enter a ${label.toLowerCase()}.`;
  if (!/^[+\d\s().-]+$/.test(trimmed)) {
    return `${label} can use digits, spaces, parentheses, hyphens, and a leading plus.`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return `${label} is too short.`;
  if (digits.length > 15) return `${label} is too long.`;
  return undefined;
}

function getReadinessSummary(
  settings: UserSettings,
  deliveryReady: boolean,
  domainReady: boolean,
): string {
  if (!settings.enabled) return "Monitoring off";
  if (!deliveryReady) return "Needs delivery setup";
  if (!domainReady) return "Add tracked domains";
  return "Ready";
}

function getRecipientReadiness(settings: UserSettings): ReadinessItem {
  if (settings.deliveryMode === "managed") {
    return {
      id: "recipient",
      label: "Phone",
      value: settings.managedAccount?.phoneNumber ?? "Not signed in",
      tone: settings.managedAccount ? "ready" : "blocked",
      detail: settings.managedAccount
        ? "Verified."
        : "Sign in.",
    };
  }

  const error = validatePhoneNumber(settings.phoneNumber, "Recipient number");
  return {
    id: "recipient",
    label: "Phone",
    value: error ? "Missing" : settings.phoneNumber,
    tone: error ? "blocked" : "ready",
    detail: error ?? "Stored locally.",
  };
}

function getProviderReadiness(
  settings: UserSettings,
  managedApiConfigured: boolean,
): ReadinessItem {
  if (settings.deliveryMode === "managed") {
    if (!managedApiConfigured) {
      return {
        id: "provider",
        label: "Account",
        value: "Build missing",
        tone: "blocked",
        detail: "Swan API URL missing.",
      };
    }

    if (!settings.managedAccount) {
      return {
        id: "provider",
        label: "Account",
        value: "Signed out",
        tone: "blocked",
        detail: "Sign in.",
      };
    }

    return {
      id: "provider",
      label: "Account",
      value: settings.managedAccount.entitlementActive ? "Active" : "Subscription required",
      tone: settings.managedAccount.entitlementActive ? "ready" : "blocked",
      detail: settings.managedAccount.entitlementActive
        ? "Hosted calls available."
        : "Start a subscription or trial.",
    };
  }

  const complete =
    settings.elevenLabs.apiKey.trim() &&
    settings.elevenLabs.agentId.trim() &&
    settings.elevenLabs.agentPhoneNumberId.trim();

  return {
    id: "provider",
    label: "Provider",
    value: complete ? "Configured" : "Missing",
    tone: complete ? "ready" : "blocked",
    detail: complete ? "Local keys ready." : "Add ElevenLabs details.",
  };
}

function toneForStatus(status: AlertStatus): ReadinessTone {
  if (status.state === "success" || status.state === "accepted") return "ready";
  if (status.state === "failed") return "blocked";
  if (status.state === "skipped") return "warning";
  return "neutral";
}

function formatStatusLabel(status: AlertStatus): string {
  if (status.state === "success") return "Success";
  if (status.state === "accepted") return "Accepted";
  if (status.state === "failed") return "Failed";
  if (status.state === "skipped") return "Skipped";
  return "Pending";
}
