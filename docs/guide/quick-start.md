# Quick Start

This is the shortest path to a working Swan extension.

If you have a Chrome Web Store beta link, install from that link first, then jump to [Configure the options page](#_4-configure-the-options-page). If you are building from source, use the full path below.

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
    <p>Use Chrome for the Web Store beta, or another Chromium-based browser that can load unpacked Manifest V3 extensions from source.</p>
  </div>
  <div class="setup-card">
    <span class="eyebrow">Voice</span>
    <strong>ElevenLabs agent</strong>
    <p>You need an API key, Agent ID, ElevenLabs agent phone number ID, and a paid/upgraded Twilio number.</p>
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
      <strong>Install or build Swan.</strong>
      <p>Use the Chrome Web Store beta link when available, or run <code>npm run setup</code> from a source checkout.</p>
    </div>
  </li>
  <li>
    <span>2</span>
    <div>
      <strong>Open the extension.</strong>
      <p>For Web Store installs, click the Swan toolbar icon. For source installs, load <code>output/chrome-mv3</code> from <code>chrome://extensions</code>.</p>
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

For Chrome Web Store beta installs, you need:

- Chrome.
- An ElevenLabs account with a Conversational AI agent.
- A paid/upgraded Twilio phone number connected in ElevenLabs for AI calls.
- Optional: a Twilio account with an SMS-capable phone number.

For source-loaded installs, also install:

- Node.js 20 or newer.
- npm.
- A Chromium-based browser that supports unpacked extensions.

## 2. Build the extension

Skip this section for Chrome Web Store beta installs.

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

## 3. Load Swan in Chromium

Skip this section for Chrome Web Store beta installs.

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
| Phone Configuration | Recipient phone number, Start voice call toggle, Send optional SMS toggle, monitoring toggle, cooldown minutes |
| ElevenLabs Voice Call | API key, Agent ID, Agent phone number ID |
| Twilio SMS | Optional Account SID, Auth Token, SMS From number |

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
