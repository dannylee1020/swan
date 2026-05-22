# Configure Swan

Swan stores settings in `chrome.storage.local` for the loaded extension profile. There is no hosted Swan backend in v0.

## General settings

Open **Swan settings** and start with **General**.

| Setting | What to enter |
| --- | --- |
| Recipient number | The phone number that should receive SMS and AI calls. Use E.164 format, for example `+15551234567`. |
| Send SMS | Keep enabled if Twilio should send a text message for detections and test alerts. |
| Start AI Call | Keep enabled if ElevenLabs should start a call for detections and test alerts. |
| Enable monitoring | Keep enabled to watch configured domains in this browser. |
| Cooldown minutes | Minimum time before Swan sends another intervention for the same browsing pattern. |

Click the Save button for the card after changing these values.

## Twilio SMS card

Enter:

- Account SID.
- Auth Token.
- From number.

The From number must be SMS-capable. Trial Twilio accounts usually require the recipient phone number to be verified before SMS delivery works.

## ElevenLabs AI Call card

Enter:

- API key.
- Agent ID.
- Agent phone number ID.

The Agent phone number ID is not the literal phone number. It is the ElevenLabs phone-number identifier created after connecting or importing a number inside ElevenLabs.

## Domain Tracking page

Use **Domain Tracking** to manage domains Swan watches.

- Seed rules ship with Swan and can be disabled.
- Custom rules are added by the user.
- Subdomains match automatically. A rule for `example.com` also matches `sub.example.com`.
- Swan normalizes entered domains, so you can paste a bare domain or URL.

## Logs page

Use **Logs** to verify behavior after a test or real detection.

Each event records:

- Timestamp.
- Detected domain.
- Matching rule.
- SMS status.
- Call status.

Statuses can be `success`, `failed`, `skipped`, or `pending`.

## Security model

Provider credentials are stored in browser extension local storage for the loaded extension profile. Treat Swan v0 as a self-hosted developer setup, not a managed production secret system.

See [Storage and privacy](../reference/storage-privacy.md) for details.
