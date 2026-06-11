import { defineConfig } from "vitepress";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const SITE_URL = "https://swan-oss.com";
const SITE_NAME = "Swan";
const DEFAULT_DESCRIPTION =
  "Open-source Chrome extension that interrupts unwanted porn urges with local domain detection and an immediate phone call.";
const GITHUB_URL = "https://github.com/dannylee1020/swan";
const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/swan/pckfmifdcfhalnpaiknalfcpagdgmbjg";

function pageUrl(relativePath: string): string {
  const withoutExtension = relativePath.replace(/\.md$/, "");
  if (withoutExtension === "index") return "/";
  if (withoutExtension.endsWith("/index")) {
    return `/${withoutExtension.slice(0, -"index".length)}`;
  }
  return `/${withoutExtension}`;
}

function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}

async function collectHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) return collectHtmlFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".html")) return [fullPath];
      return [];
    }),
  );
  return files.flat();
}

export default defineConfig({
  lang: "en-US",
  title: "Swan",
  description: DEFAULT_DESCRIPTION,
  titleTemplate: ":title | Swan",
  appearance: true,
  cleanUrls: true,
  lastUpdated: true,
  transformPageData(pageData) {
    const description =
      pageData.frontmatter.description ?? DEFAULT_DESCRIPTION;
    const title = pageData.title
      ? `${pageData.title} | ${SITE_NAME}`
      : `${SITE_NAME} | Phone-call porn urge interruption`;
    const url = absoluteUrl(pageUrl(pageData.relativePath));
    const head = (pageData.frontmatter.head ??= []);

    head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: SITE_NAME }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { name: "twitter:card", content: "summary" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
    );

    if (pageData.relativePath === "index.md") {
      head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Swan",
          applicationCategory: "BrowserApplication",
          operatingSystem: "Chrome, Chromium",
          description: DEFAULT_DESCRIPTION,
          url: SITE_URL,
          installUrl: CHROME_WEB_STORE_URL,
          codeRepository: GITHUB_URL,
          license: "https://www.apache.org/licenses/LICENSE-2.0",
        }),
      ]);
    }
  },
  async buildEnd(siteConfig) {
    const htmlFiles = await collectHtmlFiles(siteConfig.outDir);
    const urls = htmlFiles
      .filter((file) => !file.endsWith("404.html"))
      .map((file) => {
        const relativeFile = relative(siteConfig.outDir, file)
          .split(sep)
          .join("/");
        const pathname = relativeFile
          .replace(/(^|\/)index\.html$/, "$1")
          .replace(/\.html$/, "");
        return absoluteUrl(`/${pathname}`);
      })
      .sort();
    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
      "</urlset>",
      "",
    ].join("\n");

    await writeFile(join(siteConfig.outDir, "sitemap.xml"), sitemap);
  },
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
      { text: "Add to Chrome", link: CHROME_WEB_STORE_URL },
      { text: "Guide", link: "/docs/guide/quick-start" },
      { text: "Providers", link: "/docs/provider-setup" },
      { text: "Troubleshooting", link: "/docs/troubleshooting" },
      { text: "Privacy", link: "/docs/privacy" },
      { text: "GitHub", link: GITHUB_URL },
    ],
    sidebar: {
      "/docs/": [
        {
          text: "Start",
          items: [
            { text: "Introduction", link: "/docs/" },
            { text: "Chrome Web Store", link: "/docs/chrome-web-store" },
            { text: "Quick start", link: "/docs/guide/quick-start" },
            { text: "Install", link: "/docs/guide/install" },
          ],
        },
        {
          text: "Learn",
          items: [
            { text: "Chrome porn blocker", link: "/docs/chrome-porn-blocker" },
            {
              text: "Open-source porn blocker",
              link: "/docs/open-source-porn-blocker",
            },
            {
              text: "Swan vs passive blockers",
              link: "/docs/compare-passive-porn-blockers",
            },
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
      { icon: "github", link: GITHUB_URL },
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
