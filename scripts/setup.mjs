import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { getTarget, resolveTargetPaths, targets } from "./targets.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const noOpen = process.argv.includes("--no-open");
const targetId = readOption("target") ?? readOption("browser") ?? "chromium";
const target = getTarget(targetId);

if (!target) {
  throw new Error(
    `Unknown browser target "${targetId}". Use one of: ${Object.keys(targets).join(", ")}`,
  );
}

const { extensionDir, manifestPath } = resolveTargetPaths(repoRoot, target);

function readOption(name) {
  const prefix = `--${name}=`;
  const option = process.argv.find((arg) => arg.startsWith(prefix));
  return option ? option.slice(prefix.length) : undefined;
}

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

function openTargetPage() {
  if (noOpen || !target.autoOpen) return;

  const opener =
    process.platform === "darwin"
      ? ["open", [target.openUrl]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", target.openUrl]]
        : ["xdg-open", [target.openUrl]];

  const result = spawnSync(opener[0], opener[1], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: false,
  });

  if (result.error || result.status !== 0) {
    console.log(`Could not open ${target.openUrl} automatically. Open it manually.`);
  }
}

console.log(`Preparing Swan for ${target.label}...`);

if (!existsSync(resolve(repoRoot, "node_modules"))) {
  console.log("Installing dependencies...");
  run(npmCommand(), ["install"]);
}

console.log("Building extension...");
run(npmCommand(), ["run", target.buildScript]);

if (!existsSync(manifestPath)) {
  throw new Error(`Build did not create ${manifestPath}`);
}

console.log("");
console.log(target.readyMessage);
console.log("");
console.log(`Extension path: ${extensionDir}`);
console.log(`Manifest path: ${manifestPath}`);
console.log("");
console.log("Install steps:");
for (const step of target.installSteps(extensionDir, manifestPath)) {
  console.log(step);
}
console.log("");
console.log("Provider guide: docs/provider-setup.md");
console.log("");

openTargetPage();
