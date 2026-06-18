#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(rootDir, "package.json"), "utf8"),
);
const zipPath =
  process.argv[2] ?? join(rootDir, "output", `swan-${packageJson.version}-chrome.zip`);
const outputDir = join(rootDir, "output", "chrome-mv3");

const expectedManifestName = "Swan - NSFW Blocker with Calls";
const expectedPermissions = ["storage", "webNavigation"];
const expectedHostPermissions = [
  "https://api.elevenlabs.io/*",
  ...managedHostPermissions(process.env.WXT_SWAN_MANAGED_API_BASE_URL),
];
const expectedExternallyConnectableMatches = managedExternallyConnectableMatches(
  process.env.WXT_SWAN_MANAGED_API_BASE_URL,
);
const expectedIcons = [
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function unzip(args) {
  return execFileSync("unzip", args, { encoding: "utf8" });
}

function readZipEntry(entry) {
  return unzip(["-p", zipPath, entry]);
}

function sameSet(actual, expected) {
  return (
    actual.length === expected.length &&
    expected.every((value) => actual.includes(value))
  );
}

function managedHostPermissions(value) {
  const trimmed = value?.trim();
  if (!trimmed) return [];
  const url = new URL(trimmed);
  return [`${url.origin}/*`];
}

function managedExternallyConnectableMatches(value) {
  const trimmed = value?.trim();
  if (!trimmed) return [];
  const url = new URL(trimmed);
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
    return [`${url.protocol}//127.0.0.1/*`, `${url.protocol}//localhost/*`];
  }
  return [`${url.origin}/*`];
}

function hasExpectedWebAccessibleResources(manifest) {
  const resources = manifest.web_accessible_resources;
  if (!Array.isArray(resources)) return false;
  return resources.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const listedResources = Array.isArray(entry.resources) ? entry.resources : [];
    const matches = Array.isArray(entry.matches) ? entry.matches : [];
    return (
      ["intervention.html", "assets/*", "chunks/*"].every((resource) =>
        listedResources.includes(resource),
      ) && matches.includes("<all_urls>")
    );
  });
}

if (!existsSync(zipPath)) {
  fail(`Store zip does not exist: ${zipPath}`);
} else {
  const entries = unzip(["-Z1", zipPath])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.includes("manifest.json")) {
    fail("manifest.json must be at the zip root.");
  }

  if (entries.some((entry) => entry.endsWith("swan-bootstrap.json"))) {
    fail("Store zip must not include swan-bootstrap.json.");
  }

  expectedIcons.forEach((iconPath) => {
    if (!entries.includes(iconPath)) fail(`Missing icon in zip: ${iconPath}`);
  });

  if (entries.includes("manifest.json")) {
    const manifest = JSON.parse(readZipEntry("manifest.json"));
    if (manifest.manifest_version !== 3) fail("Manifest version must be 3.");
    if (manifest.name !== expectedManifestName) {
      fail(`Manifest name must be "${expectedManifestName}".`);
    }
    if (!manifest.homepage_url) fail("Manifest should include homepage_url.");
    if (manifest.incognito !== "split") {
      fail('Manifest incognito mode must be "split".');
    }
    if (!sameSet(manifest.permissions ?? [], expectedPermissions)) {
      fail(`Unexpected permissions: ${(manifest.permissions ?? []).join(", ")}`);
    }
    if (!sameSet(manifest.host_permissions ?? [], expectedHostPermissions)) {
      fail(
        `Unexpected host permissions: ${(manifest.host_permissions ?? []).join(", ")}`,
      );
    }
    if (!hasExpectedWebAccessibleResources(manifest)) {
      fail("Manifest must expose intervention page resources.");
    }
    const externallyConnectableMatches =
      manifest.externally_connectable?.matches ?? [];
    if (
      !sameSet(externallyConnectableMatches, expectedExternallyConnectableMatches)
    ) {
      fail(
        `Unexpected externally_connectable matches: ${externallyConnectableMatches.join(", ")}`,
      );
    }
  }

  entries
    .filter((entry) => entry.endsWith(".html"))
    .forEach((entry) => {
      const html = readZipEntry(entry);
      if (/<script[^>]+src=["']https?:\/\//i.test(html)) {
        fail(`Remote script tag found in ${entry}.`);
      }
    });

  entries
    .filter((entry) => entry.endsWith(".js"))
    .forEach((entry) => {
      const js = readZipEntry(entry);
      if (/\beval\s*\(/.test(js)) fail(`eval() found in ${entry}.`);
      if (/\bnew\s+Function\s*\(/.test(js)) fail(`new Function() found in ${entry}.`);
    });
}

if (existsSync(join(outputDir, "swan-bootstrap.json"))) {
  fail("output/chrome-mv3 must not include swan-bootstrap.json.");
}

if (errors.length > 0) {
  console.error("Store package validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Store package validation passed: ${zipPath}`);
