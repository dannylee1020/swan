# Quick Start

This is the shortest path to a working Swan extension in Chromium.

## 1. Install Swan

Open the [Swan Chrome Web Store listing](https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg), click **Add to Chrome**, then open Swan from the extension toolbar.

## 2. Configure Swan

Open **Swan settings** and save the required values:

| Group | Required values |
| --- | --- |
| Phone Configuration | Recipient phone number, Start voice call toggle, monitoring toggle |
| ElevenLabs Voice Call | API key, Agent ID, Agent phone number ID |

Use E.164 phone-number formatting for the recipient number, for example `+15551234567`.

Before relying on Swan, configure the ElevenLabs [agent prompt and knowledge base](../agent/) and run a direct ElevenLabs test call.

## 3. Test Swan

1. Click **Send test alert** in Swan settings.
2. Confirm an AI call arrives from the ElevenLabs-connected number.
3. Open **Logs** and verify the latest event has call status.

## 4. Add domains

Open **Domain Tracking** to review, remove, or add domains. Swan matches configured domains and their subdomains during top-level browser navigation.

## Next

- Full install and source-build details: [Install](./install.md)
- Provider details: [Provider setup](../provider-setup.md)
- Loading problems: [Troubleshooting](../troubleshooting.md)
- Runtime behavior: [Test and verify](./test-and-verify.md)
