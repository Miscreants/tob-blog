<!--docs-module: rules/content-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->
<!-- cspell:ignore recieve behaviour initialised normalised — misspellings quoted deliberately as examples in [content.copy] -->

## Content collections & data
<!--rule: content | tier: reference-->

### Collections (`content.config.ts`)
<!--rule: content.collections | tier: required-->
- Every collection is **Zod-typed**. No untyped content.
- **Use `reference()` for taxonomies** so a typo'd tag fails at build, not in production.
- **Use `image()` in the schema** for content images so they go through `astro:assets`. Paths resolve relative to the data file.
- **Model dual internal/external entries** where useful (an `externalUrl` that links off-site and skips detail-page generation).
- Keep schemas lean — add fields when real content needs them.
- A frontmatter `slug` field **overrides** the glob entry id; route on `entry.id` unless you deliberately want that.

### Content-source seam
<!--rule: content.source-seam | tier: default-->

Components and sections take **plain data props** — arrays and objects with a shape the component owns. The mapping from a source (files today, a CMS tomorrow) to that shape lives in a loader or a `lib/` function, never inside the component.

This costs nothing now and means adding a CMS later is a loader change, not a component rewrite. When a project does add a CMS, keep the seam: file-based content and API content produce the same shape.

### Data registries (`src/data/*.ts`)
<!--rule: content.registries | tier: default-->
- Centralize lookup tables (footer links, nav menus) and site identity. **No hardcoded link lists inside components.**
- Filter placeholder entries (`href: "#"`) at render time.
- **Validate references at build time** — prefer a thrown error over a silent fallback.

### Draft handling
<!--rule: content.drafts | tier: required-->
`draft: true` must (a) set `noindex`, and (b) be excluded from sitemap and index listings.

### Copy quality — spell-check flags, a human decides
<!--rule: content.copy | tier: required-->

**Run `npm run spellcheck` before any page is called done, and resolve every word it flags.** A typo in a heading costs the client more credibility than most of the engineering rules on this page protect, and it is the one class of defect a reviewer's eye slides straight over.

**`en-US` is the priority spelling, sitewide.** `cspell.json` sets `"language": "en-US"`, so `behaviour`, `initialised`, `normalised` and friends are flagged as a matter of course — that is deliberate, not noise. A project ships another locale only if `DESIGN.md` says so, and then it changes in `cspell.json` **once**, for the whole site. Never mix: `-ise` next to `-ize` reads as carelessness even when both spellings are individually correct.

**It reports; it never fails a build.** The script runs `cspell` over **the whole repo** — every page, component, content entry, doc, config and script comment — with `--no-exit-code`, and is deliberately **not** part of `npm run check` ([structure.gate]). Client copy is full of niche vocabulary — product names, industry jargon, coined terms, deliberate stylings — and a gate that blocks a deploy over a correctly-spelled word nobody's dictionary knows trains everyone to bypass it. An advisory list a human reads is worth more than a hard gate people learn to route around.

- **Scope is every page and every file, not just `src/`.** Collection entries, labels and link text in `src/data/*`, section copy, `alt` text, meta titles and descriptions, form labels, validation and error strings, button labels, and `aria-label`s — screen-reader-only text counts, it is read aloud. The rulebook under `docs/`, `DESIGN.md`, `AGENTS.md` and comments in config and scripts are checked too: a typo there misleads the next agent that reads it.
- **Resolving a flag means deciding, one of three ways**: fix a genuine typo; add a real term to `words` in `cspell.json` so it's silent from then on; or leave it if it's a one-off you've verified. Don't leave the list unread — an unread report is the same as no report.
- **Client, product and person names are verified against a client source, never corrected by intuition.** A deliberate coinage or an odd-looking handle is usually right — check the client's own material before "fixing" anything.
- **Adding a word to the dictionary is still a decision.** `cspell.json` is reviewed like any other file; a change that adds `recieve` to `words` is a change that ships `recieve`.
- **Never resolve an en-GB flag by adding it to `words`.** That is the one case where the fix is always to change the copy, not the dictionary — `words` is for terms no locale knows, not for a second spelling of one it does.
- **Inline suppressions are scoped**: `<!-- cspell:ignore ... -->` at the top of the one file that needs it, never a blanket `cspell:disable`.

The tool catches spelling, not sense. It cannot see a duplicated word, a wrong-but-real word (`form`/`from`, `pubic`/`public`), or a broken sentence — [checklist.page] still gates on a human read-through.

### `.md` vs `.mdx` — pick by whether the author places components
<!--rule: content.md-vs-mdx | tier: default-->
- **Default to `.md`** for editorial content — prose with frontmatter and standard elements. Lighter build, authors need zero component knowledge.
- **Use `.mdx` only when the content must embed components** — importing and placing components inline, or needing JSX expressions.
- You can restyle standard elements in plain `.md` via the `components` prop when rendering `<Content />` — so reserve `.mdx` for when the *author* places components, not merely to restyle output.
- **In the starter:** `content/faq` and `content/announcements` are `.md`; `content/components` is `.mdx` because each entry renders live previews of the component it documents.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[checklist.page]: ../checklists/page.md#page-done
[content.copy]: ./content.md#copy-quality--spell-check-flags-a-human-decides
[structure.gate]: ./structure.md#required-scripts--the-type--build-gate
<!-- /rule-links -->
