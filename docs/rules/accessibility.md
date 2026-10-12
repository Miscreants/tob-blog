<!--docs-module: rules/accessibility-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Accessibility
<!--rule: a11y | tier: reference-->

Accessibility is a build requirement, not a phase.

**Every component ships with the accessibility behavior it needs — semantics, keyboard, focus and reduced motion — from the start.** Prefer native HTML; add ARIA only where native semantics are insufficient. Redundant or incorrect ARIA is worse than none.

### Semantic HTML first
<!--rule: a11y.semantics | tier: required-->
Use `<nav>`, `<button>`, `<dialog>`, `<header>`, `<main>`, `<details>` before `<div role="…">`. Add an explicit `role` only when no element fits.

### Labels & state
<!--rule: a11y.labels | tier: required-->
- Icon-only controls get an accessible name (`aria-label` or visually-hidden text). Decorative icons get `aria-hidden="true"`.
- Toggles set `aria-expanded` + `aria-controls`; checkable items `aria-checked`; tabs `aria-selected`.
- Every landmark of a repeated type gets a distinguishing `aria-label`.
- Meaningful images get real `alt`; decorative get `alt=""`.

### Keyboard support
<!--rule: a11y.keyboard | tier: required-->

Required keys are what the pattern actually requires; optional keys are worth adding but not gated.

| Component | Required | Optional / pattern-dependent |
|---|---|---|
| Button | Enter / Space (native) | — |
| Modal / Dialog | Esc closes; focus trapped while open; focus returns to the trigger | — |
| Tabs | Tab reaches the tablist; Arrow keys move between tabs; roving `tabindex` | Home/End; manual activation (Enter/Space) instead of automatic — pick one and be consistent |
| Accordion | Enter/Space toggles each header (native `<button>`) | Up/Down between headers, Home/End — optional in the ARIA pattern. Esc is **not** part of it |
| Disclosure | Enter/Space toggles | — |
| Menu / Menu button | ArrowDown opens and focuses the first item; Esc closes and returns focus | Type-ahead; Home/End |
| Combobox | Arrow keys move through options; Enter selects; Esc closes | — |

Automatic tab activation (selection follows focus) is appropriate when showing a panel is instantaneous; manual activation is required when it isn't. Choose per project and apply consistently.

### Focus management
<!--rule: a11y.focus | tier: required-->
- Never drop focus to `<body>`. On close/remove, move focus to the next logical element.
- Dialogs store `document.activeElement` on open and restore on close.
- Roving tabindex: only the active item is `tabindex="0"`.
- **Focus must not be obscured** by sticky headers, banners or footers (WCAG 2.2 SC 2.4.11). Use `scroll-margin-top` matched to the sticky header height.

### Reduced motion
<!--rule: a11y.reduced-motion | tier: required-->
Wrap every animation in `@media (prefers-reduced-motion: reduce)`, **and** gate JS/GSAP animations on `matchMedia("(prefers-reduced-motion: reduce)")`, updating on its `change` event.

### Measurable thresholds
<!--rule: a11y.thresholds | tier: required-->

Reviewers check numbers, not adjectives:

| Check | Threshold |
|---|---|
| Text contrast | 4.5:1 (3:1 for ≥24px, or ≥19px bold) |
| Non-text contrast — control boundaries, focus indicators, meaningful graphics | 3:1 |
| Target size | 24×24 CSS px minimum (SC 2.5.8); 44×44 preferred for primary touch targets |
| Reflow | usable at 320px equivalent — 400% zoom at 1280px, no horizontal scroll (SC 1.4.10) |
| Text spacing | no clipping with increased line-height/letter/word spacing (SC 1.4.12) |
| Forced colors | usable in `forced-colors: active`; don't rely on background images for meaning |

Every threshold is checked **in each theme the project ships**.

### Page-level
<!--rule: a11y.page | tier: default-->
- Skip link to `#main` in `Layout.astro`.
- Logical heading order, no skipped levels.
- **One `h1` per page** — an agency convention for clarity and SEO, not a WCAG requirement. Deviate only with a reason.
- Visible focus everywhere.
