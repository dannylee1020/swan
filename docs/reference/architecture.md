# Architecture

Swan v0 is a browser-first, self-hosted Chromium extension.

## Runtime flow

1. The background service worker listens to top-level navigation events.
2. The URL is normalized to a domain.
3. Swan checks the domain against enabled rules.
4. A match creates an urge event in local extension storage.
5. Cooldown logic decides whether to send alerts.
6. ElevenLabs starts the AI phone call when enabled and configured.
7. Twilio sends an optional SMS alert when enabled and configured.
8. The browser tab redirects to Swan's intervention page.
9. The options page shows settings, domain rules, and event logs.

## Project shape

| Area | Files |
| --- | --- |
| Background runtime | `entrypoints/background.ts` |
| Options UI | `entrypoints/options/main.tsx`, `entrypoints/options/style.css` |
| Intervention page | `entrypoints/intervention/main.tsx`, `entrypoints/intervention/style.css` |
| Storage helpers | `lib/storage.ts`, `lib/types.ts` |
| Detection logic | `lib/detection.ts`, `lib/domain.ts`, `lib/defaults.ts` |
| Alert orchestration | `lib/alerts.ts` |
| Providers | `lib/providers/twilio.ts`, `lib/providers/elevenlabs.ts` |

## Provider boundary

Swan keeps external delivery behind provider interfaces:

- `SmsProvider` sends SMS alerts.
- `CallProvider` starts AI calls.

The current implementations are:

- ElevenLabs for standard AI voice calls.
- Twilio for optional SMS.

## What Swan does not run

Swan v0 does not include:

- A Swan-hosted backend.
- A localhost daemon.
- DNS filtering.
- Proxy filtering.
- Page-content classification.
- OS-level blocking.

The self-hosted unit is the browser extension loaded from your local checkout.
