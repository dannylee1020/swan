---
layout: doc
title: Privacy
description: What Swan stores locally, what it sends to providers, and what it does not collect.
---

# Privacy

Last updated: June 3, 2026

Swan is open-source browser extension software. It does not operate a hosted backend for the v0 extension, and Swan itself does not have accounts, payments, analytics, ads, or data sale.

The loaded extension still handles sensitive local data. This page explains what stays in the browser, what is sent to configured providers, and how to remove or protect that data.

## Local extension storage

Swan stores these values in `chrome.storage.local` for the installed extension profile:

- Extension settings.
- Recipient phone number.
- ElevenLabs API key, Agent ID, and Agent phone number ID.
- Domain tracking rules.
- Detection event history and provider delivery status.

This data stays in the installed browser profile unless you export it, remove the extension, clear profile data, or the browser changes extension storage behavior.

If you build Swan from source, Swan can also bundle local import data from `config.yaml`. That file is a user-managed setup source, not runtime storage. After you click **Import data**, Swan writes the imported values into `chrome.storage.local`.

## Provider data

Swan sends data only when an alert is triggered or when you click **Send test alert**:

- ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the call.

Provider consoles may retain call, billing, diagnostic, or compliance records according to their own policies. Swan does not control those provider records.

## Chrome Web Store data use

For Chrome Web Store disclosure purposes, Swan handles:

- Personally identifiable information: the recipient phone number you enter.
- Authentication information: user-configured ElevenLabs credentials.
- Website content or browsing activity: configured domain rules and detected domain event logs.
- Personal communications: call delivery status metadata from the provider you configure.

Swan uses this data only to provide the configured intervention feature. Swan does not sell this data, use it for advertising, use it for credit or lending, or transfer it to data brokers or information resellers. Swan transfers data only to ElevenLabs when needed to start a call or report delivery status.

## Browser permissions

Swan requests:

- `storage` to save settings, domain rules, provider credentials, and event history locally.
- `webNavigation` to observe top-level browser navigation so Swan can match configured domains.
- Host access for the ElevenLabs API endpoint so the extension can start user-configured calls.

Swan does not inspect page content, collect browsing history broadly, run a proxy, install DNS filtering, or send browsing data to a Swan-operated server.

## Credential handling

Provider credentials are stored in browser extension local storage in v0. Treat Swan as browser-local software connected to your own provider accounts, not a managed production secret store.

Practical precautions:

- Use a separate browser profile if you want to isolate Swan from day-to-day browsing state.
- Keep `config.yaml` private; it can contain provider credentials.
- Do not commit provider credentials.
- Rotate ElevenLabs credentials if they are exposed.
- Use provider dashboards to review call and message logs.

## User control

You can:

- Disable Swan from the General settings card.
- Disable voice calls.
- Edit or disable tracked domains.
- Delete the extension from the browser profile.
- Rotate provider credentials in ElevenLabs.

Removing the extension can remove extension-local data for that profile. Browser behavior can vary by profile and extension ID, so export or record important configuration before removing Swan.

## Contact

For privacy questions or security reports, open an issue at:

https://github.com/dannylee1020/swan/issues
