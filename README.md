# Swan

Swan is a self-hosted browser extension that helps interrupt porn urges with immediate SMS and AI phone-call interventions.

V0 is built for developers and technical users. You run the extension locally in Chromium and connect your own SMS/call providers.

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
- Twilio account for SMS
- ElevenLabs account for AI phone calls

## Run

Install dependencies:

```bash
npm install
```

Start the extension:

```bash
npm run dev
```

Load the extension in Chromium:

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select `.output/chrome-mv3`

Open the Swan options page, configure your phone/provider settings, add tracked domains, and click **Send test alert**. For calls, configure an ElevenLabs agent and phone number before adding the agent IDs in Swan.

## Build

```bash
npm run build
```

Load `.output/chrome-mv3` through `chrome://extensions`.

## Validate

```bash
npm run test
npm run typecheck
npm run build
```
