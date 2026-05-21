import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Swan",
    description: "Local-first urge interruption for technical users.",
    permissions: ["storage", "tabs", "webNavigation"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Swan",
    },
  },
});
