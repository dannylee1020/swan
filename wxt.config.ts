import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "output",
  modules: ["@wxt-dev/module-react"],
  manifest: ({ browser }) => ({
    name: "Swan",
    description: "Adult-site urge intervention with AI phone calls.",
    permissions: ["storage", "webNavigation"],
    host_permissions: [
      "https://api.elevenlabs.io/*",
      "https://api.twilio.com/*",
    ],
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
    action: {
      default_title: "Swan",
      default_icon: {
        16: "icons/icon-16.png",
        32: "icons/icon-32.png",
        48: "icons/icon-48.png",
        128: "icons/icon-128.png",
      },
    },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              data_collection_permissions: {
                required: [
                  "personallyIdentifyingInfo",
                  "authenticationInfo",
                  "personalCommunications",
                  "browsingActivity",
                ],
              },
            },
          },
        }
      : {}),
  }),
});
