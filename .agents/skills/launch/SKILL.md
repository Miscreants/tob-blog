---
name: launch
description: Audit an Astro site before launch. Verify production identity, canonicals, OG assets, favicons, robots, sitemap, built HTML, links, placeholders, environment variables, legal content, performance, and deployment readiness. Use for staging or production launch checks, client handoff, first deployment to a real domain, or when asked what remains before a site can go live.
---

Run a pre-launch audit. Never report an unrun check as passed; mark it `NEEDS HUMAN`.
Do not fix anything before Step 8. Audit, report, then fix only with permission.

This is the executable form of the pre-launch checklist [checklist.pre-launch]. Bracketed tokens below are **rule ids** — look them up in `docs/` (the router is `docs/workflow.md`). `npm run docs:check` fails if any id cited here no longer exists.

**Severity standard.** `BLOCKER` means a visitor experiences something broken, or there is a legal or brand exposure. Everything else is `SHOULD FIX` or lower. If every check is a blocker, the label stops meaning anything and people start overriding it.

## Step 0 — Set mode

Read `$ARGUMENTS` (or the arguments passed to this skill) as `staging` or `production`; default to `production`. State the mode and continue.

| Check | staging | production |
|---|---|---|
| Indexing control | At least one [seo.staging] method in place; none found is **BLOCKER** | Must be indexable — any `noindex` reaching production is **BLOCKER** |
| `robots.txt` crawl rule | `Disallow: /` is a secondary signal only, never the control itself | Must not block crawling; `Disallow: /` is **BLOCKER** |
| Sitemap | Do not advertise one | `sitemap-index.xml` required; missing is **BLOCKER** |
| Empty public links | Ignore as work in progress | **BLOCKER** |
| Placeholder copy | **SHOULD FIX** | **BLOCKER** |
| `site` domain | Real domain not required before cutover | Must be the client's real domain |

## Step 1 — Establish facts and build

Read:

- `astro.config.mjs`: `site`, `SITEMAP_EXCLUDE`, integrations, adapter
- `src/data/site.ts`: `name`, `url`, `description`, `ogImage`, `logo`, `twitter`, `sameAs`
- `package.json`: `name`, scripts
- `.env.example`: declared keys
- `AGENTS.md`: real domain, host, and client-specific requirements

Run `npm run check` and retain the build log. If it fails, stop and report the failure as the only blocker; output checks are invalid without a successful build.

Trust project files and built output over stale notes or TODOs.

## Step 2 — Identity, URLs, and robots

Report each finding with its severity:

- `site.ts` `url` is `https://example.com` — **BLOCKER** in production, **SHOULD FIX** in staging. The build only warns about this ([seo.identity]); this audit is the gate, so do not assume a successful deploy means the domain is set
- `astro.config.mjs` declares its own `site` string instead of importing `site.url` from `src/data/site.ts` — **BLOCKER**, the two-source drift [seo.identity] exists to prevent
- In production, `site.ts` `url` is not the client's real domain, including protocol, host and no trailing slash — **BLOCKER**
- `site.ts` still contains `Your Site Name` or `One-line description of the site…` — **BLOCKER**
- `DESIGN.md` still carries the starter's unanswered prompts (`<Client name>`, "Prompt — replace this section") — **SHOULD FIX**. Nothing user-visible breaks, but the brand contract was never filled in, so every later build decision on this project was made without one ([tokens.design-doc])
- `package.json` `name` is `astro-playground` — **NIT**

Check the build log from Step 1 for the `[site]` placeholder warning — it is the cheapest confirmation, but its absence proves nothing, so still read `site.ts` directly.

### Indexing control

**`Disallow: /` is not indexing control** ([seo.staging]). A disallowed URL can still be indexed from external links, and a crawler blocked by robots.txt never reads a page-level `noindex` — so a staging site protected only by robots.txt can and does end up in search results.

**In staging mode**, establish that at least one real method is in place. Two are verifiable from the repository, two are not:

