---
layout: doc
title: Chrome Web Store
description: Install Swan from the Chrome Web Store or review the local setup path for the open-source extension.
---

# Chrome Web Store

[Install Swan from the Chrome Web Store](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg).

The store listing is the recommended install path for most Chrome and Chromium users. Swan is still open source, and the local setup path remains available for people who want to inspect the release package, build from source, or keep a manual extension install.

## Store install

1. Open the [Swan Chrome Web Store listing](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg).
2. Click **Add to Chrome**.
3. Open Swan from the extension toolbar.
4. Configure your phone number, ElevenLabs credentials, and tracked domains.
5. Click **Send test alert** before relying on real interventions.

## Local install fallback

Use the local install path if you want the GitHub Release package instead of the Web Store package.

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

Then open `chrome://extensions`, enable **Developer Mode**, click **Load unpacked**, and select the folder printed by the installer.

## What the store version makes easier

- Install Swan without manually loading an unpacked extension.
- Keep the open-source code and privacy claims inspectable.
- Make updates simpler for people who do not want a manual release install.
- Keep the core behavior narrow: configured NSFW domains, tab redirect, immediate phone call.

## What does not change

Swan is recovery-support software, not therapy or clinical treatment. The extension uses browser-local settings and your configured provider account. The current core does not inspect page content, run a proxy, or send browsing history to a Swan-operated server.

Read [Quick start](./guide/quick-start.md) for setup details after installation.
