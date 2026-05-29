# Install in Firefox Desktop

Firefox support is currently for local development and testing. It uses WXT's Firefox Manifest V2 build and Firefox's temporary add-on loader.

Temporary add-ons are removed when Firefox restarts. Signed AMO distribution and persistent Firefox installs are not part of this local setup path.

## Run setup

```bash
npm run setup:firefox
```

The setup command installs dependencies when needed, builds Swan for Firefox, verifies `output/firefox-mv2/manifest.json`, and prints the manifest path to load.

::: tip
Use `npm run setup:firefox -- --no-open` for parity with the Chromium setup command. Firefox setup prints the loading path and does not auto-open Firefox.
:::

## Manual commands

If you prefer to run each step yourself:

```bash
npm install
npm run build:firefox
```

## Load temporary add-on

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select `output/firefox-mv2/manifest.json`.
5. Confirm Swan appears in the temporary extensions list.

## Rebuild after source changes

When you pull a new version or change source code:

```bash
npm run build:firefox
```

Then return to `about:debugging#/runtime/this-firefox`, remove the temporary add-on if needed, and load `output/firefox-mv2/manifest.json` again.

## Package for review

```bash
npm run zip:firefox
```

This creates a Firefox ZIP and source ZIP under `output/`. Packaging is useful for review experiments, but the generated ZIP is not a signed Firefox distribution artifact.
