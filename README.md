# Swan

Swan is a browser extension that helps you break out of the porn cycle by calling you at the moment of urge.

It is built for people who want a transparent recovery-support tool they can inspect, install, and connect to their own provider accounts.

## Background

Porn is addiction disguised as leisure. The common excuse that "everyone watches, so it does not matter," is bullshit. It matters a lot. Its damage is subtle: it slowly poisons attention, motivation, confidence, and the capacity for real love. Most people do not notice the cost because it rarely arrives as one dramatic collapse. It is a cunning pattern of death by a thousand cuts, quietly draining productivity and self-respect until the damage feels normal.

## What Swan Does

- Monitors browser navigation for configured NSFW domains
- Starts an AI phone call when a tracked domain is opened
- Optionally sends an SMS alert
- Redirects the browser to an intervention page
- Stores settings, domain rules, and event history in browser local storage

Swan is not a passive blocker. The core loop is narrow: detect the risky moment, interrupt quickly, and make the next action harder to ignore.

## How It Works

- Swan runs as a Chromium Manifest V3 extension.
- Detection uses configured domain rules and top-level navigation events.
- AI calls use your ElevenLabs Conversational AI agent and connected phone number.
- Optional SMS alerts use your Twilio account and phone number.
- Swan v0 does not run a Swan-hosted backend, proxy, DNS filter, localhost daemon, or page-content classifier.

## Requirements

- Node.js 20 or newer
- npm
- Chromium-based browser
- ElevenLabs account and Conversational AI agent
- Paid/upgraded Twilio phone number connected to the ElevenLabs agent for AI calls
- Optional: Twilio account and SMS-capable phone number for SMS alerts

Swan starts AI calls through ElevenLabs' native Twilio outbound-call integration. Trial Twilio accounts can ring but may stop after the trial message instead of connecting the ElevenLabs agent. Use a paid/upgraded Twilio number, import or verify it in ElevenLabs, and link it to the Swan agent.

## Quick Start

The first downloadable release is planned as an unlisted Chrome Web Store beta. Until that release link is available, or if you want to inspect and modify Swan yourself, build it from source:

Prepare Swan:

```bash
npm run setup
```

This installs dependencies when needed, builds the extension, prints the absolute extension path, and opens `chrome://extensions` when possible.

If you want repeatable local setup, copy `config.example.yaml` to `config.yaml` before running setup. Swan will bundle that local config as import data, which you can later apply from the General page.

Load the extension in Chromium:

1. Enable **Developer Mode**
2. Click **Load unpacked**
3. Select the `output/chrome-mv3` path printed by `npm run setup`

After loading, Swan opens the settings tab automatically on first install. If it does not, click the Swan extension icon. Configure your phone and provider settings, add tracked domains, and click **Send test alert**.

Start with:

- [Quick start](docs/guide/quick-start.md)
- [Install Swan](docs/guide/install.md)
- [Provider setup](docs/provider-setup.md)
- [Test and verify](docs/guide/test-and-verify.md)

## Provider Setup

Swan needs these values in the options page:

- Recipient phone number in E.164 format, for example `+15551234567`
- ElevenLabs API key
- ElevenLabs Agent ID
- ElevenLabs Agent phone number ID
- Optional SMS: Twilio Account SID, Auth token, and SMS From number

Use [Provider setup](docs/provider-setup.md) for the full ElevenLabs and Twilio walkthrough. Configure and test the ElevenLabs agent before relying on Swan interventions.

## Limitations

- Swan v0 detects configured domains only.
- It ships with a small seed list of NSFW domains and matches subdomains of tracked domains.
- It does not inspect page content, classify images or videos, install DNS rules, run a proxy, or block at the operating-system level.
- The Chrome Web Store path is an unlisted beta release target; source-loaded installation remains the development and audit path.
- It is recovery-support software, not medical advice, therapy, or clinical treatment.

## Privacy and Costs

Settings, rules, provider credentials, and logs are stored in browser extension local storage. Treat Swan v0 as self-hosted developer software, not a managed production secret store.

Swan does not send data to a Swan-hosted backend. Alert delivery sends the minimum needed request data to the providers you configure: ElevenLabs for AI calls and Twilio for optional SMS. Those providers may store call, message, billing, and diagnostic records according to their own policies.

The software is open source, but phone calls and SMS are not free to operate. You bring and pay for your own ElevenLabs and Twilio accounts.

## Development

Run WXT in development mode:

```bash
npm run dev
```

Load `output/chrome-mv3` through `chrome://extensions`.

Build the extension:

```bash
npm run build
```

Run the docs site:

```bash
npm run docs:dev
```

Preview the built docs:

```bash
npm run docs:build
npm run docs:preview
```

The preview runs at `http://127.0.0.1:5292`.

## Contributing

Swan is early. Useful contributions include setup feedback, safer default domain rules, provider reliability notes, documentation fixes, and issues that describe where the install or provider setup flow is confusing.

If you try Swan locally, open an issue with what worked, what failed, and which browser/provider setup you used.

## Validate

```bash
npm run test
npm run typecheck
npm run build
npm run docs:build
```

For Chrome Web Store packaging, use the release-safe commands:

```bash
npm run build:store
npm run zip:store
```
