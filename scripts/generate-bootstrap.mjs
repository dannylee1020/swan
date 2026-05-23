import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "yaml";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(repoRoot, "config.yaml");
const publicDir = join(repoRoot, "public");
const bootstrapPath = join(publicDir, "swan-bootstrap.json");

export async function main() {
  if (!existsSync(configPath)) {
    await removeStaleBootstrap();
    console.log("No config.yaml found. Skipping Swan bootstrap generation.");
    return;
  }

  const raw = await readFile(configPath, "utf8");
  const bootstrap = buildBootstrapFromConfig(parseConfig(raw), new Date());
  await mkdir(publicDir, { recursive: true });
  await writeFile(bootstrapPath, `${JSON.stringify(bootstrap, null, 2)}\n`);
  console.log("Generated public/swan-bootstrap.json from config.yaml.");
}

export function parseConfig(raw) {
  const parsed = parse(raw);
  if (!isRecord(parsed)) {
    throw new Error("config.yaml must contain a YAML object.");
  }
  return parsed;
}

export function buildBootstrapFromConfig(config, generatedAt = new Date()) {
  const settings = {};
  const data = {};

  assignString(config, "phoneNumber", settings);
  assignNumber(config, "cooldownMinutes", settings);
  assignBoolean(config, "monitoringEnabled", settings, "enabled");
  assignBoolean(config, "callEnabled", settings);
  assignBoolean(config, "smsEnabled", settings);

  const elevenLabs = readProviderBlock(config, "elevenLabs", [
    "apiKey",
    "agentId",
    "agentPhoneNumberId",
  ]);
  if (Object.keys(elevenLabs).length > 0) settings.elevenLabs = elevenLabs;

  const twilio = readProviderBlock(config, "twilio", [
    "accountSid",
    "authToken",
    "fromNumber",
  ]);
  if (Object.keys(twilio).length > 0) settings.twilio = twilio;

  const trackedDomains = readTrackedDomains(config);
  if (Object.keys(settings).length > 0) data.settings = settings;
  if (trackedDomains.length > 0) data.trackedDomains = trackedDomains;

  return {
    app: "swan",
    schemaVersion: 1,
    source: "config.yaml",
    generatedAt: generatedAt.toISOString(),
    data,
  };
}

async function removeStaleBootstrap() {
  if (existsSync(bootstrapPath)) {
    await rm(bootstrapPath);
    console.log("Removed stale public/swan-bootstrap.json.");
  }
}

function readProviderBlock(config, key, fields) {
  const block = config[key];
  if (block == null) return {};
  if (!isRecord(block)) {
    throw new Error(`${key} must be a YAML object.`);
  }

  const result = {};
  fields.forEach((field) => assignString(block, field, result));
  return result;
}

function readTrackedDomains(config) {
  const value = config.trackedDomains;
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error("trackedDomains must be a YAML list.");
  }

  const seen = new Set();
  const domains = [];
  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      throw new Error(`trackedDomains[${index}] must be a string.`);
    }
    const domain = normalizeDomain(entry);
    if (!domain) throw new Error(`trackedDomains[${index}] is not a valid domain.`);
    if (!seen.has(domain)) {
      seen.add(domain);
      domains.push(domain);
    }
  });
  return domains;
}

function assignString(source, sourceKey, target, targetKey = sourceKey) {
  const value = source[sourceKey];
  if (value == null) return;
  if (typeof value !== "string") {
    throw new Error(`${sourceKey} must be a string.`);
  }
  target[targetKey] = value;
}

function assignNumber(source, sourceKey, target, targetKey = sourceKey) {
  const value = source[sourceKey];
  if (value == null) return;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${sourceKey} must be a number.`);
  }
  target[targetKey] = value;
}

function assignBoolean(source, sourceKey, target, targetKey = sourceKey) {
  const value = source[sourceKey];
  if (value == null) return;
  if (typeof value !== "boolean") {
    throw new Error(`${sourceKey} must be true or false.`);
  }
  target[targetKey] = value;
}

function normalizeDomain(input) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    const hostname = url.hostname.replace(/^www\./, "");
    if (!hostname || hostname.includes("..")) return null;
    return hostname;
  } catch {
    const fallback = trimmed
      .replace(/^www\./, "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split(":")[0];
    if (!fallback || fallback.includes("..")) return null;
    return fallback;
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
