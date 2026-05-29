# Install Swan

Swan installs from a local source checkout. The same extension source builds for Chromium and Firefox Desktop, but each browser uses a different development loading flow.

## Browser support

| Browser target | Status | Build output | Loading method |
| --- | --- | --- | --- |
| Chromium-based browsers | Supported local install | `output/chrome-mv3` | Load unpacked directory from `chrome://extensions` |
| Firefox Desktop | Developer support | `output/firefox-mv2` | Load temporary add-on from `about:debugging` |
| Firefox-derived browsers | Best effort | Browser-dependent | Smoke test before relying on it |
| Tor Browser | Unsupported | Not applicable | Extra add-ons are not recommended |

Firefox support is currently for local development and testing. Signed AMO distribution and persistent Firefox installs are separate release work.

## Clone the repository

```bash
git clone git@github.com:dannylee1020/swan.git
cd swan
```

If you use HTTPS instead of SSH:

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
```

## Choose an install path

- [Install in Chromium](./install-chromium.md) if you want the default Swan local install.
- [Install in Firefox Desktop](./install-firefox.md) if you want to test the Firefox build.

Copy `config.example.yaml` to `config.yaml` before setup if you want Swan to bundle local import data for phone, provider, and tracked-domain settings.

## Open settings

Swan should open the full settings tab on first install in Chromium. In Firefox, open Swan from the extension toolbar after temporary loading.

The settings page is where you configure:

- Bundled `config.yaml` data through **Import data** on General.
- Recipient phone number.
- ElevenLabs voice-call credentials.
- Optional Twilio SMS credentials.
- Domain tracking rules.
- Test alerts.
- Recent event logs.

## Validate the checkout

Use these checks before trusting a modified checkout:

```bash
npm run typecheck
npm run test
npm run build
npm run build:firefox
```
