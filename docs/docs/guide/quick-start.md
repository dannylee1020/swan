# Quick Start

This is the shortest path to a working Swan extension.

## Quick command

Install the latest Chromium release on macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Install the latest Chromium release on Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer downloads the latest GitHub Release, extracts the Chromium extension into a stable local folder, prints the absolute extension path, and tries to open `chrome://extensions`.

Firefox is not the first-class v0 path. For manual Firefox Desktop developer testing, use:

```bash
npm run setup:firefox
```

## Requirements

<div class="status-grid">
  <div class="setup-card">
    <span class="eyebrow">Runtime</span>
    <strong>Node.js 20 or newer</strong>
    <p>Required by the VitePress docs and safe for the WXT extension toolchain.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">Browser</span>
    <strong>Chromium-based browser</strong>
    <p>Use Chromium for the supported v0 local install. Firefox Desktop is available only for manual developer testing.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">Voice</span>
    <strong>ElevenLabs agent</strong>
    <p>You need an API key, Agent ID, and ElevenLabs agent phone number ID. The callable number is connected inside ElevenLabs.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">Optional SMS</span>
    <strong>Twilio account</strong>
    <p>Only needed if you want Swan to send text alerts in addition to calls.</p>
  </div>
</div>

## Setup path

<ol class="path-list">
  <li>
    <span>1</span>
    <div>
      <strong>Install Swan.</strong>
      <p>Run the macOS/Linux or Windows installer for the latest Chromium release.</p>
    </div>
  </li>
  <li>
    <span>2</span>
    <div>
      <strong>Open the extension.</strong>
      <p>Load the built extension from <code>chrome://extensions</code> in Chromium. Firefox testing uses <code>about:debugging</code> and temporary add-on loading.</p>
    </div>
  </li>
  <li>
    <span>3</span>
    <div>
      <strong>Configure Swan settings.</strong>
      <p>Enter the recipient number and ElevenLabs call credentials in the Swan options page.</p>
    </div>
  </li>
  <li>
    <span>4</span>
    <div>
      <strong>Add or review tracked domains.</strong>
      <p>Swan ships with a seed list and lets you add, disable, or remove domain rules.</p>
    </div>
  </li>
  <li>
    <span>5</span>
    <div>
      <strong>Send a test alert.</strong>
      <p>Use the Send test alert button, confirm the call arrives, then review the Logs page.</p>
    </div>
  </li>
</ol>

## 1. Install prerequisites

- A Chromium-based browser that supports unpacked extensions.
- Optional: Firefox Desktop for manual temporary add-on loading.
- An ElevenLabs account with a Conversational AI agent.
- A paid/upgraded Twilio phone number connected in ElevenLabs for AI calls.
- Optional: Twilio Messaging setup with an SMS-capable phone number.
- For source builds only: Node.js 20 or newer and npm.

## 2. Install the Chromium extension

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer:

- Downloads the latest `swan-chromium.zip` GitHub Release asset.
- Extracts Swan into a stable local extension directory.
- Verifies `manifest.json` exists.
- Prints the exact extension directory to load in Chromium.
- Tries to open `chrome://extensions`.

## 3. Load Swan in Chromium

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the extension path printed by the installer.
5. Keep the folder in place. Chromium loads the extension from that local directory.

After first install, Swan opens its settings page automatically. If it does not, click the Swan extension icon.

## Build from source

Use this path if you want to inspect or modify the source checkout before loading Swan.

From the repository root:

```bash
npm run setup
```

The setup script:

- Installs npm dependencies if `node_modules` is missing.
- Generates bundled import data from `config.yaml` if that local file exists.
- Runs the production extension build.
- Verifies `output/chrome-mv3/manifest.json` exists.
- Prints the exact extension directory to load in Chromium.
- Tries to open `chrome://extensions`.

Optional: copy `config.example.yaml` to `config.yaml` before setup if you want
to keep phone, provider, and tracked-domain values in one local file.

## Firefox Desktop developer path

Firefox support is experimental in Swan v0. It is useful for compatibility testing, but it may require rebuilding and reloading from `about:debugging`, especially after browser restarts.

From the repository root:

```bash
npm run setup:firefox
```

Then open `about:debugging#/runtime/this-firefox` in Firefox, click **Load Temporary Add-on**, and select `output/firefox-mv2/manifest.json`.

Temporary Firefox add-ons are removed when Firefox restarts. See [Install in Firefox](./install-firefox.md) for the full path.

## 4. Configure the options page

Open **Swan settings** and save each configuration group:

| Group | Required values |
| --- | --- |
| Phone Configuration | Recipient phone number, Start voice call toggle, Send optional SMS toggle, monitoring toggle, cooldown minutes |
| ElevenLabs Voice Call | API key, Agent ID, Agent phone number ID |
| Twilio SMS | Optional direct SMS only: Account SID, API Key SID, client secret, SMS From number |

Use E.164 phone-number formatting, for example `+15551234567`.

If you built with `config.yaml`, open **General** and click **Import data**
before manually editing these cards. Import merges configured values and tracked
domains into this browser profile.

Before the first Swan test alert, configure the ElevenLabs
[agent prompt and knowledge base](../agent/). Paste the Swan system prompt into
the agent instructions, set the first message, and upload the recovery playbook
as the agent knowledge base.

## 5. Test the intervention loop

1. Click **Send test alert** in Swan settings.
2. Confirm an AI call arrives from the ElevenLabs-connected number.
3. If SMS is enabled, confirm an SMS arrives from the Twilio From number.
4. Open **Logs** and verify the latest event has call and SMS statuses.

## 6. Add a domain

Open **Domain Tracking**, add a domain such as `example.com`, and keep it enabled. Swan matches the domain and its subdomains.

Swan v0 uses configured domain rules only. It does not inspect page contents, classify images or videos, install DNS rules, or run a proxy.

## Next

- Provider console details: [Provider setup](../provider-setup.md)
- Loading problems: [Troubleshooting](../troubleshooting.md)
- Runtime shape: [Architecture](../reference/architecture.md)
