# Update Swan

How you update Swan depends on how it was installed.

## Chrome Web Store install

Chrome normally updates Web Store extensions automatically. To check manually:

1. Open `chrome://extensions`.
2. Turn on **Developer Mode**.
3. Click **Update**.
4. Open Swan settings and confirm your settings are still present.

Removing and reinstalling the extension can clear extension-local data for that browser profile. Keep provider credentials somewhere safe before removing Swan.

## Source-loaded install

If Swan was loaded from a local checkout, update by pulling the repository, rebuilding, and reloading the unpacked extension.

### Pull latest changes

```bash
git pull
```

If dependencies changed:

```bash
npm install
```

### Rebuild

```bash
npm run build
```

### Reload the extension

1. Open `chrome://extensions`.
2. Find Swan.
3. Click the reload icon.
4. Open Swan settings and confirm your settings are still present.

### When to re-run setup

Use setup again if you want the scripted path:

```bash
npm run setup
```

It will build the extension and print the current extension path again.

## Settings persistence

Swan settings live in browser extension local storage. Rebuilding the source does not normally clear settings. Removing the extension from the browser can remove extension-local data for that profile.
