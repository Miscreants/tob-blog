# Agent contract

The active contract for this repo. Read this, then follow the router. Everything here is a pointer — the rules themselves live in `docs/rules/`, stated exactly once.

## Required preflight

Before planning or editing anything under `src/`, read:

1. **[`docs/workflow.md`](./docs/workflow.md)** — routes your task to the modules you actually need, and to a verification tier.
2. **[`DESIGN.md`](./DESIGN.md)** — this client's token values and brand decisions.

Then read only the modules `workflow.md` sends you to. Don't read the whole rulebook for a small change, and don't skip it for a shared one.

Write your verification tier down before you edit. The classifier is in [`docs/workflow.md`](./docs/workflow.md#before-you-edit--pick-a-verification-tier).

## Non-negotiables

One line each. The rule and its reasoning live behind the link.

1. **Semantic tokens only** — style with utilities mapped to roles (`bg-intent`, `text-fg-muted`, `border-stroke`). Never a raw hex, `rgba()`, or a raw Tailwind neutral (`text-gray-700`). → [`rules/tokens.md`](./docs/rules/tokens.md)
2. **Pages compose sections** — `pages/*.astro` is a thin table of contents. Push markup down into `Section*` components; no page-level `<style>` or `<script>`. → [`rules/components.md`](./docs/rules/components.md)
3. **Sections build on `SectionMain`** — it owns the `<section>` landmark, the centered column, the rhythm presets and the side rules. Hand-rolled section wrappers drift. → [`rules/components.md`](./docs/rules/components.md)
4. **Accessibility is authored, not retrofitted** — native semantics first, ARIA only where native falls short; keyboard, focus and reduced motion ship with the component. → [`rules/accessibility.md`](./docs/rules/accessibility.md)
5. **Images go through `astro:assets`** — imported from `src/images/`, never a raw `/public` path. Never lazy-load the LCP image. → [`rules/performance.md`](./docs/rules/performance.md)
6. **Animated canvases are gated** — reduced-motion static, paused offscreen and when hidden, static fallback, compile deferred off the LCP path. → [`rules/performance.md`](./docs/rules/performance.md)
7. **Typed props, defaults in the destructure, union variants, always accept `class`.** → [`rules/components.md`](./docs/rules/components.md)
8. **Head metadata only through `Layout` props** — never emit head tags from a page. → [`rules/seo.md`](./docs/rules/seo.md)
9. **Never report an unrun check as passed.** Say what you skipped and why. → [`docs/workflow.md`](./docs/workflow.md)

## Edit surface

- **Build the product** by adding `Section*` components and routes under `src/components/` and `src/pages/`.
- **Keep routes thin** — a route composes sections and passes `Layout` props.
- **`src/demos/` never becomes `src/pages/`.** Anything in `pages/` ships to production.
- **Don't modify a shared component for a one-off page need.** Add a prop or wrap it locally; changing a shared primitive is a reviewed change.
- **Don't hand-edit a `rule-links` block** — those are generated. After moving a rule or changing a citation, run `npm run docs:build`.
- **Don't restate a rule** here, in `CLAUDE.md`, or in a skill. Link to it.

## How to add a page

1. Create `src/pages/<route>.astro` (kebab-case).
2. Wrap in `<Layout title="…" description="…" jsonLd={…}>` — head and SEO are handled for you.
3. Compose existing sections and components. **Reuse before creating**; the starter ships 50+ components and most needs are a prop away.
4. For a new chunk of page, add a `Section*` component that renders `<SectionMain>` as its root.
5. Work [`docs/checklists/page.md`](./docs/checklists/page.md), then run the checks for your tier.

## Where to look

| Need | Location |
|---|---|
| The rules | [`docs/`](./docs/README.md) — start at [`docs/workflow.md`](./docs/workflow.md) |
| Brand values for this client | [`DESIGN.md`](./DESIGN.md) |
| What components exist | `src/components/` (flat) and the live showcase at `/components` in dev |
| Per-component docs | `src/content/components/*.mdx` |
| Site identity | `src/data/site.ts` |
| Tokens | `src/styles/global.css` |
| Structured data | `src/lib/schema.ts` |
| Known gaps in the starter | [`docs/conformance.md`](./docs/conformance.md) |

## Required checks

```sh
npm run check       # type gate + production build
npm run spellcheck  # whole repo — advisory report, never fails a build
npm run docs:build  # after editing anything in docs/
```

`spellcheck` reports and always exits 0; resolve every word it lists — fix, add a real term to `cspell.json`, or verify it against client material ([content.copy]). en-US is the priority spelling.

Run the checks your verification tier requires — not fewer, and not the full launch gate for a copy edit. For a launch, use the `launch` skill, which executes [`docs/checklists/pre-launch.md`](./docs/checklists/pre-launch.md) against the built output.

## Done means

- The tier's checks ran and passed, and anything skipped is named.
- The page or component meets its checklist in [`docs/checklists/`](./docs/checklists/).
- It renders in every theme the project ships, at every width in the responsive contract.
- No new hardcoded color, duration or easing.
- `npm run check` is clean.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[content.copy]: ./docs/rules/content.md#copy-quality--spell-check-flags-a-human-decides
<!-- /rule-links -->
