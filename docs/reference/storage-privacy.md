# Storage and Privacy

Swan v0 does not send data to a Swan-operated backend. The downloadable extension and source-loaded builds use the same local-storage and bring-your-own-provider model.

## Local extension storage

Swan stores these values in `chrome.storage.local`:

- User settings.
- ElevenLabs credentials.
- Optional Twilio SMS credentials.
- Domain rules.
- Event history.

These values are local to the installed extension in the browser profile.

Swan can also bundle local import data from `config.yaml` during build. That
file is a user-managed setup source, not runtime storage. After clicking
**Import data**, Swan writes the imported values into `chrome.storage.local`.

## Provider data

Swan sends only the data required to deliver an intervention through the configured providers:

- ElevenLabs receives the recipient number, agent configuration identifiers, and minimal event metadata for the call.
- If SMS is enabled, Twilio receives the recipient number, From number, and SMS body.

Provider consoles may retain logs according to their own policies.

## Extension permissions

Swan requests the minimum browser permissions needed for the current product:

- `storage` stores settings, domain rules, provider credentials, and event history locally.
- `webNavigation` observes top-level navigation so Swan can match configured domains.
- Host access for ElevenLabs and Twilio API endpoints lets Swan start user-configured calls and optional SMS alerts.

Swan does not request broad provider access to a Swan-hosted server because no Swan-hosted server exists in v0.

## Credential handling

Provider credentials are stored in browser extension local storage in v0. This is acceptable for a self-hosted developer setup, but it is not a managed production secret model.

Use a separate browser profile if you want to isolate Swan from day-to-day browsing state.

## Removing local data

Removing the extension from the browser can remove extension-local data for that profile. Browser behavior can vary by profile and extension ID, so export or record important configuration before removing Swan.

## Practical precautions

- Keep your checkout private if it contains local notes or ignored files.
- Keep `config.yaml` private; it can contain provider credentials.
- Do not commit provider credentials.
- Rotate Twilio and ElevenLabs credentials if they are exposed.
- Use the provider dashboards to review message and call logs.
