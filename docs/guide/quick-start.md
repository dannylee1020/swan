# Quick Start

This is the shortest path from a fresh checkout to a working Swan extension.

## Quick command

Run the setup script from the repository root:

```bash
npm run setup
```

The script installs dependencies when needed, builds the extension, prints the absolute `output/chrome-mv3` path, and tries to open `chrome://extensions`.

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
    <p>Use Chrome, Brave, Arc, Edge, or another browser that can load unpacked Manifest V3 extensions.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">SMS</span>
    <strong>Twilio account</strong>
    <p>You need an Account SID, Auth Token, and SMS-capable From number.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">Voice</span>
    <strong>ElevenLabs agent</strong>
    <p>You need an API key, Agent ID, and ElevenLabs agent phone number ID.</p>
  </div>
</div>

## Setup path

<ol class="path-list">
  <li>
    <span>1</span>
    <div>
      <strong>Clone and build Swan.</strong>
      <p>Run <code>npm run setup</code>, then keep the printed extension path available.</p>
    </div>
  </li>
  <li>
    <span>2</span>
    <div>
      <strong>Load the extension.</strong>
      <p>Open <code>chrome://extensions</code>, enable Developer Mode, click Load unpacked, and select <code>output/chrome-mv3</code>.</p>
    </div>
  </li>
  <li>
    <span>3</span>
    <div>
      <strong>Configure Swan settings.</strong>
      <p>Enter the recipient number, Twilio SMS credentials, and ElevenLabs call credentials in the Swan options page.</p>
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
      <p>Use the Send test alert button, confirm the SMS and call arrive, then review the Logs page.</p>
    </div>
  </li>
</ol>

## 1. Install prerequisites

Install:

- Node.js 20 or newer.
- npm.
- A Chromium-based browser that supports unpacked extensions.
- A Twilio account with an SMS-capable phone number.
- An ElevenLabs account with a Conversational AI agent and connected phone number.

## 2. Build the extension

From the repository root:

```bash
npm run setup
```

The setup script:

- Installs npm dependencies if `node_modules` is missing.
- Runs the production extension build.
- Verifies `output/chrome-mv3/manifest.json` exists.
- Prints the exact extension directory to load in Chromium.
- Tries to open `chrome://extensions`.

## 3. Load Swan in Chromium

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the `output/chrome-mv3` path printed by `npm run setup`.
5. Keep the folder in place. Chromium loads the extension from that local build output.

After first install, Swan opens its settings page automatically. If it does not, click the Swan extension icon.

## 4. Configure the options page

Open **Swan settings** and save each configuration group:

| Group | Required values |
| --- | --- |
| Phone Configuration | Recipient phone number, Send SMS toggle, Start AI Call toggle, monitoring toggle, cooldown minutes |
| Twilio SMS | Account SID, Auth Token, SMS From number |
| ElevenLabs AI Call | API key, Agent ID, Agent phone number ID |

Use E.164 phone-number formatting, for example `+15551234567`.

## 5. Test the intervention loop

1. Click **Send test alert** in Swan settings.
2. Confirm an SMS arrives from the Twilio From number.
3. Confirm an AI call arrives from the ElevenLabs-connected number.
4. Open **Logs** and verify the latest event has SMS and call statuses.

## 6. Add a domain

Open **Domain Tracking**, add a domain such as `example.com`, and keep it enabled. Swan matches the domain and its subdomains.

Swan v0 uses configured domain rules only. It does not inspect page contents, classify images or videos, install DNS rules, or run a proxy.

## Next

- Provider console details: [Provider setup](../provider-setup.md)
- Loading problems: [Troubleshooting](../troubleshooting.md)
- Runtime shape: [Architecture](../reference/architecture.md)