| Method | How to verify |
|---|---|
| `X-Robots-Tag: noindex, nofollow` on the preview host | Look for it in `public/_headers` or host config **scoped to preview only**. A blanket rule in `public/_headers` also hits production — report that as a production **BLOCKER** (see below) |
| `<meta name="robots" content="noindex">` on every page | Confirm `noindex` reaches the built HTML for every route, not just some |
| Host-level access control (password/SSO) | **NEEDS HUMAN** — not visible in the repo |
| Non-public preview URL, never linked | **NEEDS HUMAN** — not visible in the repo |

- No method found and none confirmable — **BLOCKER**
- Only `Disallow: /` present, with no other method — **BLOCKER**. State plainly that this does not prevent indexing
- A method is present but unverifiable from here — **NEEDS HUMAN**, naming which one and how to confirm it

**In production mode**, the risk inverts — the danger is a staging protection surviving cutover:

- `public/_headers` carries a blanket `X-Robots-Tag: noindex` — **BLOCKER**. It ships to production and deindexes the live site
- Any built page carries `<meta name="robots" content="noindex">` that isn't a deliberate draft or internal route — **BLOCKER**
- Verify the **response headers** of the production deploy, not just the repo — a host-level preview rule can outlive the preview

Then inspect the repository copy of `public/robots.txt` and its body:

- Production contains a crawl-blocking rule such as `Disallow: /` — **BLOCKER**
- Production file is missing, lacks `Sitemap:`, or points to a host other than `site` — **SHOULD FIX**
- Staging lacks `Disallow: /` — **NIT** when a real method from the table is in place; it is a useful secondary signal, not the control

### AI crawler policy

House default on a client site is allow-all ([seo.ai-crawlers]) — clients want to be cited in LLM answers. **The starter ships blocked**, and scaffold step 5 flips it, so the most likely finding here is that the flip never happened.

- In production, `robots.txt` is still the starter's `User-agent: * / Disallow: /` with the allow policy sitting commented beneath it — **BLOCKER**. The site is invisible to every crawler, AI and search alike
- An AI crawler is `Disallow`ed with no recorded client decision — **SHOULD FIX**. Confirm it was deliberate; nothing in the code explains it later
- A `Disallow` was added to `User-agent: *` expecting it to cover AI bots that have their own named groups — **BLOCKER**. It does not apply to them, so the site is blocked for general crawlers while still open to the ones that were meant to be blocked
- The named AI groups are missing entirely — **NIT**. `User-agent: * / Allow: /` still permits them; the groups exist to make the decision explicit

Do not treat a missing `llms.txt` as a finding at any severity ([seo.ai-crawlers]).

Do not use HTTP 200 alone as proof: a host may synthesize a `robots.txt` that lacks the required rules.

## Step 3 — Referenced assets

Resolve every referenced asset:

- `site.ts` `ogImage` missing from `public/` — **BLOCKER**
- `ogImage` is an absolute URL that returns an error — **BLOCKER**; if it cannot be fetched from this environment at all, **NEEDS HUMAN**
- `site.ts` `logo` missing — **SHOULD FIX**
- Referenced favicon, Apple touch icon, or manifest missing — **SHOULD FIX**
- Missing per-route image under `/og/<route>.png` when that convention is used — **SHOULD FIX**
- Apple touch icon is not 180×180 — **SHOULD FIX**
- OG image exceeds roughly 300 KB — **SHOULD FIX**

Hash-compare favicons and OG images against the starter's `public/` assets. A byte-identical starter asset is a **BLOCKER** because it can ship the wrong brand.

## Step 4 — Inspect built output

Inspect the HTML that will ship, not only source files.

1. Look for `dist/**/*.html`.
2. If no HTML exists because an adapter emits `dist/client/` and `dist/server/`, serve the production build or fetch the deployed site.
3. Never treat an empty HTML glob as a clean result.
4. Use a throwaway Node script in the scratchpad; do not add it to the repository.

For every public page collect:

- `<title>`
- `meta[name=description]`
- `link[rel=canonical]`
- `meta[property=og:image]`
- `h1` count
- `script[type=application/ld+json]`
- every `<a href>`
- every `<img>` without an `alt` attribute

Report:

