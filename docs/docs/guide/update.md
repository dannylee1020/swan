# Update Swan

Chrome Web Store installs update through Chrome. If you are using a local dashboard checkout, keep WXT running and reload the unpacked extension only when Chrome asks for it.

## Chrome Web Store install

Chrome handles updates for Web Store installs. To check the installed version manually:

1. Open `chrome://extensions`.
2. Find Swan.
3. Enable **Developer Mode** if version details are hidden.
4. Confirm Swan remains enabled.

## Local dashboard checkout

If you installed from a source checkout, pull the latest changes:

```bash
git pull
```

If dependencies changed:

```bash
npm install
```

Start the local dashboard:

```bash
npm run dashboard
```

If Chrome asks for a manual reload:

1. Open `chrome://extensions`.
2. Find Swan.
3. Click the reload icon.
4. Open Swan settings and confirm your settings are still present.

## Settings persistence

Swan settings live in browser extension local storage. Web Store updates and source rebuilds do not normally clear settings. Removing the extension from the browser can remove extension-local data for that profile.
