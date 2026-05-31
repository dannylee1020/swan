# Update Swan

Update Swan by rerunning the installer, then reloading the unpacked extension in your browser.

## Release install

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

Then reload Swan:

1. Open `chrome://extensions`.
2. Find Swan.
3. Click the reload icon.
4. Open Swan settings and confirm your settings are still present.

## Source checkout

If you installed from a source checkout, pull the latest changes:

```bash
git pull
```

If dependencies changed:

```bash
npm install
```

Rebuild:

```bash
npm run build
```

Then reload the extension:

1. Open `chrome://extensions`.
2. Find Swan.
3. Click the reload icon.
4. Open Swan settings and confirm your settings are still present.

### When to re-run source setup

Use setup again if you want the scripted path:

```bash
npm run setup
```

It will build the extension and print the current extension path again.

## Settings persistence

Swan settings live in browser extension local storage. Rebuilding the source does not normally clear settings. Removing the extension from the browser can remove extension-local data for that profile.
