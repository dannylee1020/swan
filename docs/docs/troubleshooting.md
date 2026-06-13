# Troubleshooting

Start with the symptom that matches what you see.

## `npm run dashboard` fails

Run install first if dependencies are missing:

```bash
npm install
npm run dashboard
```

## `npm run docs` fails

Run install first if dependencies are missing:

```bash
npm install
npm run docs
```

The docs command runs WXT prepare before VitePress starts so fresh checkouts have the generated TypeScript config.

## Browser cannot load the extension

For Chromium, confirm:

- For local dashboard builds, you selected `output/chrome-mv3-dev`, not the repository root.
- `manifest.json` exists inside that extension directory.
- Developer Mode is enabled.
- The browser supports Manifest V3 extensions.

If you installed from source, rebuild if the output directory is missing:

```bash
npm run dashboard
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

Remove Swan from `chrome://extensions`, then reinstall from the Chrome Web Store or reload the local dashboard build. This can clear extension-local settings for that profile.
