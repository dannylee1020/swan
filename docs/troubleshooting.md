# Troubleshooting

Start with the symptom that matches what you see.

## `npm run setup` fails

Run the manual steps to isolate the failure:

```bash
npm install
npm run build
```

If TypeScript or WXT generated types are missing, run:

```bash
npm run prepare
```

Then retry the build.

## Browser cannot load the extension

Confirm:

- You selected `output/chrome-mv3`, not the repository root.
- `output/chrome-mv3/manifest.json` exists.
- Developer Mode is enabled.
- The browser supports Manifest V3 extensions.

Rebuild if the output directory is missing:

```bash
npm run build
```

## Settings page did not open

Click the Swan extension icon from the browser toolbar. If it is hidden, open the browser extensions menu and pin Swan.

## SMS does not arrive

Check:

- Recipient phone number uses E.164 format, for example `+15551234567`.
- Twilio Account SID and Auth Token are correct.
- Twilio From number supports SMS.
- Trial-account recipient numbers are verified in Twilio.
- Twilio Messaging logs show the attempted message.

## AI call does not arrive

Check:

- ElevenLabs API key has access to Conversational AI calls.
- Agent ID is copied from the same ElevenLabs workspace as the API key.
- Agent phone number ID is copied from ElevenLabs phone-number settings.
- The phone number is connected or imported inside ElevenLabs.
- ElevenLabs call history shows the attempted outbound call.

Do not enter the literal phone number in the Agent phone number ID field.

## Logs show `skipped`

Swan skipped a channel when it was disabled or missing required configuration.

Review:

- Send SMS toggle.
- Start AI Call toggle.
- Recipient phone number.
- Twilio settings.
- ElevenLabs settings.

## Logs show `failed`

Open the provider console first:

- Twilio Messaging logs for SMS failures.
- ElevenLabs call history for call failures.

Then check the saved values in Swan settings.

## Domain did not trigger Swan

Confirm:

- Monitoring is enabled.
- The domain rule is enabled.
- You are visiting the domain in the same browser profile where Swan is loaded.
- The navigation is a top-level page load.
- The domain is normalized as expected in **Domain Tracking**.

Swan v0 does not inspect page content or non-browser traffic.

## Credentials disappeared

Swan stores credentials in `chrome.storage.local` for the installed extension. Removing the extension, loading a different build as a different extension ID, or using another browser profile can make settings appear missing.

## Need a clean reset

Remove Swan from `chrome://extensions`, rebuild if needed, then load `output/chrome-mv3` again. This can clear extension-local settings for that profile.
