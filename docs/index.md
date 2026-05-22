---
layout: doc
title: Introduction
description: What Swan is, what it does, and how the self-hosted extension works.
---

# Swan

A self-hosted Chromium extension that interrupts risky browsing moments with immediate SMS and AI phone-call intervention.

## What Swan does

Swan watches browser navigation for NSFW domains you configure. When you navigate to one of the sites, swan calls or texts you immediately to intervene and break you out of the urge.

The goal is not passive blocking or broad surveillance. Swan is built around a narrow intervention loop: detect the urge moment, interrupt quickly, and make the next action harder to ignore.

## How it works

- The extension runs in a Chromium browser profile.
- Detection uses configured domain rules and top-level navigation events.
- Settings, rules, and logs live in `chrome.storage.local`.
- SMS delivery uses your Twilio account and phone number.
- AI calls use your ElevenLabs Conversational AI agent and connected phone number.
- Swan v0 does not run a hosted backend, proxy, DNS filter, localhost daemon, or page-content classifier.

## Who it is for

Swan is for anyone who struggles to break out of the death spiral: urge -> watch -> hooked -> stronger urge -> continue.

It is designed intentionally small: one browser extension, user-managed provider accounts, configurable domain rules, and local logs.

## Start using Swan

- [Quick start](./guide/quick-start.md) gives the full setup path from checkout to test alert.
- [Install and load](./guide/install.md) covers the browser extension loading steps in detail.
- [Provider setup](./provider-setup.md) walks through Twilio and ElevenLabs.
- [Troubleshooting](./troubleshooting.md) covers the common failure modes.
