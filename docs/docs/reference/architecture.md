# Architecture

Swan Core is a browser extension with two delivery modes. BYOK watches configured domains, starts an immediate phone intervention through user-provided providers, records the result locally, and redirects the tab to an intervention page. Swan Managed keeps detection and local logs in the extension, but routes call delivery through Swan Server for signed-in subscribers.

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
    -> delivery mode and monitoring toggle
    -> BYOK phone number and ElevenLabs call credentials
    -> optional Swan Managed OTP sign-in, subscription, and entitlement state
    -> editable seed and custom tracked domains
    -> chrome.storage.local

Detection loop
  User opens a top-level HTTP(S) page
    -> background service worker receives pre-navigation event
    -> URL is normalized to a domain
    -> enabled exact/subdomain rules are checked
    -> no match: page loads normally
    -> match: urge event is created
    -> enabled check runs
    -> pending or skipped event status is saved locally
    -> tab redirects to the intervention page
    -> BYOK: ElevenLabs call continues in background
    -> Managed: browser event posts to Swan Server with event-ingest token
    -> intervention page shows detected domain and refreshed alert status
```

## Runtime flow

1. The background service worker listens to top-level pre-navigation events.
2. The visited URL is normalized to a domain.
3. Swan checks enabled rules for exact-domain or subdomain matches.
4. A match creates an urge event with domain-level metadata.
5. Swan reads settings from `chrome.storage.local`.
6. Disabled monitoring saves a skipped event.
7. Enabled alerts save a pending event immediately.
8. The tab redirects to Swan's intervention page.
9. BYOK starts the standard AI phone call when configured. Managed posts the normalized event to Swan Server, which checks entitlement before requesting delivery.
10. Provider success, server acceptance, failure, or skipped status is saved locally.
11. The intervention page asks the background worker for the saved event and displays refreshed status.

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
| Providers | `lib/providers/elevenlabs.ts`, `lib/providers/managed.ts` |
| Managed client | `lib/managed/client.ts` |
| Build/setup helpers | `scripts/setup.mjs`, `scripts/targets.mjs`, `scripts/generate-bootstrap.mjs` |

## Local data

Swan stores runtime data in `chrome.storage.local`:

- Settings and provider credentials.
- Selected delivery mode and Swan Managed account tokens when signed in.
- Editable seed and user domain rules.
- Detection event history.

Events store the normalized domain, matched rule id, timestamp, and call status. Swan does not store full page URLs for provider alerts.

## Provider boundary

Swan keeps external delivery behind a provider interface:

- `CallProvider` starts AI calls.

The current implementations are:

- ElevenLabs for BYOK AI voice calls.
- Swan Managed for subscription-backed managed calls.

ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the BYOK call. Swan Managed receives only the matched domain, local rule id, event id, timestamp, and event-ingest token for managed browser events. The extension does not sync the full tracked-domain list to Swan Managed in v1.

## What Swan does not run

Swan does not include:

- A localhost daemon.
- DNS filtering.
- Proxy filtering.
- Page-content classification.
- OS-level blocking.

The runtime unit is still the browser extension. Swan Managed adds hosted account, entitlement, billing, and call-delivery infrastructure, but the extension remains the owner of browser detection, local rules, and local logs.
