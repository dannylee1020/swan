---
layout: doc
title: Start
description: Install Swan from Chrome or run the open-source extension locally with Developer Mode.
---

# Start

Swan is an open-source Chrome extension that calls you at the risky moment so you can step out of the porn loop before it takes over.

The fastest path is the Chrome Web Store. If you want to inspect or modify the code, you can self-host the extension locally with Chrome Developer Mode.

## Install from Chrome

Open the [Swan Chrome Web Store listing](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg), click **Add to Chrome**, then open Swan from the extension toolbar.

Use this path if you want the normal Chrome extension experience and automatic browser-managed updates.

## Self-host with Developer Mode

Use the source path if you want to inspect the code, change it, or run Swan without the store package.

```bash
git clone https://github.com/dannylee1020/swan.git
cd swan
npm install
npm run dashboard
```

Then load the local extension:

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select `output/chrome-mv3-dev`.
5. Keep `npm run dashboard` running while you work.

WXT watches the source and hot reloads the local extension, so you do not need to rebuild after every change.

## Configure Swan

Open Swan settings and save the required values:

| Group | Required values |
| --- | --- |
| Phone Configuration | Recipient phone number, Start voice call toggle, monitoring toggle |
| ElevenLabs Voice Call | API key, Agent ID, Agent phone number ID |

Use E.164 phone-number formatting for the recipient number, for example `+15551234567`.

Before relying on Swan, configure the ElevenLabs [agent prompt and knowledge base](./agent/) and run a direct ElevenLabs test call.

## Test the loop

1. Click **Send test alert** in Swan settings.
2. Confirm an AI call arrives from the ElevenLabs-connected number.
3. Open **Logs** and verify the latest event has call status.
4. Open **Domain Tracking** to review, remove, or add tracked domains.

Swan matches configured domains and their subdomains during top-level browser navigation.

## Operate

- [Settings](./guide/configure.md) explains local settings, BYOK calls, Managed calls, and import data.
- [Provider setup](./provider-setup.md) walks through ElevenLabs setup.
- [Domain tracking](./guide/domain-tracking.md) explains how Swan matches configured domains.
- [Test and verify](./guide/test-and-verify.md) covers runtime checks.
- [Troubleshooting](./troubleshooting.md) covers common setup and call failures.
- [Privacy](./privacy.md) explains local storage, provider data, permissions, and user control.

## Learn more

- [Chrome porn blocker with phone calls](./chrome-porn-blocker.md) explains Swan's interruption loop.
- [Open-source porn blocker](./open-source-porn-blocker.md) explains the trust and privacy tradeoffs.
- [Swan vs passive porn blockers](./compare-passive-porn-blockers.md) compares Swan with passive blocking and accountability tools.
