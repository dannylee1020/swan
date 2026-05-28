---
layout: doc
title: Introduction
description: What Swan is, what it does, and how the browser extension works.
---

# Swan

A Chromium extension that interrupts risky browsing moments with immediate AI phone-call intervention and optional SMS alerts.

## What Swan does

Swan watches browser navigation for NSFW domains you configure. When you navigate to one of the sites, Swan calls you immediately to intervene and break you out of the urge. SMS can be enabled as an extra alert channel.

The goal is not passive blocking or broad surveillance. Swan is built around a narrow intervention loop: detect the urge moment, interrupt quickly, and make the next action harder to ignore.

## How it works

- The extension runs in a Chromium browser profile.
- Detection uses configured domain rules and top-level navigation events.
- Settings, rules, and logs live in `chrome.storage.local`.
- AI calls use your ElevenLabs Conversational AI agent and connected phone number.
- Optional SMS delivery uses your Twilio account and phone number.
- Swan v0 does not run a hosted backend, proxy, DNS filter, localhost daemon, or page-content classifier.

## Who it is for

Swan is for anyone who struggles to break out of the death spiral: urge -> watch -> hooked -> stronger urge -> continue.

It is designed intentionally small: one browser extension, user-managed provider accounts, configurable domain rules, and local logs.

## Start using Swan

- [Quick start](./guide/quick-start.md) gives the full setup path from checkout to test alert.
- [Install Swan](./guide/install.md) covers the Chrome Web Store beta path and source-loaded install.
- [Provider setup](./provider-setup.md) walks through ElevenLabs and optional Twilio SMS.
- [Troubleshooting](./troubleshooting.md) covers the common failure modes.
- [Privacy policy](./privacy.md) explains local storage, provider data, and permissions.
