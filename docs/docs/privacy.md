---
layout: doc
title: Privacy
description: What Swan stores locally, what it sends to providers, and what it does not collect.
---

# Privacy

Last updated: June 11, 2026

Swan is open-source browser extension software with two delivery modes. BYOK uses provider credentials stored in the browser. Swan Managed uses a Swan-operated server for account, payment, entitlement, and managed call delivery.

The loaded extension still handles sensitive local data. This page explains what stays in the browser, what is sent to configured providers, and how to remove or protect that data.

## Local extension storage

Swan stores these values in `chrome.storage.local` for the installed extension profile:

- Extension settings.
- Recipient phone number.
- Selected delivery mode.
- ElevenLabs API key, Agent ID, and Agent phone number ID.
- Swan Managed account tokens and entitlement state when you sign in to Managed.
- Domain tracking rules.
- Detection event history and provider delivery status.

This data stays in the installed browser profile unless you export it, remove the extension, clear profile data, or the browser changes extension storage behavior.

If you build Swan from source, Swan can also bundle local import data from `config.yaml`. That file is a user-managed setup source, not runtime storage. After you click **Import data**, Swan writes the imported values into `chrome.storage.local`.

## Provider and managed data

Swan sends data only when an alert is triggered or when you click **Send test alert**:

- In BYOK mode, ElevenLabs receives the recipient number, agent identifiers, and minimal event metadata needed to start the call.
- In Managed mode, Swan Server receives the matched domain, local rule id, event id, timestamp, and event-ingest token needed to check entitlement and request the managed call.

Provider consoles and Swan Managed may retain call, billing, diagnostic, entitlement, or compliance records according to their own policies and operational needs.

## Chrome Web Store data use

For Chrome Web Store disclosure purposes, Swan handles:

- Personally identifiable information: the recipient phone number you enter.
- Authentication information: user-configured ElevenLabs credentials and Swan Managed account tokens when Managed is enabled.
- Website content or browsing activity: configured domain rules and detected domain event logs.
- Personal communications: call delivery status metadata from the provider you configure.
- Payment information: Swan Managed subscription state and Stripe billing references when Managed is enabled.

Swan uses this data only to provide the configured intervention feature. Swan does not sell this data, use it for advertising, use it for credit or lending, or transfer it to data brokers or information resellers. BYOK transfers data only to ElevenLabs when needed to start a call or report delivery status. Managed transfers minimal intervention events to Swan Server for managed call delivery.

## Browser permissions

Swan requests:

- `storage` to save settings, domain rules, provider credentials, and event history locally.
- `webNavigation` to observe top-level browser navigation so Swan can match configured domains.
- Host access for the ElevenLabs API endpoint so the extension can start user-configured calls.
- Host access for the configured Swan Managed API endpoint when the extension build includes Managed mode.

Swan does not inspect page content, collect browsing history broadly, run a proxy, install DNS filtering, or sync your full tracked-domain list to Swan Managed in v1.

## Credential handling

BYOK provider credentials are stored in browser extension local storage. Swan Managed account tokens are also stored locally so the extension can post managed intervention events.

Practical precautions:

- Use a separate browser profile if you want to isolate Swan from day-to-day browsing state.
- Keep `config.yaml` private; it can contain provider credentials.
- Do not commit provider credentials.
- Rotate ElevenLabs credentials if they are exposed.
- Sign out of Swan Managed if account tokens are exposed.
- Use provider dashboards to review call and message logs.

## User control

You can:

- Disable Swan from the General settings card.
- Disable voice calls.
- Edit or disable tracked domains.
- Switch between BYOK and Swan Managed.
- Sign out of Swan Managed.
- Delete the extension from the browser profile.
- Rotate provider credentials in ElevenLabs.

Removing the extension can remove extension-local data for that profile. Browser behavior can vary by profile and extension ID, so export or record important configuration before removing Swan.

## Contact

For privacy questions or security reports, open an issue at:

https://github.com/dannylee1020/swan/issues
