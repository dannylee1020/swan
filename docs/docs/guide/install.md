# Install Swan

Swan installs as an unpacked browser extension from a local folder. The recommended path downloads the latest Chromium release and prepares that folder for you. Source builds and experimental Firefox testing are also available.

## Browser support

| Browser target | Status | Build output | Loading method |
| --- | --- | --- | --- |
| Chromium-based browsers | First-class v0 release install | Installer path printed by script | Load unpacked directory from `chrome://extensions` |
| Firefox Desktop | Experimental developer support | `output/firefox-mv2` | Load temporary add-on from `about:debugging` |
| Firefox-derived browsers | Best effort | Browser-dependent | Smoke test before relying on it |
| Tor Browser | Unsupported | Not applicable | Extra add-ons are not recommended |

Firefox is not first-class supported in this version. Temporary Firefox add-ons are removed when Firefox restarts, and signed AMO distribution for persistent installs is separate release work.

## Install Chromium release

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer downloads `swan-chromium.zip` from the latest GitHub Release, extracts it into a stable local directory, verifies `manifest.json`, and prints the folder to load in Chromium.

## Load in Chromium

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the extension path printed by the installer.
5. Keep that folder in place.

## Build from source

Clone the repository:

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
```

Then use the source checkout setup path:

```bash
npm run setup
```

Copy `config.example.yaml` to `config.yaml` before setup if you want Swan to bundle local import data for phone, provider, and tracked-domain settings.

## Firefox Desktop developer path

Use Firefox only if you are comfortable with manual developer loading. This path uses WXT's Firefox Manifest V2 build and Firefox's temporary add-on loader.

From the repository root:

```bash
npm run setup:firefox
```

Then load Swan in Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select `output/firefox-mv2/manifest.json`.
5. Confirm Swan appears in the temporary extensions list.

Temporary Firefox add-ons are removed when Firefox restarts. After source changes, run `npm run build:firefox` and load `output/firefox-mv2/manifest.json` again.

To package a Firefox ZIP for review experiments:

```bash
npm run zip:firefox
```

The generated ZIP is not a signed Firefox distribution artifact.

## Open settings

Swan should open the full settings tab on first install in Chromium. In Firefox, open Swan from the extension toolbar after temporary loading.

The settings page is where you configure:

- Bundled `config.yaml` data through **Import data** on General.
- Recipient phone number.
- ElevenLabs voice-call credentials.
- Domain tracking rules.
- Test alerts.
- Recent event logs.

## Validate the checkout

Use these checks before trusting a modified source checkout:

```bash
npm run typecheck
npm run test
npm run build
npm run build:firefox
```

## Update Swan

For release installs, rerun the installer and reload Swan from `chrome://extensions`. For source checkouts, pull the latest changes, rebuild, and reload the extension. See [Update Swan](./update.md) for details.
