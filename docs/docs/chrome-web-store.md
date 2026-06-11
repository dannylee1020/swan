---
layout: doc
title: Chrome Web Store
description: Install Swan from the Chrome Web Store or build the open-source extension from source.
---

# Chrome Web Store

[Install Swan from the Chrome Web Store](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg).

The store listing is the recommended install path for Chrome and Chromium users. Swan is still open source, and the source build path remains available for people who want to inspect or modify the extension.

## Store install

1. Open the [Swan Chrome Web Store listing](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg).
2. Click **Add to Chrome**.
3. Open Swan from the extension toolbar.
4. Configure your phone number, ElevenLabs credentials, and tracked domains.
5. Click **Send test alert** before relying on real interventions.

## Source build fallback

Use the source build path if you want to inspect or modify the extension before loading it manually.

```bash
npm install
npm run setup
```

Then open `chrome://extensions`, enable **Developer Mode**, click **Load unpacked**, and select `output/chrome-mv3`.

## What the store version makes easier

- Install Swan without manually loading an unpacked extension.
- Keep the open-source code and privacy claims inspectable.
- Make updates simpler for people who do not want a manual source build.
- Keep the core behavior narrow: configured NSFW domains, tab redirect, immediate phone call.

## What does not change

Swan is recovery-support software, not therapy or clinical treatment. The extension uses browser-local settings and your configured provider account. The current core does not inspect page content, run a proxy, or send browsing history to a Swan-operated server.

Read [Quick start](./guide/quick-start.md) for setup details after installation.
