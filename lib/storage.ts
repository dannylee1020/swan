import { browser, type Browser } from "wxt/browser";
import { defaultSettings, seedRules } from "./defaults";
import type { DetectionRule, StorageShape, UrgeEvent, UserSettings } from "./types";

const EVENTS_LIMIT = 100;

function getBrowserStorage(): Browser.storage.StorageArea {
  return browser.storage.local;
}

export async function getSettings(): Promise<UserSettings> {
  const result = await getBrowserStorage().get("settings");
  return normalizeSettings(result.settings);
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await getBrowserStorage().set({ settings });
}

export async function getRules(): Promise<DetectionRule[]> {
  const result = await getBrowserStorage().get("rules");
  if (Array.isArray(result.rules) && result.rules.length > 0) {
    return result.rules;
  }
  await saveRules(seedRules);
  return seedRules;
}

export async function saveRules(rules: DetectionRule[]): Promise<void> {
  await getBrowserStorage().set({ rules });
}

export async function getEvents(): Promise<UrgeEvent[]> {
  const result = await getBrowserStorage().get("events");
  return Array.isArray(result.events)
    ? result.events.map(normalizeEvent).filter((event) => event !== null)
    : [];
}

export async function saveEvent(event: UrgeEvent): Promise<void> {
  const events = await getEvents();
  await getBrowserStorage().set({
    events: [event, ...events].slice(0, EVENTS_LIMIT),
  });
}

export async function updateEvent(event: UrgeEvent): Promise<void> {
  const events = await getEvents();
  await getBrowserStorage().set({
    events: events.map((candidate) =>
      candidate.id === event.id ? event : candidate,
    ),
  });
}

export async function getStorageSnapshot(): Promise<StorageShape> {
  const [settings, rules, events] = await Promise.all([
    getSettings(),
    getRules(),
    getEvents(),
  ]);
  return { settings, rules, events };
}

export async function cleanupLegacySmsData(): Promise<void> {
  const storage = getBrowserStorage();
  const [settingsResult, eventsResult] = await Promise.all([
    storage.get("settings"),
    storage.get("events"),
  ]);
  const updates: Partial<StorageShape> = {};

  if (isRecord(settingsResult.settings)) {
    const normalizedSettings = normalizeSettings(settingsResult.settings);
    if (hasLegacySmsSettings(settingsResult.settings)) {
      updates.settings = normalizedSettings;
    }
  }

  if (Array.isArray(eventsResult.events)) {
    const normalizedEvents = eventsResult.events
      .map(normalizeEvent)
      .filter((event) => event !== null);
    if (eventsResult.events.some(hasLegacySmsStatus)) {
      updates.events = normalizedEvents;
    }
  }

  if (Object.keys(updates).length > 0) {
    await storage.set(updates);
  }
}

function normalizeSettings(input: unknown): UserSettings {
  const saved = isRecord(input) ? input : {};
  const savedElevenLabs = isRecord(saved.elevenLabs) ? saved.elevenLabs : {};

  return {
    ...defaultSettings,
    enabled:
      typeof saved.enabled === "boolean" ? saved.enabled : defaultSettings.enabled,
    phoneNumber: readString(saved.phoneNumber) || defaultSettings.phoneNumber,
    cooldownMinutes:
      typeof saved.cooldownMinutes === "number"
        ? saved.cooldownMinutes
        : defaultSettings.cooldownMinutes,
    callEnabled:
      typeof saved.callEnabled === "boolean"
        ? saved.callEnabled
        : defaultSettings.callEnabled,
    elevenLabs: {
      ...defaultSettings.elevenLabs,
      ...savedElevenLabs,
    },
  };
}

function normalizeEvent(input: unknown): UrgeEvent | null {
  if (!isRecord(input)) return null;
  const callStatus = isAlertStatus(input.callStatus)
    ? input.callStatus
    : { state: "pending" as const };
  if (
    typeof input.id !== "string" ||
    typeof input.timestamp !== "string" ||
    typeof input.domain !== "string" ||
    typeof input.ruleId !== "string" ||
    input.trigger !== "navigation"
  ) {
    return null;
  }

  return {
    id: input.id,
    timestamp: input.timestamp,
    domain: input.domain,
    ruleId: input.ruleId,
    trigger: "navigation",
    callStatus,
  };
}

function hasLegacySmsSettings(settings: Record<string, unknown>): boolean {
  return "smsEnabled" in settings || "twilio" in settings;
}

function hasLegacySmsStatus(event: unknown): boolean {
  return isRecord(event) && "smsStatus" in event;
}

function isAlertStatus(value: unknown): value is UrgeEvent["callStatus"] {
  if (!isRecord(value) || typeof value.state !== "string") return false;
  if (value.state === "pending") return true;
  if (value.state === "skipped") return typeof value.reason === "string";
  if (value.state === "success") {
    return value.providerId === undefined || typeof value.providerId === "string";
  }
  if (value.state === "failed") return typeof value.error === "string";
  return false;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
