# Install in Chromium

Chromium is Swan's default release install target.

## Install latest release

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer downloads the latest `swan-chromium.zip` release asset, extracts it into a stable local directory, verifies `manifest.json`, prints the absolute extension path, and tries to open `chrome://extensions`.

::: tip
To install a specific release, set `SWAN_VERSION`, for example `SWAN_VERSION=v0.1.0-beta.1 ./install.sh`.
:::

## Load unpacked extension

1. Open `chrome://extensions`.
2. Turn on **Developer Mode**.
3. Click **Load unpacked**.
4. Select the extension path printed by the installer.
5. Confirm Swan appears in the extensions list.

## Update release install

Run the installer again, then open `chrome://extensions` and click the reload button on Swan. Do not remove Swan from the browser unless you intend to clear extension-local settings.

## Build from source

If you prefer to run each step yourself:

```bash
npm install
npm run build
```

Or use the source setup wrapper:

```bash
npm run setup
```

Then load the absolute `output/chrome-mv3` directory from `chrome://extensions`.
