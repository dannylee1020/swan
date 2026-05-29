# Install in Chromium

Chromium is Swan's default local install target.

## Run setup

```bash
npm run setup
```

The setup command installs dependencies when needed, builds Swan, verifies `output/chrome-mv3/manifest.json`, prints the absolute extension path, and tries to open `chrome://extensions`.

::: tip
Use `npm run setup -- --no-open` if you do not want the script to try opening `chrome://extensions`.
:::

## Manual commands

If you prefer to run each step yourself:

```bash
npm install
npm run build
```

## Load unpacked extension

1. Open `chrome://extensions`.
2. Turn on **Developer Mode**.
3. Click **Load unpacked**.
4. Select the absolute `output/chrome-mv3` directory.
5. Confirm Swan appears in the extensions list.

## Rebuild after source changes

When you pull a new version or change source code:

```bash
npm run build
```

Then open `chrome://extensions` and click the reload button on Swan.
