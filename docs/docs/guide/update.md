# Update Swan

Chrome Web Store installs update through Chrome. If you are using a source checkout, rebuild and reload the unpacked extension in your browser.

## Chrome Web Store install

Chrome handles updates for Web Store installs. To check the installed version manually:

1. Open `chrome://extensions`.
2. Find Swan.
3. Enable **Developer Mode** if version details are hidden.
4. Confirm Swan remains enabled.

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

Swan settings live in browser extension local storage. Web Store updates and source rebuilds do not normally clear settings. Removing the extension from the browser can remove extension-local data for that profile.
