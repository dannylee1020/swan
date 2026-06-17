# Swan

Swan is a browser extension that helps you break out of the porn addiction cycle by calling you at the moment of urge.

It is built for people who want a transparent recovery-support tool they can inspect, install, and connect to their own provider accounts.

## What Swan Does

- Monitors browser navigation for configured NSFW domains
- Starts a phone call when a tracked domain is opened
- Redirects the browser to an intervention page
- Stores settings, domain rules, and event history in browser local storage

Swan is not a passive blocker. The core loop is narrow: detect the risky moment, interrupt quickly, and break one out of the cycle.

## How It Works

- Swan runs as a local browser extension.
- Detection uses configured domain rules and top-level navigation events.
- Makes the call when listed domain is detected, interrupts the lust at the moment and prevents the addiction cycle.

## Requirements

- Chromium-based browser for the Chrome Web Store install or local development
- ElevenLabs account for the voice-call provider
- Phone number connected or imported inside ElevenLabs for calls
- For source builds only: Node.js 20 or newer and npm

Swan initiates voice calls through ElevenLabs' outbound-call API.

## Quick Start

Install Swan from the Chrome Web Store:

https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg

If you want to inspect or modify the extension, run the local dashboard command and load the generated dev folder through `chrome://extensions`.

For repeatable local setup from source, copy `config.example.yaml` to `config.yaml` before running `npm run dashboard`. Swan will bundle that local config as import data, which you can later apply from the General page.

After loading, Swan opens the settings tab automatically on first install. If it does not, click the Swan extension icon. Configure your phone and provider settings, add tracked domains, and click **Send test alert**.

Start with:

- [Chrome Web Store](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg)
- [Start](https://swan-oss.com/docs/)
- [Install Swan](https://swan-oss.com/docs/guide/install)
- [Provider setup](https://swan-oss.com/docs/provider-setup)
- [Test and verify](https://swan-oss.com/docs/guide/test-and-verify)

## Provider Setup

Swan needs these values in the options page:

- Recipient phone number in E.164 format, for example `+15551234567`
- ElevenLabs API key
- ElevenLabs Agent ID
- ElevenLabs Agent phone number ID

Use [Provider setup](https://swan-oss.com/docs/provider-setup) for the full ElevenLabs walkthrough. Configure and test the ElevenLabs agent before relying on Swan interventions.

## Limitations

- Swan v0 detects configured domains only.
- It ships with a small editable seed list of NSFW domains and matches subdomains of tracked domains.
- It does not inspect page content, classify images or videos, install DNS rules, run a proxy, or block at the operating-system level.
- Chrome Web Store is the supported install path. Local development targets Chromium.
- It is recovery-support software, not medical advice, therapy, or clinical treatment.

## Privacy and Costs

Settings, rules, provider credentials, and logs are stored in browser extension local storage. Treat Swan v0 as browser-local software that uses a provider account you control, not a managed production secret store.

In BYOK mode, Swan does not send data to any Swan-operated server. Alert delivery sends the minimum needed request data to ElevenLabs for the conversational phone call. In Swan Managed mode, the extension sends only the matched intervention event needed for managed call delivery and subscription or trial checks. Providers and Swan Managed may store call, billing, and diagnostic records according to their own policies.

The software is open source, but phone calls are not free to operate. BYOK (Bring Your Own Key) remains free to use with your own provider account. Swan Managed requires an active paid subscription or trial.

## Development

Run the docs and landing page locally:

```bash
npm run docs
```

Run the extension dashboard locally with WXT hot reload:

```bash
npm run dashboard
```

Load the generated `output/chrome-mv3-dev` directory through `chrome://extensions`. Keep the WXT process running while you work; source changes hot reload instead of requiring repeated builds.

Build the Chrome Web Store package:

```bash
npm run build
```

## Contributing

Swan is early. Useful contributions include setup feedback, seed-domain tuning, provider reliability notes, documentation fixes, and issues that describe where the install or provider setup flow is confusing.

If you try Swan locally, open an issue with what worked, what failed, and which browser/provider setup you used.
