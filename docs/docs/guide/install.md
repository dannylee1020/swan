# Install Swan

Swan is available from the Chrome Web Store. Local development uses WXT hot reload for Chromium.

## Browser support

| Browser target | Status | Build output | Loading method |
| --- | --- | --- | --- |
| Chromium-based browsers | First-class Chrome install | Chrome Web Store | Add to Chrome |
| Chromium local development | Supported source path | `output/chrome-mv3-dev` | Load unpacked from `chrome://extensions` |
| Tor Browser | Unsupported | Not applicable | Extra add-ons are not recommended |

## Install from Chrome Web Store

Open the [Swan Chrome Web Store listing](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg), click **Add to Chrome**, then open Swan from the extension toolbar.

## Load a local dashboard build in Chromium

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select `output/chrome-mv3-dev`.
5. Keep that folder in place.

## Local dashboard development

Clone the repository:

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
```

Start WXT dev mode:

```bash
npm run dashboard
```

Copy `config.example.yaml` to `config.yaml` before running the dashboard command if you want Swan to bundle local import data for phone, provider, and tracked-domain settings. Keep the WXT process running while you work; source changes hot reload instead of requiring repeated builds.

## Open settings

Swan should open the full settings tab on first install in Chromium.

The settings page is where you configure:

- Bundled `config.yaml` data through **Import data** on General.
- Recipient phone number.
- ElevenLabs voice-call credentials.
- Domain tracking rules.
- Test alerts.
- Recent event logs.

## Build for publishing

Build the Chrome Web Store package:

```bash
npm run build
```

## Update Swan

Chrome Web Store installs update through Chrome. For local dashboard development, keep `npm run dashboard` running and reload the unpacked extension only when Chrome asks for it. See [Update Swan](./update.md) for details.
