# Troubleshooting

Start with the symptom that matches what you see.

## `npm run setup` fails

Run the manual steps to isolate the failure:

```bash
npm install
npm run build
```

For Firefox Desktop setup, use:

```bash
npm run build:firefox
```

If TypeScript or WXT generated types are missing, run:

```bash
npm run prepare
```

Then retry the build.

## Browser cannot load the extension

For Chromium, confirm:

- You selected the extension directory printed by the installer, not the repository root.
- `manifest.json` exists inside that extension directory.
- Developer Mode is enabled.
- The browser supports Manifest V3 extensions.

For Firefox Desktop, confirm:

- You selected `output/firefox-mv2/manifest.json`, not the output directory.
- The add-on was loaded from `about:debugging#/runtime/this-firefox`.
- Firefox has not restarted since loading the temporary add-on.

If you installed from source, rebuild if the output directory is missing:

```bash
npm run build
```

## Settings page did not open

Click the Swan extension icon from the browser toolbar. If it is hidden, open the browser extensions menu and pin Swan.

## AI call does not arrive

Check:

- ElevenLabs API key has access to Conversational AI calls.
- Agent ID is copied from the same ElevenLabs workspace as the API key.
- Agent phone number ID is copied from ElevenLabs phone-number settings.
- The phone number is connected inside ElevenLabs and supports outbound calls.
- ElevenLabs call history shows the attempted outbound call.

Do not enter the literal phone number in the Agent phone number ID field.

If the call rings but the agent does not speak, test the outbound call from
ElevenLabs again before testing Swan.

## Logs show `skipped`

Swan skipped the call when monitoring, the call toggle, or required configuration was missing.

Review:

- Start voice call toggle.
- Recipient phone number.
- ElevenLabs settings.

## Logs show `failed`

Open the provider console first:

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

## Private window shows the browser block page

For Chromium private or incognito windows, confirm:

- Swan is enabled for private/incognito windows in the browser extension details page.
- You loaded or reloaded a build that includes `incognito: "split"` in `manifest.json`.
- `manifest.json` includes `web_accessible_resources` for `intervention.html`, `assets/*`, and `chunks/*`.

Swan cannot enable private-window access itself. In Chrome or Brave, open
`chrome://extensions`, open Swan details, enable private/incognito access, then
reload Swan. If a private window shows `ERR_BLOCKED_BY_CLIENT` for Swan's
extension ID, remove and load the unpacked extension again so the browser uses
the current manifest.

## Credentials disappeared

Swan stores credentials in `chrome.storage.local` for the installed extension. Removing the extension, loading a different build as a different extension ID, or using another browser profile can make settings appear missing.

## Need a clean reset

Remove Swan from `chrome://extensions`, rerun the installer or rebuild from source, then load the extension directory again. This can clear extension-local settings for that profile.

For Firefox Desktop, remove Swan from `about:debugging#/runtime/this-firefox`, rebuild with `npm run build:firefox`, then load `output/firefox-mv2/manifest.json` again.
