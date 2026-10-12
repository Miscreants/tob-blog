<!--docs-module: rules/seo-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## SEO, head & metadata
<!--rule: seo | tier: reference-->

### Site identity — one source of truth
<!--rule: seo.identity | tier: required-->

`src/data/site.ts` owns site-wide identity:

```ts
export const site = {
  name: "Your Site Name",
  url: "https://example.com",
  description: "One-line description…",
  ogImage: "/og.jpg",
  logo: "/logo.png",
  twitter: "",
  sameAs: [] as string[],
};
```

**Required:** `astro.config.mjs` **imports** this value for its `site` field rather than repeating the URL. Astro loads the config through Vite, so importing a `.ts` module works. Two copies of the domain plus a checklist item to keep them in sync is not a single source of truth.

**Default:** a placeholder origin **warns and never fails the build**:

```js
import { site } from './src/data/site.ts';

const PLACEHOLDER_ORIGIN = 'example.com';

if (site.url.includes(PLACEHOLDER_ORIGIN)) {
  console.warn(`[site] url is still the ${PLACEHOLDER_ORIGIN} placeholder — fine for previews, set the real domain before launch.`);
}

export default defineConfig({ site: site.url, /* … */ });
```

**Don't make this fail the build.** Deploying a preview before the client's domain is decided is normal — sites sit on a `*.pages.dev` URL for weeks while nothing is indexed or linked. Failing the build is the most disruptive response available, aimed at a problem that only exists at cutover, and it punishes every preview deploy to prevent one launch mistake.

The gate for this is [checklist.pre-launch], which blocks on a placeholder origin in production mode and runs deliberately at cutover. A build-time throw would be a third layer over something already covered there and in the launch audit, with the worst ergonomics of the three.

The same reasoning rules out an environment-variable escape hatch: a variable that switches the check off is a footgun in a client repo, where someone setting it once silently removes the protection for good.

### The `Layout.astro` contract
<!--rule: seo.layout-contract | tier: required-->

Every page goes through `Layout`. Its props are the page's whole head surface:

| Prop | Type | Purpose |
|---|---|---|
| `title` | `string` | page title |
| `description` | `string?` | meta description; falls back to `site.description` |
| `image` | `string?` | social image; falls back to `site.ogImage`, resolved absolute |
| `ogType` | `"website" \| "article"` | `article` for posts |
| `noindex` | `boolean?` | drafts and internal pages |
| `jsonLd` | `object \| object[]` | structured data from `lib/schema.ts` |
| `theme` | `"light" \| "dark" \| "brand"` | sets `data-theme` on the document root |
| `frontmatter` | `object?` | auto-populated for `.md`/`.mdx` pages using `layout:` |

Markdown pages pass their frontmatter under `frontmatter` while `.astro` pages pass props flat; the layout falls back so both work. **Pages set head metadata only through these props** — never by emitting tags directly.

### The `Seo.astro` component
<!--rule: seo.component | tier: reference-->

`src/components/Seo.astro` owns all head metadata:

```ts
interface Props {
  title: string;
  description?: string;
  ogType?: "website" | "article";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}
```

It emits `<title>` + description, canonical (computed from `Astro.url`, absolute against `Astro.site`), `robots` when `noindex`, favicons, full Open Graph, Twitter Card, and one `<script type="application/ld+json">` per schema.

### JSON-LD via `lib/schema.ts`
<!--rule: seo.json-ld | tier: default-->

Structured data lives in `src/lib/schema.ts` as **pre-built graphs + builder functions**, not inline in pages:

- **`homepageSchema`** — a `@graph` with `Organization` + `WebSite` + `WebPage`, built from `site.*`.
- **`articleSchema({ path, title, description, datePublished, … })`** — `Article` + `BreadcrumbList`, with an optional `breadcrumbParent`.
- **Cross-referencing via `@id`**: every node has a stable `@id` (`${site.url}/#organization`) and others reference it — one canonical Organization/WebSite, no duplication.

**Standard:** homepage emits Organization + WebSite; content detail pages emit Article + BreadcrumbList; FAQ pages emit FAQPage. Extend `schema.ts` per project rather than inlining schema in pages.

### Sitemap
<!--rule: seo.sitemap | tier: default-->

`@astrojs/sitemap` is wired with a filter that excludes internal routes:

```js
const SITEMAP_EXCLUDE = ['/styleguide', '/components', '/tve-preview'];
```

Note what this does **not** do: demo routes are already excluded from production because they live in `src/demos/` and are never injected in a normal build ([deploy.static]). The filter is a **safety net** for routes that do ship but shouldn't be indexed. Extend it per project.

### Staging & preview: indexing control
<!--rule: seo.staging | tier: required-->

**`Disallow: /` in robots.txt is not indexing control.** A disallowed URL can still be indexed from external links, and a crawler blocked by robots.txt never reads a page-level `noindex`.

**Required — a non-production deployment uses at least one of:**

1. **Access control** — host-level password/SSO (Cloudflare Access, Netlify password protection). Strongest, and the default choice for client review sites.
2. **`X-Robots-Tag: noindex, nofollow` response header** on the preview host, with crawling still allowed so the directive is actually read.
3. **`<meta name="robots" content="noindex">`** on every page (`noindex` through `Layout`), crawling allowed.
4. **A non-public preview URL** that is never linked publicly.

