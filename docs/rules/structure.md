<!--docs-module: rules/structure-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Project structure & conventions
<!--rule: structure | tier: reference-->

### Directory layout
<!--rule: structure.layout | tier: required-->

The canonical `src/` tree:

```
src/
├── components/          # PascalCase .astro, one component per file (flat)
│   └── _docs/           # showcase-only helpers (Preview, PropsTable)
├── content/             # Markdown/MDX content collections
├── content.config.ts    # Zod schemas for every collection
├── data/                # static data & site identity (site.ts, *.json)
├── demos/               # dev-only routes: /styleguide, /components, previews
├── images/              # source images imported through astro:assets
├── layouts/             # Layout.astro and any page-type layouts
├── lib/                 # logic helpers — JSON-LD builders (schema.ts)
├── pages/               # kebab-case routes (production routes ONLY)
├── styles/              # global.css
└── env.d.ts             # ambient types
```

Root files that are part of the deliverable:

```
astro.config.mjs      # site, output, integrations, demo-route gating
wrangler.jsonc        # Cloudflare host config (or netlify.toml)
functions/            # host functions, when a project needs them
public/               # _headers, _redirects, robots.txt, favicons, OG images
DESIGN.md             # the client's token/brand contract
docs/                 # the rulebook — start at docs/workflow.md
AGENTS.md / CLAUDE.md # agent entry points — pointers, not rule copies ([principles])
```

**Rules:**
- **Flat `components/` directory** with semantic filename prefixes (`Card*`, `Nav*`, `Section*`). Only group into a subfolder when a component is a true family.
- **One component = one PascalCase file.** No `index.astro` component folders.
- **`src/demos/` is not `src/pages/`.** Anything in `pages/` ships. Demo, showcase and preview routes live in `demos/` and are injected only in dev ([deploy.static]).
- **`lib/` for logic helpers**, **`data/` for static registries and site identity**. Neither goes inside `components/`.

### Naming conventions
<!--rule: structure.naming | tier: required-->

| Thing | Convention | Example |
|---|---|---|
| Component file | `PascalCase.astro` | `CardFeatured.astro` |
| Page section | `Section*` prefix | `SectionFeatures.astro` |
| Page file & route | `kebab-case` | `contact.astro` → `/contact` |
| Dynamic route | bracket placeholder | `[...slug].astro` |
| Data / lib file | `kebab-case` / `camelCase.ts` | `site.ts`, `schema.ts` |
| Content slug | `kebab-case`, matches frontmatter | `series-a.md` |
| CSS data hook | `data-<component>` kebab | `data-field="component"` |
| Semantic color | `--color-<role>` | `--color-fg-muted` |
| Typography utility | `@utility h1`, `text-body-lg` | — |

**Naming exception — `Hero`.** A page's opening section may be named `Hero` (or `Hero*`) rather than `SectionHero`; it is still a section in every other respect ([components.composition]) and still builds on `SectionMain` unless it is genuinely full-bleed. This is the only sanctioned exception to the `Section*` prefix.

### Path aliases (tsconfig)
<!--rule: structure.aliases | tier: required-->

The starter defines these — **every client repo keeps them identical** so imports are portable:

```jsonc
"paths": {
  "@components/*": ["src/components/*"],
  "@layouts/*":    ["src/layouts/*"],
  "@content/*":    ["src/content/*"],
  "@styles/*":     ["src/styles/*"],
  "@images/*":     ["src/images/*"],
  "@data/*":       ["src/data/*"],
  "@/*":           ["src/*"]
}
```

Prefer aliases over deep relative paths. Sibling imports may stay relative.

### Versions & engines
<!--rule: structure.versions | tier: default-->

**The starter's `package.json` is the version baseline** — read it there rather than trusting a number written in prose. The policy:

