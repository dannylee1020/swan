---
layout: doc
title: Privacy Policy
description: How Swan stores local data and what it sends to configured alert providers.
---

# Privacy Policy

Last updated: May 27, 2026

Swan is a browser extension for adult-site urge intervention. It watches browser navigation for configured domains, redirects matched visits to an intervention page, and can start an AI phone call through ElevenLabs or send an optional SMS through Twilio.

Swan does not operate a hosted backend for the v0 extension. Settings, tracked domains, and event logs are stored locally in the browser profile where the extension is installed.

## Data stored locally

Swan stores these values in `chrome.storage.local`:

- Extension settings.
- Recipient phone number.
- ElevenLabs API key, Agent ID, and Agent phone number ID.
- Optional Twilio Account SID, Auth Token, and SMS From number.
- Domain tracking rules.
- Detection event history and provider delivery status.

This data stays in the installed browser profile unless you export it, remove the extension, clear profile data, or the browser changes extension storage behavior.

## Data sent to providers

Swan sends data only when an alert is triggered or when you click **Send test alert**:

- ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the call.
- Twilio receives the recipient number, SMS From number, and alert message body when optional SMS is enabled.

ElevenLabs and Twilio may keep call, SMS, billing, diagnostic, and compliance records under their own policies. Swan does not control those provider records.

## Browser permissions

Swan requests:

- `storage` to save settings, rules, and logs locally.
- `webNavigation` to detect top-level browser navigation and match configured domains.
- Host access for ElevenLabs and Twilio API endpoints so the extension can start calls and optional SMS alerts from the browser extension context.

Swan does not inspect page content, collect browsing history broadly, run a proxy, install DNS filtering, or send browsing data to a Swan-operated server.

## User control

You can:

- Disable Swan from the General settings card.
- Disable voice calls or optional SMS independently.
- Edit or disable tracked domains.
- Delete the extension from the browser profile.
- Rotate provider credentials in ElevenLabs or Twilio if they are exposed.

## Contact

For privacy questions or security reports, open an issue at:

https://github.com/dannylee1020/swan/issues
