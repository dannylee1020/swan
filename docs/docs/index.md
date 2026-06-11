---
layout: doc
title: Introduction
description: Swan is an open-source Chrome extension that interrupts unwanted porn urges with local domain detection and a phone call.
---

# Swan

Swan is an open-source Chrome extension that interrupts unwanted porn urges with a phone call at the risky moment. It is built for people who want to quit porn, keep NSFW sites out of their life, and use a tool they can inspect.

## What Swan does

Swan watches browser navigation for NSFW domains you configure. When you navigate to one of the sites, Swan calls you immediately to intervene and break you out of the urge.

The goal is not passive blocking or broad surveillance. Swan is built around a narrow intervention loop: detect the urge moment, interrupt quickly, and make the next action harder to ignore.

## How it works

- The extension runs in a local browser profile.
- Chromium is the supported install path; Firefox is experimental developer support.
- Detection uses configured domain rules and top-level navigation events.
- Settings, rules, and logs live in `chrome.storage.local`.
- Voice calls use your ElevenLabs Conversational AI agent and connected phone number.

## Who it is for

Swan is for anyone who struggles to break out of the death spiral: urge -> watch -> hooked -> stronger urge -> continue.

It is designed intentionally small: one browser extension, user-managed provider accounts, configurable domain rules, and local logs.

## Start using Swan

- [Chrome Web Store](./chrome-web-store.md) explains the store-first install path and current fallback.
- [Quick start](./guide/quick-start.md) gives the shortest path from install to test alert.
- [Install](./guide/install.md) covers source builds, browser support, and experimental Firefox setup.
- [Provider setup](./provider-setup.md) walks through ElevenLabs.
- [Troubleshooting](./troubleshooting.md) covers the common failure modes.
- [Privacy](./privacy.md) explains local storage, provider data, permissions, and user control.

## Learn more

- [Chrome porn blocker with phone calls](./chrome-porn-blocker.md) explains Swan's interruption loop.
- [Open-source porn blocker](./open-source-porn-blocker.md) explains the trust and privacy tradeoffs.
- [Swan vs passive porn blockers](./compare-passive-porn-blockers.md) compares Swan with passive blocking and accountability tools.
