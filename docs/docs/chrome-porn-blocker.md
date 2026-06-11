---
layout: doc
title: Chrome Porn Blocker With Phone Calls
description: How Swan uses local Chrome domain detection and an immediate phone call to interrupt unwanted porn urges.
---

# Chrome porn blocker with phone calls

Most porn blockers try to make a website unavailable. Swan uses a narrower pattern: detect a configured NSFW domain in Chrome, redirect the tab, and start a phone call at the moment the urge is active.

That makes Swan closer to an intervention tool than a passive content filter.

## How Swan blocks the loop

- You choose the domains Swan should watch.
- The Chrome extension detects top-level navigation to a tracked domain.
- Swan redirects the tab to an intervention page.
- Swan starts a voice call through your configured ElevenLabs agent.
- The event is saved in browser local storage so you can review what happened.

## What Swan does not do

Swan does not classify images or videos, inspect every page, run a DNS filter, install an operating-system blocker, or report your browsing history to another person.

This tradeoff is intentional. Swan is built for people who want an immediate interruption when they are about to enter a porn loop, without broad surveillance.

## When Swan is a fit

Swan is a fit if you want a Chrome extension that is direct, inspectable, and focused on the moment of urge. It is not a complete device-wide blocker, and it is not a substitute for professional support.

Use [Chrome Web Store](./chrome-web-store.md) for the current install path, or read [Domain tracking](./guide/domain-tracking.md) to understand exactly what Swan detects.
