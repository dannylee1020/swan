# Domain Tracking

Swan v0 watches configured domains during top-level browser navigation.

## Detection scope

Swan detects:

- Exact configured domains.
- Subdomains of configured domains.
- Top-level browser navigation events visible to the extension.

Swan does not detect:

- Page content.
- Images or videos.
- Search intent.
- DNS requests outside the browser.
- Native app traffic.
- Other browser profiles where Swan is not loaded.

## Seed domains

Swan ships with a small seed list of NSFW domains so a new install can test the flow quickly. Seed rules can be disabled from **Domain Tracking**.

## Add a custom domain

1. Open **Domain Tracking**.
2. Enter a domain or URL.
3. Click **Add domain**.
4. Confirm the new rule appears and is enabled.

Examples:

```text
example.com
https://example.com/path
sub.example.com
```

Swan stores normalized domains, not full URLs.

## Disable or remove a domain

- Disable a rule when you may want to turn it back on later.
- Remove a rule when it should no longer be part of the local configuration.

## Confirm a domain is working

1. Add a safe test domain that you control or can visit without risk.
2. Visit the domain in the browser profile where Swan is loaded.
3. Confirm Swan redirects to the intervention page.
4. Open **Logs** and check the event.

Use **Send test alert** first if you only want to test provider delivery without navigating to a tracked domain.
