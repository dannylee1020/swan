import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = join(repoRoot, "output", "chrome-mv3");
const manifestPath = join(extensionDir, "manifest.json");
const noOpen = process.argv.includes("--no-open");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function openExtensionsPage() {
  if (noOpen) return;

  const url = "chrome://extensions";
  const opener =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];

  const result = spawnSync(opener[0], opener[1], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: false,
  });

  if (result.error || result.status !== 0) {
    console.log(`Could not open ${url} automatically. Open it manually.`);
  }
}

console.log("Preparing Swan...");

if (!existsSync(join(repoRoot, "node_modules"))) {
  console.log("Installing dependencies...");
  run(npmCommand(), ["install"]);
}

console.log("Building extension...");
run(npmCommand(), ["run", "build"]);

if (!existsSync(manifestPath)) {
  throw new Error(`Build did not create ${manifestPath}`);
}

console.log("");
console.log("Swan is ready to load in Chromium.");
console.log("");
console.log(`Extension path: ${extensionDir}`);
console.log("");
console.log("Install steps:");
console.log("1. Open chrome://extensions");
console.log("2. Enable Developer Mode");
console.log("3. Click Load unpacked");
console.log(`4. Select ${extensionDir}`);
console.log("5. Open Swan options and configure providers");
console.log("");
console.log("Provider guide: docs/provider-setup.md");
console.log("");

openExtensionsPage();
