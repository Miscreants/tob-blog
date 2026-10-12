// RSS 2.0 feed of the 50 newest posts. Hand-built — the format is small and
// @astrojs/rss would be the only reason for a dependency.
import type { APIRoute } from "astro";
import { getPosts, postHref } from "../lib/blog";
import { site } from "../data/site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).slice(0, 50);
  const items = posts
    .map((p) => {
      const url = new URL(postHref(p), site.url).href;
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.data.description)}</description>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <category>${esc(p.data.location)}</category>
${p.data.authors.map((a) => `      <dc:creator>${esc(a)}</dc:creator>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.url}/</link>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(site.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
