# Install Swan

Swan can be installed from the Chrome Web Store beta when a release link is available. Developers and users who want to inspect or modify the extension can still build and load it from source.

## Chrome Web Store beta

The first downloadable release is intended to ship as an unlisted Chrome Web Store beta. Unlisted means Swan can be installed by link, but it is not discoverable through store search.

After installing from the beta link:

1. Click the Swan extension icon.
2. Open the settings page.
3. Configure your recipient phone number.
4. Add ElevenLabs voice-call credentials.
5. Optional: add Twilio SMS credentials and enable SMS.
6. Click **Send test alert** before relying on Swan.

Swan does not include bundled provider credentials. You still bring your own ElevenLabs account and optional Twilio account.

## Build from source

Use this path if you are developing Swan, auditing the extension, or installing before a Chrome Web Store beta link is available.

## Clone the repository

```bash
git clone git@github.com:dannylee1020/swan.git
cd swan
```

If you use HTTPS instead of SSH:

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
```

### Run setup

```bash
npm run setup
```

The setup command is the recommended path for new users. It runs `npm install` only when dependencies are missing, builds Swan, and prints the absolute path to the extension output.

::: tip
Use `npm run setup -- --no-open` if you do not want the script to try opening `chrome://extensions`.
:::

::: tip
Copy `config.example.yaml` to `config.yaml` before setup if you want Swan to
bundle local import data for phone, provider, and tracked-domain settings.
:::

### Manual commands

If you prefer to run each step yourself:

```bash
npm install
npm run build
```

Then load:

```text
output/chrome-mv3
```

through your browser's extension page.

### Load unpacked extension

1. Open `chrome://extensions`.
2. Turn on **Developer Mode**.
3. Click **Load unpacked**.
4. Select the absolute `output/chrome-mv3` directory.
5. Confirm Swan appears in the extensions list.

## Open settings

Swan should open the full settings tab on first install. You can also open it by clicking the Swan extension action icon.

The settings page is where you configure:

- Bundled `config.yaml` data through **Import data** on General.
- Recipient phone number.
- ElevenLabs voice-call credentials.
- Optional Twilio SMS credentials.
- Domain tracking rules.
- Test alerts.
- Recent event logs.

## Rebuild after source changes

When you pull a new version or change source code:

```bash
npm run build
```

Then open `chrome://extensions` and click the reload button on Swan.

## Validate the checkout

Use these checks before trusting a modified checkout:

```bash
npm run typecheck
npm run test
npm run build
```
