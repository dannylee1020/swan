# Configure Swan

Swan stores settings in `chrome.storage.local` for the loaded extension profile. BYOK calls use your local provider settings. Managed calls use Swan's hosted service for account, payment, entitlement, and call delivery. Managed call delivery requires an active Swan Managed subscription or trial.

## General settings

Open **Swan settings** and start with **Status**.

| Setting | What to enter |
| --- | --- |
| Recipient number | The phone number that should receive voice calls. Use E.164 format, for example `+15551234567`. |
| Start voice call | Keep enabled if ElevenLabs should start a call for detections and test alerts. |
| Enable monitoring | Keep enabled to watch configured domains in this browser. |

Click the Save button for the card after changing these values.

## Import data

The General page can import bundled setup data generated from a local
`config.yaml` file. This is a source-build path, not the default Chrome Web Store path.

1. Copy `config.example.yaml` to `config.yaml`.
2. Fill in the values you want to manage locally.
3. Run `npm run dashboard`.
4. Load or reload the extension.
5. Open **General** and click **Import data**.

Import data merges configured settings and tracked domains into the current
browser profile. It does not delete existing rules or logs. `config.yaml` is
ignored by Git because it can contain provider credentials.

## ElevenLabs Voice Call card

Enter:

- API key.
- Agent ID.
- Agent phone number ID.

The Agent phone number ID is not the literal phone number. It is the ElevenLabs phone-number identifier created after connecting or importing a number inside ElevenLabs.

## Domain Tracking page

Use **Domain Tracking** to manage domains Swan watches.

- Seed rules ship with Swan and can be disabled or removed.
- Custom rules are added by the user.
- Subdomains match automatically. A rule for `example.com` also matches `sub.example.com`.
- Swan normalizes entered domains, so you can paste a bare domain or URL.

## Logs page

Use **Logs** to verify behavior after a test or real detection.

Each event records:

- Timestamp.
- Detected domain.
- Matching rule.
- Call status.

Statuses can be `success`, `failed`, `skipped`, or `pending`.

## Security model

Provider credentials are stored in browser extension local storage for the loaded extension profile. Treat Swan v0 as browser-local software connected to your own provider accounts, not a managed production secret system.

See [Privacy](../privacy.md) for details.
