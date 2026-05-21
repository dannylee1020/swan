# Swan

Swan is a self-hosted, open-source browser extension for interrupting porn urges with immediate SMS and AI phone-call interventions.

V0 is built for developers and technical users. You build the extension from source, load it into your own Chromium browser, and connect your own Twilio and Retell accounts.

## Why

Most blockers focus on preventing access. Swan focuses on interrupting the urge loop at the moment it starts.

When browser activity crosses a configured NSFW domain, Swan creates immediate friction and routes the user into a phone-first intervention before the behavior escalates.

## How It Works

1. Swan runs as a Chromium browser extension loaded from source.
2. The background worker monitors top-level browser navigation.
3. If the visited domain matches the local NSFW blocklist, Swan creates a local urge event.
4. Swan sends an SMS through the user's Twilio account.
5. Swan starts an AI phone call through the user's Retell account.
6. The browser redirects to a simple intervention page showing alert status.

## Privacy And Hosting Model

- No Swan-hosted backend.
- No analytics or telemetry.
- Settings, blocklist, and event history are stored in browser local storage.
- Full URLs are not stored by default; Swan records normalized domains for detected events.
- Alert delivery sends minimal event metadata to the user-configured Twilio and Retell providers.

## V0 Scope

- Chromium extension
- Source-loaded developer install
- Domain-based NSFW detection
- Local settings and event history
- Twilio SMS alerts
- Retell AI phone calls
- Editable local blocklist
- Cooldown protection to avoid repeated alert spam

Not included in v0:

- Chrome Web Store distribution
- Desktop daemon
- OS-level blocking
- Proxy or DNS enforcement
- Page-content or image classification
- In-browser AI chat
- Hosted backend

## Requirements

- Node.js
- npm
- Chromium-based browser
- Twilio account for SMS
- Retell account for AI phone calls

## Run Swan

Install dependencies:

```bash
npm install
```

Start the extension in development mode:

```bash
npm run dev
```

Keep this command running while developing. WXT writes the Chromium extension build to `.output/chrome-mv3`.

Load Swan in Chromium:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked**.
4. Select `.output/chrome-mv3`.
5. Click the Swan extension icon or open its options page.

Configure Swan:

1. Add your phone number.
2. Add Twilio credentials for SMS.
3. Add Retell credentials for AI phone calls.
4. Add or enable tracked NSFW domains.
5. Click **Send test alert** to verify SMS and phone-call delivery.

Test the detection flow by visiting a tracked domain. Swan should create an urge event, trigger SMS/call delivery, and redirect the tab to the intervention page.

For a production build:

```bash
npm run build
```

Then load `.output/chrome-mv3` through `chrome://extensions` the same way.

If changes do not appear in the browser, reload Swan from `chrome://extensions`.

## Retell Agent Prompt

Configure the Retell agent as a short intervention call, not a therapy session:

```text
You are Swan, an immediate urge-interruption call. The user was just detected visiting a configured NSFW site. Keep them on the phone, ask them to stand up and move away from the device, use calm direct language, avoid shame, and keep the conversation focused on getting through the next 10 minutes.
```

## Validate

Run tests:

```bash
npm run test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build the extension:

```bash
npm run build
```

## Distribution

V0 is source-loaded for developers and technical users. Chrome Web Store distribution can come later, but it is not the primary v0 path.