- Missing title or description — **BLOCKER**
- Canonical missing, relative, or on a host other than `site` — **BLOCKER**
- OG image missing, relative, or unresolved — **BLOCKER**
- Missing JSON-LD or invalid JSON-LD — **SHOULD FIX**
- `h1` count not equal to 1 — **SHOULD FIX**
- Duplicate title or description across routes — **SHOULD FIX**
- Internal link resolving to no built route — **BLOCKER**
- `<img>` missing the `alt` attribute — **SHOULD FIX**

When checking compiled Astro HTML, match `\balt\b`, not `alt=`; Astro may serialize `alt=""` as bare `alt`.

### Demo routes

Check the build log and output for `/styleguide`, `/components`, and `/tve-preview`.

- Present but non-indexable and current — **SHOULD FIX**
- Reachable and indexable, linked publicly, or stale from another client — **BLOCKER**

Open at least one present demo route before assigning severity.

### Sitemap

In production, verify `sitemap-index.xml` exists, uses the `site` host, and excludes every `SITEMAP_EXCLUDE` route. Missing sitemap integration or sitemap — **BLOCKER**.

In staging, a sitemap is not required and should not be advertised to crawlers.

### Other output

- No built 404 page — **SHOULD FIX**
- `public/_headers` lacks immutable caching for `/_astro/*` or baseline security headers — **SHOULD FIX**
- On a site migration, missing or incomplete `public/_redirects` — **BLOCKER**; otherwise not applicable

## Step 5 — Content, configuration, and code smells

### Placeholder sweep

Search source and built output for:

`Lorem ipsum`, `TODO`, `FIXME`, `example.com`, `Your Site Name`, `Client Name`, `Coming soon`, `href="#"`, `href=""`, `placeholder`

Read every match in context and report only user-visible or operational findings with `file:line`.

- Empty link on a public production route — **BLOCKER**
- Empty link on staging — ignore
- Placeholder copy on a public production route — **BLOCKER**
- Placeholder copy on staging — **SHOULD FIX**
- Comments, unused defaults, or non-shipping matches — **SHOULD FIX** at most

A dead internal route remains a **BLOCKER** in both modes.

### Environment variables

Find both categories:

1. Build-time: `import.meta.env.PUBLIC_[A-Z_]+`
2. Runtime: `cloudflare:workers` env reads, `getEnv()`, `wrangler secret`, and bindings in `wrangler.jsonc` or `wrangler.toml`, including D1, R2, KV, IMAGES, and `send_email`

Verify:

- Every build-time key appears in `.env.example`
- Every runtime secret or binding is documented
- Missing `.env.example` — **SHOULD FIX**
- Presence of each required key in the host's build or runtime configuration — **NEEDS HUMAN** unless verified directly

List every key and where it must be configured. Do not infer deployment configuration from a successful local build.

### Form endpoint

If the site ships a form, the endpoint carries requirements code alone can't prove ([components.forms]).

- Endpoint has no origin check, no body-size cap, or no per-field length limits — **BLOCKER**
- Any value reaching a mail header (`Subject`, `From`, `Reply-To`) isn't stripped of CR/LF — **BLOCKER**. This is header injection: a newline in a name forges an extra `Bcc` or `Reply-To`
- Submission contents — names, addresses, message bodies — are written to logs — **SHOULD FIX**. Personal data in a log store with an unbounded retention window
- **Rate limiting is not visible in the repo** — **NEEDS HUMAN**. It belongs at the platform edge; an in-memory counter in an ephemeral edge isolate counts nothing while looking like protection. Confirm a WAF rate-limiting rule covers `/api/*`
- No alert points at the endpoint's error path — **SHOULD FIX**. A form that silently stops delivering is the expensive failure, not a bounced submission. The reference endpoint logs `[contact:error]`; confirm something watches for it
- Runtime keys and bindings (`ALLOWED_ORIGIN`, `NOTIFY_TO`, `FROM_EMAIL`, the `send_email` binding) present on the host — **NEEDS HUMAN** unless checked directly. Missing ones don't fail a build; they fail a submission, quietly

### Analytics and consent

