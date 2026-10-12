# Documentation

Everything that governs how this site is built. Start with the router.

**→ [`workflow.md`](./workflow.md)** — find your task, read only the modules it needs, pick a verification tier.

---

## The rules

The only place a rule is *stated*. One module per surface.

| Module | Covers |
|---|---|
| [`rules/principles.md`](./rules/principles.md) | the ten principles, how rules are labeled, where each kind of doc lives |
| [`rules/structure.md`](./rules/structure.md) | repo layout, naming, path aliases, versions, scripts and the type gate, env & secrets, git and starter lineage |
| [`rules/tokens.md`](./rules/tokens.md) | the token model and theme contract, typography, layout utilities, the responsive contract, motion, the scoped-`<style>` gotcha |
| [`rules/components.md`](./rules/components.md) | pages → sections → components, `SectionMain`, props, slots, styling, client-side scripting, forms |
| [`rules/component-templates.md`](./rules/component-templates.md) | the three starting points: static, interactive, polymorphic |
| [`rules/seo.md`](./rules/seo.md) | site identity, the `Layout` contract, `Seo.astro`, JSON-LD, sitemap, staging indexing control |
| [`rules/accessibility.md`](./rules/accessibility.md) | native-first semantics, keyboard, focus, the measurable thresholds |
| [`rules/content.md`](./rules/content.md) | collections, the content-source seam, data registries, copy quality & spell-check, `.md` vs `.mdx` |
| [`rules/performance.md`](./rules/performance.md) | images, fonts, CSS, prefetch, third-party, animated canvases, budgets |
| [`rules/deployment.md`](./rules/deployment.md) | hosts, redirects, headers, demo-route gating |

## What reviewers gate on

| Checklist | When |
|---|---|
| [`checklists/component.md`](./checklists/component.md) | any new or changed component |
| [`checklists/page.md`](./checklists/page.md) | a page is finished |
| [`checklists/seo.md`](./checklists/seo.md) | per page or template |
| [`checklists/accessibility.md`](./checklists/accessibility.md) | per page |
| [`checklists/pre-launch.md`](./checklists/pre-launch.md) | before going live — executable as the `launch` skill |

## Process & state

| Doc | What it is |
|---|---|
| [`lifecycle.md`](./lifecycle.md) | the six phases of a client engagement |
| [`runbook.md`](./runbook.md) | step-by-step new-client setup, mapped to those phases |
| [`guardrails.md`](./guardrails.md) | the gates, the shipped skills, local-development notes |
| [`conformance.md`](./conformance.md) | where the starter does **not** yet meet its own Required rules, dated |
| [`roadmap.md`](./roadmap.md) | prioritized follow-up work |
| [`plan.md`](./plan.md) | longer-horizon direction notes — explicitly not rules |
| [`changelog.md`](./changelog.md) | what changed between versions of the standard |

## Reference

| Doc | What it is |
|---|---|
| [`how-to/contact-form-email.md`](./how-to/contact-form-email.md) | wiring a contact form to an email binding |
| [`learn/astro-for-beginners.md`](./learn/astro-for-beginners.md) | Astro onboarding — background material, **not** a rule source |

Per-component documentation lives with the live showcase in `src/content/components/*.mdx`, browsable at `/components` in dev.

---

## How this fits together

```
AGENTS.md ─────────► the contract: non-negotiables + where to go next
    │                (CLAUDE.md is a pointer to it, nothing more)
    ▼
docs/workflow.md ──► the router: task → modules → verification tier
    │
    ├──────────────► docs/rules/*.md ──────► the rules, stated once
    │                                        each carries a stable id
    │
    └──────────────► docs/checklists/*.md ─► the gates, citing those ids
```

**Rules are cited by id, never by section number or page.** Each rule declares one beside its heading:

```md
### Client-side scripting
<!--rule: components.scripting | tier: required-->
```

Write `[components.scripting]` anywhere in the repo to cite it. Ids survive rules moving between files, which section numbers did not. `npm run docs:build` keeps the generated `rule-links` footer in each file current so every citation renders as a working link; `npm run check` fails on a citation to an id that doesn't exist.

```sh
npm run docs:build      # refresh the rule-link footers
npm run docs:check      # citations, links, ids, footers
```
