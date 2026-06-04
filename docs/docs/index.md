---
layout: doc
title: Introduction
description: What Swan is, what it does, and how the browser extension works.
---

# Swan

A browser extension that interrupts lust by calling you at the right moment. Supports Chromium and Firefox based browsers.

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

- [Quick start](./guide/quick-start.md) gives the shortest path from install to test alert.
- [Install](./guide/install.md) covers source builds, browser support, and experimental Firefox setup.
- [Provider setup](./provider-setup.md) walks through ElevenLabs.
- [Troubleshooting](./troubleshooting.md) covers the common failure modes.
- [Privacy](./privacy.md) explains local storage, provider data, permissions, and user control.
