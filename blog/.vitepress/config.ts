import { defineConfig } from "vitepress";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const SITE_URL = "https://blog.swan-oss.com";
const SITE_NAME = "Swan Blog";
const DEFAULT_DESCRIPTION =
  "Field notes and practical writing about Swan, an open-source Chrome extension for interrupting unwanted porn urges.";
const MAIN_SITE_URL = "https://swan-oss.com";
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
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  titleTemplate: ":title | Swan Blog",
  appearance: false,
  cleanUrls: true,
  lastUpdated: true,
  transformPageData(pageData) {
    const description =
      pageData.frontmatter.description ?? DEFAULT_DESCRIPTION;
    const title = pageData.title
      ? `${pageData.title} | ${SITE_NAME}`
      : SITE_NAME;
    const url = absoluteUrl(pageUrl(pageData.relativePath));
    const head = (pageData.frontmatter.head ??= []);

    head.push(
      ["link", { rel: "canonical", href: url }],
      [
        "meta",
        {
          property: "og:type",
          content: pageData.relativePath === "index.md" ? "website" : "article",
        },
      ],
      ["meta", { property: "og:site_name", content: SITE_NAME }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { name: "twitter:card", content: "summary" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
    );
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
    ["meta", { name: "theme-color", content: "#ffffff" }],
    ["meta", { name: "color-scheme", content: "light" }],
  ],
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      { text: "Swan", link: MAIN_SITE_URL },
      { text: "Docs", link: `${MAIN_SITE_URL}/docs/` },
      { text: "Add to Chrome", link: CHROME_WEB_STORE_URL },
      { text: "GitHub", link: GITHUB_URL },
    ],
    aside: false,
    socialLinks: [
      { icon: "github", link: GITHUB_URL },
    ],
    outline: {
      level: [2, 3],
      label: "On this page",
    },
    footer: {
      message: "Practical notes for a narrow browser intervention tool.",
      copyright: "Swan is open source software.",
    },
  },
});
