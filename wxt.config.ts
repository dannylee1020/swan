import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "output",
  modules: ["@wxt-dev/module-react"],
  manifest: ({ browser }) => ({
    name: "Swan NSFW Blocker with Calls",
    description:
      "Swan helps interrupt unwanted porn urges with custom domain blocking and a personalized phone call.",
    homepage_url: "https://swan-oss.com/docs",
    ...(browser === "firefox" ? {} : { incognito: "split" as const }),
    permissions: ["storage", "webNavigation"],
    host_permissions: ["https://api.elevenlabs.io/*"],
    web_accessible_resources:
      browser === "firefox"
        ? ["intervention.html", "assets/*", "chunks/*"]
        : [
            {
              resources: ["intervention.html", "assets/*", "chunks/*"],
              matches: ["<all_urls>"],
            },
          ],
    icons: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
    action: {
      default_title: "Swan NSFW Blocker with Calls",
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