For GTM, GA, or HubSpot IDs, verify the ID is real, not inherited from the starter, and consent gating required by [perf.third-party] is present — **SHOULD FIX**.

### Legal pages

Inspect whatever privacy, cookie, or terms content the site ships:

- Invented or placeholder legal text in production — **BLOCKER**, whether or not the site collects data
- The site collects personal data (forms, email capture, uploads, accounts) and ships no privacy policy — **BLOCKER** in production
- Required legal documents absent or not supplied by the client — **NEEDS HUMAN**

### Animated canvas

For every `requestAnimationFrame`, verify the same file includes:

- `prefers-reduced-motion`
- a mobile breakpoint
- an `IntersectionObserver` or `visibilitychange` pause

Missing gating — **SHOULD FIX**. Mention it as a likely contributor when mobile performance is low.

## Step 6 — Browser pass

Serve the production build with `npm run preview`, not the development server.

Test the homepage, one listing page, and one detail page with chrome-devtools MCP:

- Lighthouse: Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO = 100
- Below-target score — **SHOULD FIX**
- Accessibility below 100 — **BLOCKER**
- Console error on load — **BLOCKER**
- Console warning on load — **SHOULD FIX**
- Keep the default viewport unless asked otherwise

If Lighthouse cannot run, report `NEEDS HUMAN`; never estimate scores.

## Step 7 — Report

Use these sections in order, most severe first within each:

```text
BLOCKER      (n)   ship-stopping: broken for a visitor, or a legal or brand exposure
SHOULD FIX   (n)   real defects that are not ship-stopping
NEEDS HUMAN  (n)   not verified; explain why and how to verify
NIT          (n)   cleanup with no launch impact
CLEAN              checks that passed
```

Every finding must include `file:line` or route plus a one-line concrete fix.

`CLEAN` is not optional. A report listing only failures gives no signal about coverage, and the reader cannot tell a passed check from a skipped one.

Unless verified during this run, always include these under `NEEDS HUMAN`:

- Keyboard-only and screen-reader pass ([checklist.a11y])
- Colour contrast in every active `data-theme`
- In staging: host-level access control or a non-public preview URL, when that is the [seo.staging] method in use
- In production: the deployed response headers carry no `X-Robots-Tag: noindex` left over from preview
- Contact form deployed and a real email received ([components.forms])
- Client sign-off on production copy
- DNS or domain cutover and verification on the real host
- Git history committed under the correct author identity

End with the number of findings safe to auto-fix and ask before changing files.

## Step 8 — Fix only with permission

Auto-fix only:

- `robots.txt` sitemap host, and removing a crawl-blocking rule in production
- `package.json` `name`
- `site.ts` `url` when the real domain is known
- sitemap integration or `SITEMAP_EXCLUDE` entries
- `_headers` immutable caching rule

Never auto-fix user-visible copy, legal text, favicons, OG artwork, or redirect maps.

**Never auto-fix indexing control.** Adding `Disallow: /` to staging looks like a fix and isn't one ([seo.staging]) — it would close the finding while leaving the site indexable. Choosing between access control, an `X-Robots-Tag` header and meta-`noindex` depends on host setup you cannot see, so report it and let a human choose. Likewise never auto-remove a production `noindex` without confirming it isn't a deliberate draft route.

After approved fixes, rerun the audit and report the delta.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[checklist.a11y]: ../../../docs/checklists/accessibility.md#accessibility-audit-per-page
[checklist.pre-launch]: ../../../docs/checklists/pre-launch.md#pre-launch
[components.forms]: ../../../docs/rules/components.md#forms--form--field-progressively-enhanced-and-hardened
[perf.third-party]: ../../../docs/rules/performance.md#third-party-scripts
[seo.ai-crawlers]: ../../../docs/rules/seo.md#ai-crawler-policy
[seo.identity]: ../../../docs/rules/seo.md#site-identity--one-source-of-truth
[seo.staging]: ../../../docs/rules/seo.md#staging--preview-indexing-control
[tokens.design-doc]: ../../../docs/rules/tokens.md#designmd-records-decisions-not-values
<!-- /rule-links -->
