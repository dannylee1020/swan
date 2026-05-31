import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Swan",
  description:
    "Browser intervention docs for installing, configuring, and running Swan.",
  appearance: true,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: "/mark.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#13736f" }],
    ["meta", { name: "color-scheme", content: "light dark" }],
  ],
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      { text: "Docs", link: "/docs/" },
      { text: "Guide", link: "/docs/guide/quick-start" },
      { text: "Providers", link: "/docs/provider-setup" },
      { text: "Troubleshooting", link: "/docs/troubleshooting" },
      { text: "Privacy", link: "/docs/privacy" },
      { text: "GitHub", link: "https://github.com/dannylee1020/swan" },
    ],
    sidebar: {
      "/docs/": [
        {
          text: "Start",
          items: [
            { text: "Introduction", link: "/docs/" },
            { text: "Quick start", link: "/docs/guide/quick-start" },
            { text: "Install", link: "/docs/guide/install" },
          ],
        },
        {
          text: "Configure",
          items: [
            { text: "Settings", link: "/docs/guide/configure" },
            { text: "Provider setup", link: "/docs/provider-setup" },
            { text: "Agent prompt", link: "/docs/agent/" },
            { text: "Domain tracking", link: "/docs/guide/domain-tracking" },
          ],
        },
        {
          text: "Operate",
          items: [
            { text: "Test and verify", link: "/docs/guide/test-and-verify" },
            { text: "Troubleshooting", link: "/docs/troubleshooting" },
            { text: "Update Swan", link: "/docs/guide/update" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "Architecture", link: "/docs/reference/architecture" },
            { text: "Privacy", link: "/docs/privacy" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/dannylee1020/swan" },
    ],
    outline: {
      level: [2, 3],
      label: "On this page",
    },
    footer: {
      message: "Open source browser intervention software.",
      copyright: "Swan is open source software.",
    },
  },
});
