export type DetectionRuleSource = "seed" | "user";

export type AlertStatus =
  | { state: "skipped"; reason: string }
  | { state: "pending" }
  | { state: "accepted"; providerId?: string }
  | { state: "success"; providerId?: string }
  | { state: "failed"; error: string };

export type DeliveryMode = "byok" | "managed";

export interface DetectionRule {
  id: string;
  domain: string;
  enabled: boolean;
  source: DetectionRuleSource;
  createdAt: string;
}

export interface UrgeEvent {
  id: string;
  timestamp: string;
  domain: string;
  ruleId: string;
  trigger: "navigation";
  callStatus: AlertStatus;
}

export interface ElevenLabsSettings {
  apiKey: string;
  agentId: string;
  agentPhoneNumberId: string;
}

export interface ManagedAccount {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  sessionToken: string;
  eventIngestToken: string;
  refreshToken: string;
  expiresAt: string;
  entitlementActive: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  pendingStripeCheckoutSessionId: string | null;
}

export interface UserSettings {
  enabled: boolean;
  deliveryMode: DeliveryMode;
  onboardingCompleted: boolean;
  phoneNumber: string;
  callEnabled: boolean;
  elevenLabs: ElevenLabsSettings;
  managedAccount: ManagedAccount | null;
}

export interface StorageShape {
  settings: UserSettings;
  rules: DetectionRule[];
  events: UrgeEvent[];
}

export interface AlertContext {
  event: UrgeEvent;
  settings: UserSettings;
}

export interface CallProvider {
  start(context: AlertContext): Promise<AlertStatus>;
}
