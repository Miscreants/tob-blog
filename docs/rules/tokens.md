<!--docs-module: rules/tokens-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Design tokens & styling
<!--rule: tokens | tier: reference-->

**Get this right at intake (phase 2) and the rest of the build is fast.**

### The token model
<!--rule: tokens.model | tier: required-->

All design decisions live as CSS custom properties in `src/styles/global.css`, declared in a Tailwind v4 `@theme` block, with themes registered via `@custom-variant` and overridden per theme via `[data-theme="…"]`. Components never see raw values — only semantic roles.

**Semantic color roles (the contract).** Every client defines exactly these roles; only the values change:

| Role | Token | Purpose |
|---|---|---|
| Canvas | `--color-canvas` | page background |
| Surfaces | `--color-panel`, `--color-panel-muted` | cards/popovers; subtle surfaces + hover |
| Text | `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`, `--color-fg-on-intent` | body; secondary; disabled/placeholder; text on an intent surface |
| Intent | `--color-intent`, `--color-intent-hover` | primary action |
| Borders | `--color-stroke`, `--color-stroke-strong` | hairline; emphasized divider |
| Focus | `--color-focus` | focus ring |
| Status | `--color-error`, `--color-success`, `--color-warning` | the only permitted accent hues |
| Decoration | `--pattern-stripe` | `.section-pattern` stripes |

Decoration tokens are part of the contract because components consume them and they must flip per theme like any other role.

> **When a client has brand color**, add brand-named swatches (`--color-<brand>: …`) **separately** and *map* `--color-intent` to the primary. Keeping the brand palette distinct from `intent` lets the action color and decorative brand colors move independently, and lets `intent` flip per theme without disturbing the brand swatches.

**Theme registration & overrides.** Register variants, then re-declare the same role names per theme:

```css
@custom-variant dark  (&:where([data-theme="dark"],  [data-theme="dark"]  *));
@custom-variant brand (&:where([data-theme="brand"], [data-theme="brand"] *));

[data-theme="dark"] {
  --color-canvas: #0a0a0a;
  --color-fg: #f5f5f5;
  --color-intent: #f5f5f5;     /* monochrome intent flips with the theme */
  /* …every role… */
  color-scheme: dark;          /* don't forget — fixes native controls/scrollbars */
}
```

A single `data-theme` attribute on any ancestor flips every descendant through the cascade. No `prefers-color-scheme` magic — themes are explicit and author-controlled. `[data-theme="light"]` re-declares the defaults so a light island inside a dark ancestor forces itself back.

**Required:** every role is defined in every theme the project ships. A role that exists in one theme and not another is a bug.

### Per-client design decisions (set at intake)
<!--rule: tokens.per-client | tier: reference-->

Decide these and record them in the client's `DESIGN.md`.

| Decision | Starter stance | Note |
|---|---|---|
| Default theme | `light` | client may ship dark-default |
| Intent color | monochrome (`= fg`) | map to the brand primary when branded |
| Brand accents | none | add as separate `--color-<brand>` tokens |
| Border radius | **no global stance.** `--radius-card` / `--radius-pill` exist for the components that need a shape; most surfaces are square | rounding is a brand choice — never copy one client's stance to another |
| Depth | tonal by default; `--shadow-popover` / `--shadow-header` exist for floating UI | add more only if the design uses them |
| Fonts | three roles: heading / sans / mono | swap per brand; keep the three roles |

### `DESIGN.md` records decisions, not values
<!--rule: tokens.design-doc | tier: required-->

**`DESIGN.md` is the brand contract: what was decided for *this project*, and why. It must not contain a single color value, pixel measurement or duration.** Those live in `global.css`, which is the only place they can be true — a value written in two places drifts in one of them, and it is always the copy that nobody renders from.

**The starter ships it unanswered**, as prompts rather than content. A template pre-loaded with one project's brand decisions is worse than an empty one: the next build inherits them silently, nobody rewrites a file that already looks finished, and the agent then generates to the wrong brand with total confidence. Scaffold phase 2 fills it in ([runbook]).

**It also must not restate house rules.** Semantic tokens only, no fixed font sizes, focus rings, reduced-motion paths, explicit theming, section-owned rhythm — those apply to every build and live in `docs/rules/`. `DESIGN.md` covers only what makes *this* project different; anything universal repeated there is a second copy to maintain.

Stale design documentation is worse than none, because of how it is consumed. **A description reads to an agent as an instruction.** "The nav is a pill" becomes *make pills*, confidently, long after the nav stopped being one. Absent guidance makes an agent ask; wrong guidance makes it act.

Normative statements don't have this failure mode. *"Never use rounded corners"* stays true no matter what any component currently does — and when code contradicts it, the statement correctly identifies a bug instead of licensing one. So `DESIGN.md` should be **more** specific about intent, not vaguer:

| Belongs in `DESIGN.md` | Belongs elsewhere |
|---|---|
| Why *this* palette, shape language and motion character | The hex codes and durations → `global.css` |
| Project-specific constraints a builder must respect | Rules that apply to every build → `docs/rules/` |
| What this project deliberately does *not* do, and why | What a component looks like → `/components` and its `.mdx` |
| Which decisions are still open | Prop tables and measurements → the component itself |

Write the project rules **normatively**: *"never a radius above 4px"* survives any change to the code and correctly flags a violation, where *"cards have a 4px radius"* is false the moment someone edits a card.

