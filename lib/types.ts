export type DetectionRuleSource = "seed" | "user";

export type AlertStatus =
  | { state: "skipped"; reason: string }
  | { state: "pending" }
  | { state: "success"; providerId?: string }
  | { state: "failed"; error: string };

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
  smsStatus: AlertStatus;
  callStatus: AlertStatus;
}

export interface TwilioSettings {
  accountSid: string;
  apiKeySid: string;
  clientSecret: string;
  fromNumber: string;
}

export interface ElevenLabsSettings {
  apiKey: string;
  agentId: string;
  agentPhoneNumberId: string;
}

export interface UserSettings {
  enabled: boolean;
  phoneNumber: string;
  cooldownMinutes: number;
  smsEnabled: boolean;
  callEnabled: boolean;
  twilio: TwilioSettings;
  elevenLabs: ElevenLabsSettings;
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

export interface ProviderResult {
  providerId?: string;
}

export interface SmsProvider {
  send(context: AlertContext): Promise<ProviderResult>;
}

export interface CallProvider {
  start(context: AlertContext): Promise<ProviderResult>;
}
