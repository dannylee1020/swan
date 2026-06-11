# Test and Verify

Use this page after installation and provider setup.

## Check extension loading

In Chromium, open `chrome://extensions` and confirm:

- Swan is enabled.
- Developer Mode remains on.
- If you loaded a source build, the extension path points at `output/chrome-mv3`.
- No manifest or runtime errors are visible on the extension card.

In Firefox Desktop, open `about:debugging#/runtime/this-firefox` and confirm:

- Swan appears under temporary extensions.
- The temporary add-on points at `output/firefox-mv2/manifest.json`.
- No manifest or runtime errors are visible.

## Send a test alert

1. Open Swan settings.
2. Confirm monitoring and the voice-call toggle are enabled.
3. Confirm the recipient number is saved.
4. Confirm ElevenLabs credentials are saved.
5. Click **Send test alert**.

Expected result:

- The call arrives from the ElevenLabs-connected phone number.
- A new log entry appears in Swan.

## Verify logs

Open **Logs** and inspect the latest event:

| Status | Meaning |
| --- | --- |
| `success` | The provider accepted the request and returned an identifier when available. |
| `failed` | The provider request failed. Check the error and provider console logs. |
| `skipped` | Swan intentionally did not call, usually because calls are disabled or configuration is incomplete. |
| `pending` | The event was created before the provider status finished updating. |

## Test domain detection

1. Add a safe test domain in **Domain Tracking**.
2. Visit the domain in the same browser profile.
3. Confirm Swan redirects to the intervention page.
4. Confirm a log entry appears.

## Validate source changes

If you changed the code or pulled a new version:

```bash
npm run typecheck
npm run test
npm run build
```

Then reload Swan from `chrome://extensions`.

For Firefox Desktop, rebuild with `npm run build:firefox`, then reload the temporary add-on from `about:debugging`.
