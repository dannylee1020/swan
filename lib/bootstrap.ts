import { normalizeDomain } from "./domain";
import type { DetectionRule, UserSettings } from "./types";

export interface BootstrapSettings {
  enabled?: boolean;
  phoneNumber?: string;
  cooldownMinutes?: number;
  callEnabled?: boolean;
  elevenLabs?: Partial<UserSettings["elevenLabs"]>;
}

export interface SwanBootstrap {
  app: "swan";
  schemaVersion: 1;
  source: "config.yaml";
  generatedAt: string;
  data: {
    settings?: BootstrapSettings;
    trackedDomains?: string[];
  };
}

export interface BootstrapImportResult {
  settings: UserSettings;
  rules: DetectionRule[];
  addedRules: number;
  updatedRules: number;
}

export interface BootstrapSummary {
  generatedAt: string;
  hasSettings: boolean;
  hasCredentials: boolean;
  trackedDomainCount: number;
}

export function parseSwanBootstrap(input: unknown): SwanBootstrap {
  if (!isRecord(input)) throw new Error("Import data must be a JSON object.");
  if (input.app !== "swan") throw new Error("Import data is not for Swan.");
  if (input.schemaVersion !== 1) {
    throw new Error("Import data uses an unsupported schema version.");
  }
  if (input.source !== "config.yaml") {
    throw new Error("Import data must be generated from config.yaml.");
  }
  if (typeof input.generatedAt !== "string" || !input.generatedAt) {
    throw new Error("Import data is missing generatedAt.");
  }
  if (!isRecord(input.data)) throw new Error("Import data is missing data.");

  const settings = readBootstrapSettings(input.data.settings);
  const trackedDomains = readTrackedDomains(input.data.trackedDomains);

  return {
    app: "swan",
    schemaVersion: 1,
    source: "config.yaml",
    generatedAt: input.generatedAt,
    data: {
      ...(settings ? { settings } : {}),
      ...(trackedDomains ? { trackedDomains } : {}),
    },
  };
}

export function summarizeBootstrap(bootstrap: SwanBootstrap): BootstrapSummary {
  const settings = bootstrap.data.settings;
  return {
    generatedAt: bootstrap.generatedAt,
    hasSettings: Boolean(settings),
    hasCredentials: Boolean(
      settings?.elevenLabs?.apiKey ||
        settings?.elevenLabs?.agentId ||
        settings?.elevenLabs?.agentPhoneNumberId,
    ),
    trackedDomainCount: bootstrap.data.trackedDomains?.length ?? 0,
  };
}

export function applyBootstrap(
  currentSettings: UserSettings,
  currentRules: DetectionRule[],
  bootstrap: SwanBootstrap,
  now = new Date(),
): BootstrapImportResult {
  const nextSettings = mergeBootstrapSettings(
    currentSettings,
    bootstrap.data.settings,
  );
  const { rules, addedRules, updatedRules } = mergeBootstrapRules(
    currentRules,
    bootstrap.data.trackedDomains ?? [],
    now,
  );

  return { settings: nextSettings, rules, addedRules, updatedRules };
}

function mergeBootstrapSettings(
  currentSettings: UserSettings,
  settings?: BootstrapSettings,
): UserSettings {
  if (!settings) return currentSettings;

  return {
    ...currentSettings,
    ...(settings.enabled !== undefined ? { enabled: settings.enabled } : {}),
    ...(settings.phoneNumber !== undefined
      ? { phoneNumber: settings.phoneNumber }
      : {}),
    ...(settings.cooldownMinutes !== undefined
      ? { cooldownMinutes: settings.cooldownMinutes }
      : {}),
    ...(settings.callEnabled !== undefined
      ? { callEnabled: settings.callEnabled }
      : {}),
    elevenLabs: {
      ...currentSettings.elevenLabs,
      ...(settings.elevenLabs ?? {}),
    },
  };
}

function mergeBootstrapRules(
  currentRules: DetectionRule[],
  trackedDomains: string[],
  now: Date,
): { rules: DetectionRule[]; addedRules: number; updatedRules: number } {
  if (trackedDomains.length === 0) {
    return { rules: currentRules, addedRules: 0, updatedRules: 0 };
  }

  const createdAt = now.toISOString();
  let addedRules = 0;
  let updatedRules = 0;
  const existingDomains = new Set(currentRules.map((rule) => rule.domain));
  const configuredDomains = new Set(trackedDomains);
  const updated = currentRules.map((rule) => {
    if (!configuredDomains.has(rule.domain) || rule.enabled) return rule;
    updatedRules += 1;
    return { ...rule, enabled: true };
  });

  const additions = trackedDomains
    .filter((domain) => !existingDomains.has(domain))
    .map((domain, index) => {
      addedRules += 1;
      return {
        id: `user:${domain}:${now.getTime()}-${index}`,
        domain,
        enabled: true,
        source: "user" as const,
        createdAt,
      };
    });

  return { rules: [...additions, ...updated], addedRules, updatedRules };
}

function readBootstrapSettings(input: unknown): BootstrapSettings | undefined {
  if (input == null) return undefined;
  if (!isRecord(input)) throw new Error("settings must be an object.");

  const settings: BootstrapSettings = {};
  const target = settings as Record<string, unknown>;
  readBoolean(input, "enabled", target);
  readString(input, "phoneNumber", target);
  readNumber(input, "cooldownMinutes", target);
  readBoolean(input, "callEnabled", target);

  const elevenLabs = readProviderSettings(input.elevenLabs, [
    "apiKey",
    "agentId",
    "agentPhoneNumberId",
  ]);
  if (elevenLabs) settings.elevenLabs = elevenLabs;

  return Object.keys(settings).length > 0 ? settings : undefined;
}

function readProviderSettings(
  input: unknown,
  fields: string[],
): Record<string, string> | undefined {
  if (input == null) return undefined;
  if (!isRecord(input)) throw new Error("provider settings must be an object.");

  const result: Record<string, string> = {};
  fields.forEach((field) => readString(input, field, result));
  return Object.keys(result).length > 0 ? result : undefined;
}

function readTrackedDomains(input: unknown): string[] | undefined {
  if (input == null) return undefined;
  if (!Array.isArray(input)) throw new Error("trackedDomains must be an array.");

  const seen = new Set<string>();
  const domains = input.map((entry, index) => {
    if (typeof entry !== "string") {
      throw new Error(`trackedDomains[${index}] must be a string.`);
    }
    const domain = normalizeDomain(entry);
    if (!domain) throw new Error(`trackedDomains[${index}] is invalid.`);
    return domain;
  });

  return domains.filter((domain) => {
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}

function readString(
  source: Record<string, unknown>,
  key: string,
  target: Record<string, unknown>,
) {
  const value = source[key];
  if (value == null) return;
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  target[key] = value;
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
  target: Record<string, unknown>,
) {
  const value = source[key];
  if (value == null) return;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a number.`);
  }
  target[key] = value;
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
  target: Record<string, unknown>,
) {
  const value = source[key];
  if (value == null) return;
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean.`);
  target[key] = value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
