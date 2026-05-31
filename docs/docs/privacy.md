---
layout: doc
title: Privacy
description: What Swan stores locally, what it sends to providers, and what it does not collect.
---

# Privacy

Last updated: May 31, 2026

Swan is open-source browser extension software. It does not operate a hosted backend for the v0 extension, and Swan itself does not have accounts, payments, analytics, ads, or data sale.

The loaded extension still handles sensitive local data. This page explains what stays in the browser, what is sent to configured providers, and how to remove or protect that data.

## Local extension storage

Swan stores these values in `chrome.storage.local` for the installed extension profile:

- Extension settings.
- Recipient phone number.
- ElevenLabs API key, Agent ID, and Agent phone number ID.
- Optional Twilio Account SID, API Key SID, client secret, and SMS From number, only when direct SMS is configured.
- Domain tracking rules.
- Detection event history and provider delivery status.

This data stays in the installed browser profile unless you export it, remove the extension, clear profile data, or the browser changes extension storage behavior.

If you build Swan from source, Swan can also bundle local import data from `config.yaml`. That file is a user-managed setup source, not runtime storage. After you click **Import data**, Swan writes the imported values into `chrome.storage.local`.

## Provider data

Swan sends data only when an alert is triggered or when you click **Send test alert**:

- ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the call.
- Twilio receives the recipient number, SMS From number, and alert message body only when optional SMS is enabled.

Provider consoles may retain call, SMS, billing, diagnostic, or compliance records according to their own policies. Swan does not control those provider records.

## Browser permissions

Swan requests:

- `storage` to save settings, domain rules, provider credentials, and event history locally.
- `webNavigation` to observe top-level browser navigation so Swan can match configured domains.
- Host access for ElevenLabs and Twilio API endpoints so the extension can start user-configured calls and optional SMS alerts.

Swan does not inspect page content, collect browsing history broadly, run a proxy, install DNS filtering, or send browsing data to a Swan-operated server.

## Credential handling

Provider credentials are stored in browser extension local storage in v0. Treat Swan as browser-local software connected to your own provider accounts, not a managed production secret store.

Practical precautions:

- Use a separate browser profile if you want to isolate Swan from day-to-day browsing state.
- Keep `config.yaml` private; it can contain provider credentials.
- Do not commit provider credentials.
- Rotate ElevenLabs or Twilio credentials if they are exposed.
- Use provider dashboards to review call and message logs.

## User control

You can:

- Disable Swan from the General settings card.
- Disable voice calls or optional SMS independently.
- Edit or disable tracked domains.
- Delete the extension from the browser profile.
- Rotate provider credentials in ElevenLabs or Twilio.

Removing the extension can remove extension-local data for that profile. Browser behavior can vary by profile and extension ID, so export or record important configuration before removing Swan.

## Contact

For privacy questions or security reports, open an issue at:

https://github.com/dannylee1020/swan/issues
