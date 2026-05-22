import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "output",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Swan",
    description: "Self-hosted urge intervention for technical users.",
    permissions: ["storage", "tabs", "webNavigation"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Swan",
    },
  },
});
