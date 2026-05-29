import { join } from "node:path";

export const targets = {
  chromium: {
    id: "chromium",
    label: "Chromium",
    buildScript: "build",
    outputDirParts: ["output", "chrome-mv3"],
    manifestFileParts: ["output", "chrome-mv3", "manifest.json"],
    openUrl: "chrome://extensions",
    autoOpen: true,
    readyMessage: "Swan is ready to load in Chromium.",
    installSteps(extensionDir) {
      return [
        "1. Open chrome://extensions",
        "2. Enable Developer Mode",
        "3. Click Load unpacked",
        `4. Select ${extensionDir}`,
        "5. Open Swan options and configure providers",
      ];
    },
  },
  firefox: {
    id: "firefox",
    label: "Firefox Desktop",
    buildScript: "build:firefox",
    outputDirParts: ["output", "firefox-mv2"],
    manifestFileParts: ["output", "firefox-mv2", "manifest.json"],
    openUrl: "about:debugging#/runtime/this-firefox",
    autoOpen: false,
    readyMessage: "Swan is ready to load temporarily in Firefox Desktop.",
    installSteps(_extensionDir, manifestPath) {
      return [
        "1. Open about:debugging#/runtime/this-firefox in Firefox",
        "2. Click This Firefox",
        "3. Click Load Temporary Add-on",
        `4. Select ${manifestPath}`,
        "5. Open Swan options and configure providers",
      ];
    },
  },
};

export function resolveTargetPaths(repoRoot, target) {
  return {
    extensionDir: join(repoRoot, ...target.outputDirParts),
    manifestPath: join(repoRoot, ...target.manifestFileParts),
  };
}

export function getTarget(targetId) {
  return targets[targetId] ?? null;
}