`Disallow: /` may accompany these as a secondary signal, never as the primary control.

> **Implementation caveat:** `public/_headers` ships to production too, so a blanket `X-Robots-Tag: noindex` there would deindex the live site. Apply it through a host-level rule scoped to preview deployments, or emit it from a build-time environment flag — and verify the production response headers before launch.

### Drafts & announcements
<!--rule: seo.drafts | tier: required-->

- `draft: true` content sets `noindex`, and is excluded from listings and the sitemap.
- Announcements are a scheduled collection (`startsAt`/`endsAt`/`enabled`/`priority`); the layout picks the top active one at build time.

### robots.txt & error pages
<!--rule: seo.robots-404 | tier: default-->

- Ship **`public/robots.txt`**. On a client site it allows crawling and links the sitemap (`Sitemap: https://<site>/sitemap-index.xml`); the starter ships it blocked and scaffold step 5 flips it ([seo.ai-crawlers]).
- Ship a styled **`src/pages/404.astro`** using `Layout`. Both hosts serve it for unknown static routes.

### AI crawler policy
<!--rule: seo.ai-crawlers | tier: default-->

**House policy on a client site: AI crawlers are allowed.** Clients want to be findable and cited in LLM answers, so `public/robots.txt` permits both answer engines and training crawlers, each as an explicitly named group.

**The starter itself ships blocked.** It is a template — its preview deployment has no reason to be crawled, indexed, or used as training data. `public/robots.txt` therefore ships as `User-agent: * / Disallow: /`, with the full allow policy sitting directly beneath it as a commented block. **Scaffold step 5 swaps them** ([runbook]); the launch audit blocks on a production `Disallow: /`, so forgetting is caught rather than shipped.

Keeping the allow policy inside the same file, rather than only in this document, means the flip is one edit with nothing to retype and no drift between the rule and the file.

> **Why the starter does not ship `X-Robots-Tag: noindex` in `public/_headers`.** It would be a stronger signal, but that file inherits into every client repo and a blanket `noindex` reaching production deindexes the live site — the exact BLOCKER [seo.staging] defines. Better to keep the landmine out of the template than to rely on an audit to defuse it in every project. The starter's preview relies on `Disallow: /` plus its URL not being linked publicly; if that preview is ever shared widely, add host-level access control or an `X-Robots-Tag` rule in the host dashboard, where it can't be inherited.

The named groups are technically redundant against `User-agent: *`. They exist so the decision is **written down rather than inferred** — an undeclared default is indistinguishable from nobody having thought about it, and it silently changes meaning the first time someone tightens the wildcard group.

**The gotcha that makes this worth doing:** a crawler with its own named group ignores the `*` group entirely. A `Disallow` added to `*` does **not** apply to any bot with its own group. Add it to each group you mean it for.

**The split that matters when a client opts out** is answer engines versus training crawlers — being cited in AI answers is a different trade from having content train a model, and a client can reasonably allow the first while refusing the second. `Google-Extended` and `Applebot-Extended` are not crawlers at all; they are control tokens for whether content grounds Gemini/AI Overviews and Apple Intelligence. Record any deviation from allow-all in the client's `DESIGN.md` or brief, since nothing in the code will explain it later.

> **`llms.txt` is not required, and not part of launch.** Measurements across hundreds of millions of AI bot visits put direct `/llms.txt` fetches at roughly **0.1% of AI crawler traffic** — GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended crawl HTML directly — and no major provider has committed to reading it in production. What actually earns citations is what this starter already does: static HTML, real semantics, correct headings, and JSON-LD ([seo.json-ld]). Add `llms.txt` if a client asks for it; don't sell it as visibility work, and don't gate a launch on it.

### Astro/host gotchas (pure-static)
<!--rule: seo.host-gotchas | tier: reference-->

- **Don't call a syntax highlighter directly in component frontmatter** (e.g. `shiki.codeToHtml`) — it can silently truncate static HTML on some hosts. Use `<Code />` from `astro:components`.
- For **pure-static** sites, **stay adapter-free** so Astro's default Sharp image service runs at build. A host adapter's image service may be a passthrough that emits mislabelled formats.
- A path matching a dynamic route but excluded from `getStaticPaths` can 500 in a host's dev runtime with a misleading error — **verify routing against a production build**, not dev ([guardrails.local-dev]).
- Pre-launch, `site` / JSON-LD / canonical URLs may intentionally point at the production domain before DNS cutover. Don't "fix" them back to staging.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[checklist.pre-launch]: ../checklists/pre-launch.md#pre-launch
[deploy.static]: ./deployment.md#deployment--static
[guardrails.local-dev]: ../guardrails.md#local-development-notes
[runbook]: ../runbook.md#new-client-setup-runbook
[seo.ai-crawlers]: ./seo.md#ai-crawler-policy
[seo.json-ld]: ./seo.md#json-ld-via-libschemats
[seo.staging]: ./seo.md#staging--preview-indexing-control
<!-- /rule-links -->
