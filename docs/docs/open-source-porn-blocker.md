---
layout: doc
title: Open-Source Porn Blocker
description: Why Swan keeps its porn-blocking extension inspectable, browser-local, and connected to provider accounts you control.
---

# Open-source porn blocker

Swan is open source because trust matters for recovery software. A porn blocker can see sensitive browsing moments, so the code should be inspectable and the data boundary should be clear.

Swan Core runs as a browser extension. Settings, domain rules, provider credentials, and recent events live in browser extension storage for the profile where Swan is installed.

## Why open source matters here

- You can inspect what the extension watches.
- You can verify that Swan does not run a hidden backend in the current core.
- You can connect provider accounts you control instead of sending everything through a managed service.
- You can review the permissions before loading the extension.

## The privacy tradeoff

Swan still needs sensitive configuration to work: your recipient phone number, ElevenLabs credentials, and tracked domains. Those values are stored in browser local storage for the extension profile.

Alert delivery sends the minimum call request data to ElevenLabs because ElevenLabs places the call. See [Privacy](./privacy.md) for the full data boundary.

## The control tradeoff

Open-source and BYOK means you control the provider setup and call costs. It also means setup takes more work than a fully managed product.

Use [Provider setup](./provider-setup.md) to configure ElevenLabs, or start from [Quick start](./guide/quick-start.md).
