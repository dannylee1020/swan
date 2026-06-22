# Swan

Swan is an open-source Chrome extension that interrupts configured adult-site
visits with a tab redirect and an immediate phone call.

It is built for one narrow browser moment: when an unwanted porn loop starts by
opening a known domain in Chrome.

## Use Swan For Free

There are two free ways to use Swan.

### 1. Install From The Chrome Web Store

Use this path if you want the normal Chrome extension install flow.

[Install Swan from the Chrome Web Store](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg)

After installing:

1. Open Swan from the extension toolbar.
2. Enter your recipient phone number.
3. Add your ElevenLabs API key, Agent ID, and Agent phone number ID.
4. Review or edit the tracked domain list.
5. Click **Send test alert** before relying on real interventions.

This is BYOK mode: Swan is free to use, but you bring your own ElevenLabs
account and pay any provider costs directly to the provider.

### 2. Clone The Repo And Load Swan Locally

Use this path if you want to inspect, modify, or self-host the extension before
loading it into Chrome or another Chromium-based browser.

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
npm install
npm run dashboard
```

Then load the unpacked extension:

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select `output/chrome-mv3-dev`.
5. Keep `npm run dashboard` running while you work.

For repeatable local setup, copy `config.example.yaml` to `config.yaml` before
running `npm run dashboard`. Swan can bundle that local config as import data,
which you can apply from the General page.

## Swan Managed

Swan Managed is the paid convenience path. It avoids BYOK provider setup by
using Swan-managed call delivery and subscription checks.

Use the free Chrome Web Store + BYOK path first if you want to control your own
provider account. Use Managed only if you want Swan to handle the call delivery
layer for you.

## What Swan Does

- Watches top-level browser navigation for configured adult domains.
- Redirects the tab when a tracked domain opens.
- Starts a voice call through your configured delivery mode.
- Stores settings, domain rules, credentials, and event logs in browser
  extension local storage.

## What Swan Does Not Do

- It does not inspect page content, prompts, images, or videos.
- It does not run DNS filtering, a proxy, or operating-system-level blocking.
- It does not block mobile apps, social feeds, or whole-device activity.
- It does not promise permanent blocking or impossible-to-bypass controls.
- It is recovery-support software, not medical advice, therapy, or clinical
  treatment.

## Docs

- [Start](https://swan-oss.com/docs/)
- [Install Swan](https://swan-oss.com/docs/guide/install)
- [Provider setup](https://swan-oss.com/docs/provider-setup)
- [Domain tracking](https://swan-oss.com/docs/guide/domain-tracking)
- [Test and verify](https://swan-oss.com/docs/guide/test-and-verify)
- [Privacy](https://swan-oss.com/docs/privacy)
- [Troubleshooting](https://swan-oss.com/docs/troubleshooting)
- [Blog](https://blog.swan-oss.com/)

## Development

Run the docs site locally:

```bash
npm run docs
```

Run the blog locally:

```bash
npm run blog
```

Build the Chrome Web Store package:

```bash
npm run build
```

## Contributing

Swan is early. Useful contributions include setup feedback, seed-domain tuning,
provider reliability notes, documentation fixes, and issues that describe where
the install or provider setup flow is confusing.
