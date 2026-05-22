# Swan

Swan is a self-hosted browser extension that helps interrupt porn urges with immediate SMS and AI phone-call interventions.

## Background

Porn is addiction disguised as leisure. The common excuse that "everyone
watches, so it does not matter," is bullshit. It matters a lot. Its damage is subtle: it
slowly poisons attention, motivation, confidence, and the capacity for real
love. Most people do not notice the cost because it rarely arrives as one
dramatic collapse. It is a cunning pattern of death by a thousand cuts, quietly
draining productivity and self-respect until the damage feels normal.

## What It Does

- Monitors browser navigation for configured NSFW domains
- Triggers an SMS alert
- Starts an AI phone call
- Redirects the browser to an intervention page
- Stores settings, rules, and event history in browser local storage

## Requirements

- Node.js
- npm
- Chromium-based browser
- Twilio account and phone number for SMS alerts
- ElevenLabs account, Conversational AI agent, and connected phone number for AI calls

Swan uses Twilio directly for SMS. It starts AI calls through ElevenLabs'
native Twilio outbound-call integration, so any Twilio number used for calls
must also be imported or verified in ElevenLabs and linked to the agent.

## Run

Prepare Swan:

```bash
npm run setup
```

This installs dependencies when needed, builds the extension, prints the
absolute extension path, and opens `chrome://extensions` when possible.

Load the extension in Chromium:

1. Enable **Developer Mode**
2. Click **Load unpacked**
3. Select the `output/chrome-mv3` path printed by `npm run setup`

After loading, Swan opens the full settings tab automatically on first install.
If it does not, click the Swan extension icon to open setup. Configure your
phone/provider settings, add tracked domains, and click **Send test alert**.

Swan v0 detects configured domains only. It ships with a small seed list of
NSFW domains, matches subdomains of tracked domains, and lets you add or disable
rules in the options page. It does not inspect page content or run AI-based
classification.

Provider setup:

1. Enter your recipient phone number.
2. Add Twilio Account SID, Auth token, and SMS From number.
3. Create an ElevenLabs Conversational AI agent.
4. Connect a phone number to that agent in ElevenLabs. If it is a Twilio number, import or verify it in ElevenLabs first.
5. Add the ElevenLabs API key, Agent ID, and Agent phone number ID in Swan.

For the full self-hosting guide, run the docs site:

```bash
npm run docs:dev
```

Or start with [Quick start](docs/guide/quick-start.md) and [Provider setup](docs/provider-setup.md).

Preview the built docs:

```bash
npm run docs:build
npm run docs:preview
```

The preview runs at `http://127.0.0.1:5292`.

## Development

Run WXT in development mode:

```bash
npm run dev
```

Load `output/chrome-mv3` through `chrome://extensions`.

## Build

```bash
npm run build
```

Load `output/chrome-mv3` through `chrome://extensions`.

## Validate

```bash
npm run test
npm run typecheck
npm run build
npm run docs:build
```
