# Quick Start

This is the shortest path to a working Swan extension in Chromium.

## 1. Install Swan

macOS or Linux:

```bash
curl -fsSL https://swan-oss.com/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://swan-oss.com/install.ps1 | iex
```

The installer downloads the latest Chromium release, extracts Swan into a stable local folder, prints the extension path, and tries to open `chrome://extensions`.

## 2. Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select the extension path printed by the installer.
5. Keep that folder in place.

After first install, Swan should open its settings page. If it does not, click the Swan extension icon.

## 3. Configure Swan

Open **Swan settings** and save the required values:

| Group | Required values |
| --- | --- |
| Phone Configuration | Recipient phone number, Start voice call toggle, monitoring toggle, cooldown minutes |
| ElevenLabs Voice Call | API key, Agent ID, Agent phone number ID |

Use E.164 phone-number formatting for the recipient number, for example `+15551234567`.

Before relying on Swan, configure the ElevenLabs [agent prompt and knowledge base](../agent/) and run a direct ElevenLabs test call.

## 4. Test Swan

1. Click **Send test alert** in Swan settings.
2. Confirm an AI call arrives from the ElevenLabs-connected number.
3. Open **Logs** and verify the latest event has call status.

## 5. Add domains

Open **Domain Tracking** to review, remove, or add domains. Swan matches configured domains and their subdomains during top-level browser navigation.

## Next

- Full install and source-build details: [Install](./install.md)
- Provider details: [Provider setup](../provider-setup.md)
- Loading problems: [Troubleshooting](../troubleshooting.md)
- Runtime behavior: [Test and verify](./test-and-verify.md)
