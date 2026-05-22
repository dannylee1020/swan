import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Swan",
  description:
    "Self-hosted browser intervention docs for installing, configuring, and running Swan.",
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
      { text: "Guide", link: "/guide/quick-start" },
      { text: "Providers", link: "/provider-setup" },
      { text: "Troubleshooting", link: "/troubleshooting" },
      { text: "GitHub", link: "https://github.com/dannylee1020/swan" },
    ],
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Quick start", link: "/guide/quick-start" },
          { text: "Install and load", link: "/guide/install" },
        ],
      },
      {
        text: "Configure",
        items: [
          { text: "Settings", link: "/guide/configure" },
          { text: "Provider setup", link: "/provider-setup" },
          { text: "Domain tracking", link: "/guide/domain-tracking" },
        ],
      },
      {
        text: "Operate",
        items: [
          { text: "Test and verify", link: "/guide/test-and-verify" },
          { text: "Troubleshooting", link: "/troubleshooting" },
          { text: "Update Swan", link: "/guide/update" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Architecture", link: "/reference/architecture" },
          { text: "Storage and privacy", link: "/reference/storage-privacy" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/dannylee1020/swan" },
    ],
    outline: {
      level: [2, 3],
      label: "On this page",
    },
    footer: {
      message: "Self-hosted browser intervention for technical users.",
      copyright: "Swan is open source software.",
    },
  },
});
