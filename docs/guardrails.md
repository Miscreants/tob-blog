<!--docs-module: guardrails-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Automated guardrails
<!--rule: guardrails | tier: reference-->

> [guardrails.gate], [guardrails.docs-check] and [guardrails.skills] ship today; [guardrails.lint]–[guardrails.axe] are **Roadmap** ([roadmap]). The aim: standards enforced by tooling and executable procedure, not memory.

### Type & build gate (Required — shipped)
<!--rule: guardrails.gate | tier: required-->
`npm run check` = typecheck + [guardrails.docs-check] + production build ([structure.gate]). The minimum local gate before every PR. Still to do: wire it into CI.

### Documentation integrity check (Required — shipped)
<!--rule: guardrails.docs-check | tier: required-->

`npm run docs:check` runs `scripts/check-docs.mjs` as part of the gate. It exists because the rulebook is split across modules and cited from checklists, skills and the agent contract — nothing else detects a citation going stale, and renumbering has silently broken references before.

It fails on:

- a `[rule.id]` citation that resolves to no declared rule — including a typo inside a real namespace;
- a duplicate rule id, a duplicate module id, an unknown tier, or a rulebook module missing its `docs-module` declaration;
- any surviving `§N` section reference — the banned syntax that ids replaced;
- a relative `.md` link that doesn't resolve on disk;
- a stale rule-link block (a rule moved or a citation changed without `npm run docs:build`);
- a hex, `px` or `ms` literal in `DESIGN.md` — that file records decisions, and a value there is a second copy of something in `global.css` ([tokens.design-doc]).

Declarations and citations inside fenced code blocks are treated as examples and ignored. `docs/learn/` is exempt: it is explicitly non-authoritative.

**Every rule carries an id** declared beside its heading:

```md
### Client-side scripting
<!--rule: components.scripting | tier: required-->
```

Cite one from anywhere in the repo as `[components.scripting]`. Tiers are `required`, `default`, `reference` and `checklist`. Ids survive moves and reordering, which section numbers did not.

### Linting (Roadmap)
<!--rule: guardrails.lint | tier: reference-->
`eslint` + `eslint-plugin-astro` + `@typescript-eslint`. Rules worth enforcing:
- ban raw hex/rgba **and raw Tailwind neutral classes** (`text-gray-*`, `bg-zinc-*`) in components
- flag bare global selectors in `is:global` blocks (require a `[data-*]` namespace)
- ban inline `style=` and `on*=` attributes
- require `rel="noopener noreferrer"` alongside `target="_blank"`

### Formatting (Roadmap)
<!--rule: guardrails.format | tier: reference-->
`prettier` + `prettier-plugin-astro` with a shared `.prettierrc` committed to the starter.

### CI (Roadmap)
<!--rule: guardrails.ci | tier: reference-->
One PR workflow: `install → npm run check → eslint → (optional) Lighthouse CI on a preview build`. Block merge on failure; assert the [perf.budgets] budgets so performance can't silently regress.

### Accessibility automation (Roadmap)
<!--rule: guardrails.axe | tier: reference-->
`axe-core` (via Playwright or `@axe-core/cli`) against key templates in CI, as a backstop to the manual [checklist.a11y] audit. Automated checks catch a minority of issues; they don't replace keyboard and screen-reader passes.

### Agent skills & commands (Required — shipped)
<!--rule: guardrails.skills | tier: required-->

The repo ships **executable forms of this document** under `.claude/`. They are how a standard gets *run* rather than remembered, and they are part of the client deliverable ([principles], principle 10).

| Path | Kind | What it does |
|---|---|---|
| `.claude/skills/launch/` | Skill | Pre-launch audit — the executable form of [checklist.pre-launch]. Takes a `staging` or `production` mode, then verifies site identity and canonicals, referenced assets, robots and sitemap, **built HTML** (not source), demo-route leakage, placeholder sweep, env keys and bindings, analytics/consent, legal pages, canvas gating, and a browser pass. Reports `BLOCKER` / `SHOULD FIX` / `NEEDS HUMAN` / `NIT` / `CLEAN`, then fixes only with permission and only from a fixed allowlist. |

**Rules for authoring and maintaining them:**

- **The skill is derived from this document, never the reverse.** When a rule here changes, update the matching step in the **same change**. A shipped audit that contradicts the standard is worse than no audit, because it launders a stale rule as a passing check.
- **Cite rules by id, never by section number.** [guardrails.docs-check] verifies every id a skill cites still exists, so a rule that moves can't leave a skill pointing at nothing.
- **Skills state procedure and severity, not rules.** A skill says *what to check, in what order, at what severity*; the rule itself lives here ([principles], no duplication). A skill that restates a rule is a second copy that will drift.
- **No client-specific stances in a starter-level skill.** Radius, palette and type choices belong in the client's `DESIGN.md` ([tokens.per-client]). A skill that hardcodes one project's stance silently breaks the next build.
- **No machine-specific absolute paths.** A skill shipped in a client repo runs on someone else's machine.
- **Never report an unrun check as passed** — mark it `NEEDS HUMAN` with how to verify. The `CLEAN` section is not optional: a report listing only failures gives no coverage signal, and the reader can't distinguish a passed check from a skipped one.
- **Audit before fixing.** Report first, fix only with permission, and keep the auto-fix allowlist narrow — never user-visible copy, legal text, brand artwork or redirect maps.
- **Severity discipline.** `BLOCKER` means a visitor experiences something broken, or there is legal/brand exposure. If everything is a blocker, the label stops meaning anything.

**Roadmap:** an intake skill ([runbook] phases 1–2) and a standalone accessibility-audit skill ([checklist.a11y]) are the obvious next two.

### Local development notes
<!--rule: guardrails.local-dev | tier: default-->
- **Runtime-imported dependencies need pre-bundling.** A dep imported at runtime inside a `<script>` (animation libraries and their plugins, for example) can 504 in `astro dev` on first use. Add it to `optimizeDeps.include` in the Vite config.
- **Verify against a production build whenever dev and the host runtime differ.** Routing, adapters and image services can behave differently in dev; `npm run build && npm run preview` is the source of truth before you call something broken or fixed.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[checklist.a11y]: ./checklists/accessibility.md#accessibility-audit-per-page
[checklist.pre-launch]: ./checklists/pre-launch.md#pre-launch
[guardrails.axe]: ./guardrails.md#accessibility-automation-roadmap
[guardrails.docs-check]: ./guardrails.md#documentation-integrity-check-required--shipped
[guardrails.gate]: ./guardrails.md#type--build-gate-required--shipped
[guardrails.lint]: ./guardrails.md#linting-roadmap
[guardrails.skills]: ./guardrails.md#agent-skills--commands-required--shipped
[perf.budgets]: ./rules/performance.md#budgets--targets
[principles]: ./rules/principles.md#why-this-exists
[roadmap]: ./roadmap.md#roadmap
[runbook]: ./runbook.md#new-client-setup-runbook
[structure.gate]: ./rules/structure.md#required-scripts--the-type--build-gate
[tokens.design-doc]: ./rules/tokens.md#designmd-records-decisions-not-values
[tokens.per-client]: ./rules/tokens.md#per-client-design-decisions-set-at-intake
<!-- /rule-links -->