The test when adding something: **does this change as a side effect of routine work, or only when someone deliberately revisits the brand?** A padding value changes incidentally and doesn't belong. A typeface choice changes deliberately and does.

Enforced by [guardrails.docs-check], which fails the gate on a hex, `px` or `ms` literal in `DESIGN.md` — the split can't be maintained by discipline alone, since forgetting to update the second copy is exactly how it broke the first time.

### Typography
<!--rule: tokens.typography | tier: required-->

Type is **fluid** via `clamp()` driven by container-query units (`cqi`), declared as `@utility` recipes so they're available as class names:

```css
@utility h1 {
  font-family: var(--font-heading);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.045em;
  font-size: clamp(2.75rem, 2.0357rem + 3.5714cqi, 5.25rem);  /* 44 → 84px */
  text-wrap: balance;
}
```

Each size interpolates linearly between two anchors: MIN at a 20rem container, MAX at 90rem.

**Rules:**
- **Always use `rem`, never `px`, for font sizes** (Required). `px` ignores the user's browser font-size preference. Figma px → rem: 16→1, 18→1.125, 24→1.5.
- Fluid type needs a query container. `body` is the default; drop `container-type: inline-size` (the `cq` / `container-large` utilities) on a wrapper to **re-anchor** the scale to that wrapper's width.
- Three font roles only: `--font-heading`, `--font-sans`, `--font-mono`.

### Layout & spacing utilities
<!--rule: tokens.layout | tier: default-->

Use the semantic layout `@utility` recipes instead of ad-hoc padding:

```css
@utility container-large  { @apply mx-auto w-full max-w-7xl; container-type: inline-size; }
@utility container-page   { @apply mx-auto w-full max-w-[90rem] px-site-margin; }
@utility section-gutter   { @apply px-4 md:px-12 lg:px-24; }
@utility section-padding  { @apply py-16 md:py-24; }   /* + -xs/-sm/-lg/-xl */
```

`container-page` is the page box every top-level element (sections, nav, footer) aligns to; its width cap is a per-client value, changed once in `global.css`. Sections reach for the rhythm utilities rather than raw `py-*`/`px-*`.

### Responsive contract
<!--rule: tokens.responsive | tier: required-->

**Mobile-first.** Author the base case for narrow viewports and add `md:` / `lg:` upward. Don't write desktop-first and undo it.

**Test widths (Required at page sign-off):** 320, 375, 768, 1024, 1440. **No horizontal scroll at 320px** on any page.

Two overflow rules that account for most real breakage:

- **A flex or grid child that must shrink needs `min-w-0`.** Flex items default to `min-width: auto`, so a wide child (a long unbroken string, a table, a pre block) forces the whole column wider than the viewport instead of wrapping.
- **`sr-only` does not clip a wide `<table>`.** Visually-hidden wrappers don't constrain an intrinsically wide descendant — wrap wide content in an `overflow-x: auto` container instead.

Anything intrinsically wide (tables, code blocks, diagrams) scrolls **inside its own container**; the page body never scrolls horizontally.

### Motion tokens
<!--rule: tokens.motion | tier: required-->

Durations and easings are centralized so "how long is a hover" has one answer:

```css
--cubic-default: cubic-bezier(0.625, 0.05, 0, 1);
--duration-default-half: 0.4s;
--timing-default-half: var(--duration-default-half) var(--cubic-default);
```

**Required:** components reference `--timing-*` / `--duration-*`. Don't hardcode `300ms` or invent a one-off easing. If a motion need isn't covered, add a token.

### Accessing tokens inside scoped `<style>` — the #1 gotcha
<!--rule: tokens.scoped-styles | tier: required-->

Astro scoped / `is:global` `<style>` blocks **cannot resolve** `@theme` tokens through `@apply` / `theme()` by default. **The standard, in priority order:**

1. **Prefer Tailwind utility classes in markup** (`class="bg-intent text-fg-on-intent"`). This is the default and always resolves tokens correctly.
2. **In a `<style>` block, reference the CSS variable directly** — custom properties *do* cascade into scoped styles:
   ```css
   .thing { background-color: var(--color-intent); color: var(--color-fg-muted); }
   ```
3. **If you need `@apply` or `theme()` inside the block,** add `@reference "../styles/global.css";` at the top.

**Never** hardcode a hex/rgba or a raw Tailwind neutral (`text-gray-700`) that duplicates a token — it won't follow theme changes. If a status needs a color, add a `--color-*` token.

**Allowed with reason:** a self-contained visual effect (canvas, gradient effect) may define local `--*` literals for values that are not theme roles — but they must be declared as custom properties at the component root, per theme where the effect is visible, and documented in the component header.

### Global base rules
<!--rule: tokens.base | tier: default-->

These live in `global.css` `@layer base`:

- **Cursor:** all interactive controls get `cursor: pointer`; disabled gets `not-allowed`.
- **Body defaults:** `body { @apply bg-canvas text-fg min-h-screen; }`
- **Orphans:** headings `text-wrap: balance`; body `text-wrap: pretty`.
- **Reduced motion:** every `transition`/`animation` respects `@media (prefers-reduced-motion: reduce)` ([a11y]).

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[a11y]: ./accessibility.md#accessibility
[guardrails.docs-check]: ../guardrails.md#documentation-integrity-check-required--shipped
[runbook]: ../runbook.md#new-client-setup-runbook
<!-- /rule-links -->