- Node is pinned in `engines` (currently `>=22.12.0`); keep it identical across client repos.
- The stack is Astro + Tailwind v4 (via `@tailwindcss/vite`) + TypeScript, with `astro-icon`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/partytown`.
- **Bump the starter first**, validate with `npm run check` and a production build, then roll clients forward. Never bump a major in a client repo first.
- Record the starter version a client repo was cut from ([structure.git]) so upgrades are traceable.

### Required scripts — the type & build gate
<!--rule: structure.gate | tier: required-->

**Required.**

```jsonc
"scripts": {
  "dev":        "astro dev",
  "build":      "astro build",
  "preview":    "astro preview",
  "typecheck":  "astro check --minimumFailingSeverity warning",
  "spellcheck": "cspell \"**/*.{astro,ts,mjs,md,mdx,css,json,jsonc}\" --no-progress --no-must-find-files --no-exit-code --unique",
  "docs:build": "node scripts/build-doc-links.mjs",
  "docs:check": "node scripts/check-docs.mjs",
  "check":      "npm run typecheck && npm run docs:check && npm run build"
}
```

**Why `astro check` and not `tsc --noEmit`:** `tsc` does not read `.astro` files at all, so a `tsc`-based gate type-checks almost none of an Astro codebase — missing required props, bad prop types and broken component usage all pass. `astro check` (from `@astrojs/check`, already a devDep) checks `.astro` **and** `.ts`, and runs the `astro sync` step itself, so no separate `astro sync` is needed.

`--minimumFailingSeverity warning` means compiler warnings — including accessibility warnings — fail the gate. That is deliberate and consistent with [a11y]. Hints do not fail.

**`docs:check`** is the documentation half of the gate ([guardrails.docs-check]): it fails the build on a citation to a rule id that doesn't exist, on a stale rule-link block, on a broken relative link, and on any surviving `§` section reference.

**`spellcheck` is required to exist and required to be run ([content.copy]) — and deliberately outside `check`.** It carries `--no-exit-code`, so it prints a report and always exits 0. Client copy is dense with niche vocabulary, and a spelling gate that blocks a deploy over a correctly-spelled term is a gate people learn to bypass. Every other entry in `check` is machine-decidable; this one needs a human to read the list, so it runs beside the gate rather than inside it.

`npm run check` is the local gate before every PR. See [conformance] for the starter's current conformance state.

### Environment variables & secrets
<!--rule: structure.env | tier: required-->

- **`PUBLIC_` prefix = public.** Only `PUBLIC_*` vars reach client code / the bundle (Astro rule). Everything else is build/server-only. **Never put a secret in a `PUBLIC_` var.**
- Read via `import.meta.env.PUBLIC_*` (client) or `import.meta.env.*` (build-only).
- **Commit `.env.example`** (keys, no values); **never commit `.env`**.
- Build-time vars are set in the host dashboard. Runtime secrets (e.g. a form Worker) live in the host's secret store / bindings ([components.forms]) — never in the repo.
- **A missing *required* key must fail the build, not render `undefined`.** Assert it at config load:

  ```js
  const requireEnv = (key) => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var ${key} — set it in the host's build environment.`);
    return value;
  };
  ```

  **The starter has no required build-time keys**, which is why `astro.config.mjs` carries no assertions. `PUBLIC_GTAG_ID` is optional by design — the layout injects the tag only when it is set — and the contact endpoint's keys are read at *runtime* by the Pages Function, not at build. Add the helper when a project introduces its first genuinely required key; don't ship it unused.

- **Runtime keys are a different problem.** A host function reads its environment at request time, so a missing key can't fail a build — it fails a submission, quietly. List every runtime key in `.env.example` even though the file doesn't supply them, so the set is discoverable, and treat "is it actually set on the host?" as a launch check rather than something the repo can prove.

> **Roadmap — `astro:env`.** Astro's typed env schema validates keys at build time and gives typed access with no manual assertions. Adopting it is the intended direction; until it ships in the starter, the `import.meta.env` rules above are the standard.

### Git, branching, deploy & starter lineage
<!--rule: structure.git | tier: required-->

- **Push source, never `dist`.** The host builds from source; `dist/` stays gitignored.
- **One branch deploys.** The production branch (usually `main`) is wired to the host's Git build — pushing it ships. **Know which *remote* is production before you push** (a repo often has an agency mirror *and* the client's production repo).
- Commit under the **correct author identity**; present-tense, conventional messages.
- Non-trivial work goes on a branch → PR → merge to the deploy branch.
- **Starter lineage (Required).** New builds are created from the starter's **GitHub template repository**, so a client repo gets a fresh history with no shared ancestor and no upstream link. That is deliberate — clients get a clean repo, not the starter's development history.

  The cost is that nothing records *which* version of the starter a build began from. GitHub's "generated from" marker names the template but not its state at the time. So the starter carries **`starterVersion` in its own `package.json`**, matching the current [changelog] release, and a template copy **inherits that value automatically** — it is simply never bumped again in the copy. No scaffold step to forget, and no remote to configure.

  Its one job is to answer *"what has changed in the starter since this build was cut?"* when you want to port a fix forward. Add the starter as a remote **ad hoc at that moment**, diff from the recorded version, cherry-pick what applies, then drop the remote again. Cherry-pick works fine across unrelated histories; merge and rebase do not, and aren't the workflow.

  **Bump `starterVersion` in the same change as a [changelog] entry.** A stamp that lags the changelog is worse than none, because it points a future port at the wrong baseline.

### Repo as an agent platform
<!--rule: structure.agent-brief | tier: default-->

The client builds pages with an AI agent, so the repo must brief that agent — the docs are part of the deliverable ([principles], principle 10). Every client repo ships `AGENTS.md` (canonical) with `CLAUDE.md` pointing at it. That brief:

- names `DESIGN.md` (tokens/brand) and `docs/` as **authoritative**, and defers to them rather than restating rules ([principles]);
- lists the non-negotiables in one line each: semantic tokens only, accessibility required, pages compose sections, build sections on `SectionMain`, `astro:assets` for images, gate animated canvases;
- gives a **"how to add a page" recipe**: create `src/pages/<route>.astro` → wrap in `Layout` with `title`/`description`/`jsonLd` → compose existing sections → add new `Section*` components for new chunks → `npm run check`;
- says **where to look**: primitives in `components/`, the live showcase at `/components` (dev), per-component docs in `src/content/components/`, content in `content/`.

- points at the executable procedures in `.claude/` ([guardrails.skills]) — the guided component build and the pre-launch audit.

Keep it short and imperative — it's the agent's front door, not a manual.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[a11y]: ./accessibility.md#accessibility
[changelog]: ../changelog.md#changelog
[components.composition]: ./components.md#composition-model-pages--sections--components
[components.forms]: ./components.md#forms--form--field-progressively-enhanced-and-hardened
[conformance]: ../conformance.md#starter-conformance-gaps
[content.copy]: ./content.md#copy-quality--spell-check-flags-a-human-decides
[deploy.static]: ./deployment.md#deployment--static
[guardrails.docs-check]: ../guardrails.md#documentation-integrity-check-required--shipped
[guardrails.skills]: ../guardrails.md#agent-skills--commands-required--shipped
[principles]: ./principles.md#why-this-exists
[structure.git]: ./structure.md#git-branching-deploy--starter-lineage
<!-- /rule-links -->
