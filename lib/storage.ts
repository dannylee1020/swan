import { defaultSettings, seedRules } from "./defaults";
import type { DetectionRule, StorageShape, UrgeEvent, UserSettings } from "./types";

const EVENTS_LIMIT = 100;

function getBrowserStorage(): chrome.storage.StorageArea {
  return chrome.storage.local;
}

export async function getSettings(): Promise<UserSettings> {
  const result = await getBrowserStorage().get("settings");
  return { ...defaultSettings, ...(result.settings ?? {}) };
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
  return Array.isArray(result.events) ? result.events : [];
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
