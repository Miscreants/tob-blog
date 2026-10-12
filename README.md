# Miscreants Astro Starter

A production Astro site: static output, Tailwind v4 with a semantic token system, 50+ documented components, a live component showcase, and a full SEO and accessibility baseline.

This repo is the canonical baseline every client build inherits — and it is built to be worked on by an AI agent as well as a person, so the documentation is part of the deliverable.

## Quickstart

```sh
npm install
npm run dev          # http://localhost:4321
```

Open **`/components`** in dev for the live component showcase, and **`/styleguide`** for the token and type reference. Both are dev-only and never ship to production.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | dev server with HMR |
| `npm run build` | production build to `./dist/` |
| `npm run preview` | serve the production build locally |
| `npm run check` | the gate: type check + production build |
| `npm run docs:build` | refresh the generated rule-link footers in `docs/` |
| `npm run docs:check` | validate rule citations, ids and links |

## Where things are

```
src/
├── components/   one PascalCase file per component, flat
├── content/      Zod-typed collections (+ the component showcase)
├── data/         site identity and static registries
├── demos/        dev-only routes — never shipped
├── images/       source images, imported through astro:assets
├── layouts/      Layout.astro — the head and SEO contract
├── lib/          logic helpers (JSON-LD builders)
├── pages/        production routes only
└── styles/       global.css — every design token
```

## Documentation

| Start here | For |
|---|---|
| **[`docs/workflow.md`](./docs/workflow.md)** | **the router** — find your task, read only what it needs, pick a verification tier |
| [`docs/README.md`](./docs/README.md) | the full documentation map |
| [`AGENTS.md`](./AGENTS.md) | the agent contract: non-negotiables, edit surface, definition of done |
| [`DESIGN.md`](./DESIGN.md) | this client's brand values — colors, type, motion |
| [`docs/plan.md`](./docs/plan.md) | direction notes — what's coming, what to avoid. Not rules |
| [`docs/learn/astro-for-beginners.md`](./docs/learn/astro-for-beginners.md) | Astro onboarding, if you're new to the framework |

Rules are cited by stable id — `[components.scripting]` — so they survive moving between files. Run `npm run docs:build` after changing a rule or a citation; `npm run check` fails on a citation that no longer resolves.

## Building a site from this starter

Follow [`docs/runbook.md`](./docs/runbook.md). It walks the six phases from scaffold to launch, and the pre-launch audit is executable as the `launch` skill.
