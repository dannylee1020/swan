# Swan

Swan is a browser extension that helps you break out of the porn addiction cycle by calling you at the moment of urge.

It is built for people who want a transparent recovery-support tool they can inspect, install, and connect to their own provider accounts.

## What Swan Does

- Monitors browser navigation for configured NSFW domains
- Starts a phone call when a tracked domain is opened, SMS optional configuration
- Redirects the browser to an intervention page
- Stores settings, domain rules, and event history in browser local storage

Swan is not a passive blocker. The core loop is narrow: detect the risky moment, interrupt quickly, and break one out of the cycle.

## How It Works

- Swan runs as a local browser extension.
- Detection uses configured domain rules and top-level navigation events.
- Makes the call when listed domain is detected, interrupts the lust at the moment and prevents the addiction cycle.

## Requirements

- Chromium-based browser for the default release install, Firefox currently in testing
- ElevenLabs account for the voice-call provider
- Twilio phone number connected inside ElevenLabs for calls. SMS setup optional
- For source builds only: Node.js 20 or newer and npm

Swan initiates voice calls through ElevenLabs' outbound-call API. Twilio is part of the phone number setup inside ElevenLabs, but Swan does not need Twilio credentials to start voice calls. Direct Twilio credentials are only used for optional SMS alerts.

## Quick Start

Install the latest Chromium release on macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Install the latest Chromium release on Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer downloads the latest GitHub Release, extracts it into a stable local folder, prints the extension path, and opens `chrome://extensions` when possible.

Load Swan in Chromium:

1. Enable **Developer Mode**
2. Click **Load unpacked**
3. Select the extension path printed by the installer

To update, rerun the installer and click the reload button for Swan in `chrome://extensions`. Do not remove Swan from the browser unless you intend to clear extension-local settings.

If you want repeatable local setup from source, copy `config.example.yaml` to `config.yaml` before running `npm run setup`. Swan will bundle that local config as import data, which you can later apply from the General page.

Firefox is not a first-class v0 install path. If you want to test it manually:

```bash
npm run setup:firefox
```

Then open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `output/firefox-mv2/manifest.json`. Firefox temporary add-ons are removed when Firefox restarts, so this path may require more manual work than Chromium.

After loading, Swan opens the settings tab automatically on first install. If it does not, click the Swan extension icon. Configure your phone and provider settings, add tracked domains, and click **Send test alert**.

Start with:

- [Quick start](https://swan-oss.com/docs/guide/quick-start)
- [Install Swan](https://swan-oss.com/docs/guide/install)
- [Provider setup](https://swan-oss.com/docs/provider-setup)
- [Test and verify](https://swan-oss.com/docs/guide/test-and-verify)

## Provider Setup

Swan needs these values in the options page:

- Recipient phone number in E.164 format, for example `+15551234567`
- Twilio account for outbound number and connecting to Elevenlabs
- ElevenLabs API key
- ElevenLabs Agent ID
- ElevenLabs Agent phone number ID

Use [Provider setup](https://swan-oss.com/docs/provider-setup) for the full ElevenLabs walkthrough and optional Twilio SMS setup. Configure and test the ElevenLabs agent before relying on Swan interventions.

## Limitations

- Swan v0 detects configured domains only.
- It ships with a small editable seed list of NSFW domains and matches subdomains of tracked domains.
- It does not inspect page content, classify images or videos, install DNS rules, run a proxy, or block at the operating-system level.
- Swan currently installs by loading a local extension build. Chromium is the supported v0 path. Firefox Desktop uses a temporary developer add-on and is not first-class supported in this version.
- It is recovery-support software, not medical advice, therapy, or clinical treatment.

## Privacy and Costs

Settings, rules, provider credentials, and logs are stored in browser extension local storage. Treat Swan v0 as browser-local software that uses provider accounts you control, not a managed production secret store.

Swan does not send data to any server. Alert delivery sends the minimum needed request data to the providers you configure: ElevenLabs for conversational agent and Twilio for phone infrastructure and optional SMS. Those providers may store call, message, billing, and diagnostic records according to their own policies.

The software is open source, but phone calls and SMS are not free to operate. BYOK (Bring Your Own Key).

## Development

Run WXT in development mode:

```bash
npm run dev
```

Load the generated `output/chrome-mv3-dev` directory through `chrome://extensions`.

Run the Firefox development target:

```bash
npm run dev:firefox
```

Load the generated `output/firefox-mv2-dev/manifest.json` through `about:debugging`.

Firefox support is experimental in v0. Use it for compatibility testing, not as the primary install path.

Build the extension:

```bash
npm run build
```

Run the source checkout setup path:

```bash
npm run setup
```

Build the Firefox extension:

```bash
npm run build:firefox
```

## Contributing

Swan is early. Useful contributions include setup feedback, seed-domain tuning, provider reliability notes, documentation fixes, and issues that describe where the install or provider setup flow is confusing.

If you try Swan locally, open an issue with what worked, what failed, and which browser/provider setup you used.
