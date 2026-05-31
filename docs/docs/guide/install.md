# Install Swan

Swan installs as an unpacked Chromium extension from a local folder. The recommended path downloads the latest GitHub Release asset and prepares that folder for you. Source builds are still available for development.

## Browser support

| Browser target | Status | Build output | Loading method |
| --- | --- | --- | --- |
| Chromium-based browsers | First-class v0 release install | Installer path printed by script | Load unpacked directory from `chrome://extensions` |
| Firefox Desktop | Experimental developer support | `output/firefox-mv2` | Load temporary add-on from `about:debugging` |
| Firefox-derived browsers | Best effort | Browser-dependent | Smoke test before relying on it |
| Tor Browser | Unsupported | Not applicable | Extra add-ons are not recommended |

Firefox is not first-class supported in this version. Temporary Firefox add-ons are removed when Firefox restarts, and signed AMO distribution for persistent installs is separate release work.

## Install latest release

macOS or Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/dannylee1020/swan/main/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/dannylee1020/swan/main/install.ps1 | iex
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

## Other install paths

- [Install in Chromium](./install-chromium.md) if you want detailed Chromium release and source instructions.
- [Install in Firefox Desktop](./install-firefox.md) if you want to manually test the experimental Firefox build.

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

Use these checks before trusting a modified source checkout:

```bash
npm run typecheck
npm run test
npm run build
npm run build:firefox
```
