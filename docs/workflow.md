# Workflow — what to read before you build

The router. Find your task, read only the modules listed, pick the verification tier, then work.

Reading the whole rulebook for a copy change wastes everyone's time; skipping it for a token change breaks a client site. This file is how you tell those apart.

> **Rules live in [`rules/`](./rules/).** This file routes; it never restates a rule.

---

## Task routing

| I am… | Read | Then |
|---|---|---|
| **Adding a page** | [`rules/components.md`](./rules/components.md) (composition model) · [`rules/seo.md`](./rules/seo.md) (Layout contract) | [`checklists/page.md`](./checklists/page.md) |
| **Building a new component** | [`rules/components.md`](./rules/components.md) · [`rules/component-templates.md`](./rules/component-templates.md) · [`rules/accessibility.md`](./rules/accessibility.md) | [`checklists/component.md`](./checklists/component.md) |
| **Building a page section** | [`rules/components.md`](./rules/components.md) ([components.composition] — sections build on `SectionMain`) · [`rules/tokens.md`](./rules/tokens.md) | [`checklists/page.md`](./checklists/page.md) |
| **Changing colors, type, spacing or motion** | [`rules/tokens.md`](./rules/tokens.md) · the client's [`../DESIGN.md`](../DESIGN.md) | [`checklists/accessibility.md`](./checklists/accessibility.md) — contrast in every theme |
| **Adding interactivity / a `<script>`** | [`rules/components.md`](./rules/components.md) ([components.scripting]) · [`rules/accessibility.md`](./rules/accessibility.md) · [`rules/performance.md`](./rules/performance.md) | [`checklists/component.md`](./checklists/component.md) |
| **Adding a form** | [`rules/components.md`](./rules/components.md) ([components.forms] — including the endpoint security requirements) | [`checklists/pre-launch.md`](./checklists/pre-launch.md) |
| **Adding or changing content** | [`rules/content.md`](./rules/content.md) · [`rules/seo.md`](./rules/seo.md) | [`checklists/seo.md`](./checklists/seo.md) |
| **Adding images, fonts or an embed** | [`rules/performance.md`](./rules/performance.md) | [`checklists/page.md`](./checklists/page.md) |
| **Building an animated canvas / heavy effect** | [`rules/performance.md`](./rules/performance.md) ([perf.canvas]) · [`rules/accessibility.md`](./rules/accessibility.md) (reduced motion) | [`checklists/component.md`](./checklists/component.md) |
| **Setting up a new client repo** | [`runbook.md`](./runbook.md) · [`rules/structure.md`](./rules/structure.md) | the runbook steps for that phase |
| **Wiring hosting, redirects or headers** | [`rules/deployment.md`](./rules/deployment.md) | [`checklists/pre-launch.md`](./checklists/pre-launch.md) |
| **Preparing a launch** | [`checklists/pre-launch.md`](./checklists/pre-launch.md) | run the `launch` skill (see [`guardrails.md`](./guardrails.md)) |
| **Maintaining the documentation itself** | [`README.md`](./README.md) for the map · [`rules/principles.md`](./rules/principles.md) for where each kind of content lives · [`guardrails.md`](./guardrails.md) for what the checker enforces | `npm run docs:build` then `npm run docs:check` |
| **Fixing a failing gate or a dev-only oddity** | [`guardrails.md`](./guardrails.md) | — |
| **Learning Astro itself** | [`learn/astro-for-beginners.md`](./learn/astro-for-beginners.md) — background only, not a rule source | — |

If your task isn't listed, read [`rules/principles.md`](./rules/principles.md) and pick the closest row. Two rows are common; read both.

---

## Before you edit — pick a verification tier

Classify by **blast radius**, not by how many lines you changed. If you're unsure, go one tier up rather than straight to the full gate.

**Prop changes are the one people get wrong.** Adding a prop feels small and local, but a prop on a shared component changes an API every consumer depends on — that is Tier 3, regardless of how few lines it took. Tier 2 is for work that stays inside the page being built.

There is no file-targeted type check: `astro check` takes `--root` and `--tsconfig`, not a path. Whole-project is the only mode, and it takes seconds.

| Tier | The change | Required before calling it done |
|---|---|---|
| **0 — copy & docs** | Text, comments, documentation, labels. No markup structure, tokens, props or behavior. | Editing `docs/`: `npm run docs:build` then `npm run docs:check`. Editing copy in source: `npm run typecheck` **plus `npm run spellcheck`, flags resolved** ([content.copy]). No browser unless text fitting is the risk. |
| **1 — one component's presentation** | Spacing, hover, focus, a variant's styling **on a single component**. Its props, state shape and consumers are unchanged. | `npm run check` + the component's showcase page in a browser. |
| **2 — a page-local section or route** | New or edited `Section*`, new route, content wiring. Nothing outside the page being built. | `npm run check` + [`checklists/page.md`](./checklists/page.md) at all five widths, in every theme the project ships. |
| **3 — shared surface** | **Any change to a shared component's API** — adding, renaming or retyping a prop — plus `Layout`, `SectionMain`, `global.css`, tokens, `astro.config.mjs`, a content schema. Anything with more than one consumer. | Tier 2 **on two consuming templates**, plus [`checklists/accessibility.md`](./checklists/accessibility.md). |
| **4 — launch or infrastructure** | First deploy, domain cutover, host config, dependency or Astro major bump, form endpoint. | Full [`checklists/pre-launch.md`](./checklists/pre-launch.md) + the `launch` skill + the performance budgets. |

Write the tier down before you start:

```md
Tier: 2
Why: new SectionPricing on /pricing; no shared component touched
Run: npm run check, page checklist at 320/375/768/1024/1440, light + dark
Skip: performance budgets — no new images, fonts or scripts
```

A skipped check is fine when the tier says so and you say why. A skipped check reported as passed is not.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[components.composition]: ./rules/components.md#composition-model-pages--sections--components
[components.forms]: ./rules/components.md#forms--form--field-progressively-enhanced-and-hardened
[components.scripting]: ./rules/components.md#client-side-scripting
[content.copy]: ./rules/content.md#copy-quality--spell-check-flags-a-human-decides
[perf.canvas]: ./rules/performance.md#animated-canvases--heavy-client-js
<!-- /rule-links -->
