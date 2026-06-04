# Architecture

Swan Core v0 is a browser-local extension. It watches configured domains, starts an immediate phone intervention through user-provided providers, records the result locally, and redirects the tab to an intervention page.

Chromium is the primary local install target. Firefox Desktop has a developer testing path. Both targets use the same core extension architecture.

## System map

```text
User setup
  npm run setup / npm run setup:firefox
    -> optional config.yaml becomes bundled swan-bootstrap.json
    -> WXT builds the extension output
    -> user loads Swan in the browser

User configuration
  Swan options page
    -> phone number, cooldown, monitoring toggle
    -> ElevenLabs call credentials
    -> optional Twilio SMS credentials
    -> editable seed and custom tracked domains
    -> chrome.storage.local

Detection loop
  User opens a top-level HTTP(S) page
    -> background service worker receives pre-navigation event
    -> URL is normalized to a domain
    -> enabled exact/subdomain rules are checked
    -> no match: page loads normally
    -> match: urge event is created
    -> cooldown and enabled checks run
    -> pending or skipped event status is saved locally
    -> tab redirects to the intervention page
    -> ElevenLabs call and optional Twilio SMS continue in background
    -> intervention page shows detected domain and refreshed alert status
```

## Runtime flow

1. The background service worker listens to top-level pre-navigation events.
2. The visited URL is normalized to a domain.
3. Swan checks enabled rules for exact-domain or subdomain matches.
4. A match creates an urge event with domain-level metadata.
5. Swan reads settings and recent events from `chrome.storage.local`.
6. Disabled monitoring or active cooldown saves a skipped event.
7. Allowed alerts save a pending event immediately.
8. The tab redirects to Swan's intervention page.
9. ElevenLabs starts the standard AI phone call when configured.
10. Twilio sends optional SMS when enabled and configured.
11. Provider success, failure, or skipped status is saved locally.
12. The intervention page asks the background worker for the saved event and displays refreshed status.

## Setup and configuration

Swan can be configured directly in the options page. Technical users can also create an ignored local `config.yaml` before build or setup. During build, Swan can generate a bundled `public/swan-bootstrap.json`; the extension imports that data only when the user clicks **Import data** in the General settings page.

The extension does not read local files or environment variables at runtime.

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
| Build/setup helpers | `scripts/setup.mjs`, `scripts/targets.mjs`, `scripts/generate-bootstrap.mjs` |

## Local data

Swan stores runtime data in `chrome.storage.local`:

- Settings and provider credentials.
- Editable seed and user domain rules.
- Detection event history.

Events store the normalized domain, matched rule id, timestamp, and call/SMS statuses. Swan does not store full page URLs for provider alerts.

## Provider boundary

Swan keeps external delivery behind provider interfaces:

- `SmsProvider` sends SMS alerts.
- `CallProvider` starts AI calls.

The current implementations are:

- ElevenLabs for standard AI voice calls.
- Twilio for optional SMS.

ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the call. Twilio receives the recipient number, from number, and a domain-only SMS body when SMS is enabled.

## What Swan does not run

Swan v0 does not include:

- A Swan-hosted backend.
- A localhost daemon.
- DNS filtering.
- Proxy filtering.
- Page-content classification.
- OS-level blocking.

The runtime unit is the browser extension. There is no Swan-operated backend in v0; the loaded extension uses the same provider and local-storage boundaries in every browser profile.
