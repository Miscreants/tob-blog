---
name: <Client name>
version: draft
summary: <One sentence: what this brand feels like. Replace before build.>
---

# Design

The brand contract for **this project**. It ships **unanswered** in the starter — the starter is a template, and a template that arrives pre-loaded with someone else's brand decisions is worse than an empty one, because the next build inherits them silently.

Fill it in at design intake ([runbook] phase 2). Delete every prompt as you answer it.

## What belongs here

**Decisions and constraints. Not values, and not house rules.**

Values live in code — a value written in two places drifts in one of them, and it's always the copy nothing renders from. **If a hex code, pixel value or duration appears in this file, it's a bug**, and the gate will reject it.

| Looking for | Read |
|---|---|
| Color values, per theme | `src/styles/global.css` — `@theme` and the `[data-theme]` blocks |
| The type ramp, rendered | `/styleguide` in dev |
| A component's shape, props and states | `/components` in dev, and `src/content/components/*.mdx` |
| Spacing, rhythm, layout and motion tokens | `src/styles/global.css` |
| How we build, on every project | [`docs/`](./docs/README.md) — start at [`docs/workflow.md`](./docs/workflow.md) |

**House rules are not repeated here.** Semantic tokens only, no fixed font sizes, focus rings, reduced-motion paths, explicit theming, section-owned vertical rhythm — those apply to every build we do and live in `docs/rules/`. Writing them here again just creates a second copy to maintain.

This file is only for **what makes this project different**.

The test when adding something: *does this change as a side effect of routine work, or only when someone deliberately revisits the brand?* A padding value changes incidentally — it doesn't belong. A typeface choice changes deliberately — it does.

## Brand character

> **Prompt — replace this section.** Two or three sentences on how the brand should feel and how that shows up in the interface. Adjectives alone are useless to a builder; tie each one to something visible. "Precise and engineering-forward, so surfaces are flat and separated by tone rather than shadow" is usable. "Modern and clean" is not.

## Decisions

> **Prompt — record each decision *and why*.** The reasoning is the part that survives; it's what lets someone extend the system to a case you never specified. A decision with no rationale gets overturned by the first person who disagrees with it.

| Decision | Answer for this project |
|---|---|
| **Themes** — which ship, and which is default | |
| **Palette** — brand hues, if any, and which one `--color-intent` maps to | |
| **Radius** — a stance, and why. This is a brand call with no house default | |
| **Depth** — tonal offset, hairlines, shadows: which, and in what order of preference | |
| **Typefaces** — for the heading / body / mono roles | |
| **Motion** — how much, and where it's allowed to be expressive | |
| **Density** — generous and editorial, or compact and dense | |
| **Imagery** — photography, illustration, none; and how it's treated | |

## Project rules

> **Prompt — the constraints a builder must respect on this project.** This is where you add your own.

Write them **normatively, not descriptively**. This matters more than it sounds:

- ✅ *"Never use a corner radius larger than the `sm` step."* Stays true no matter what the code does, and when a component violates it, the rule correctly identifies a bug.
- ❌ *"Cards use the `sm` radius."* Becomes false the moment someone changes a card — and worse, an agent reads a description as an instruction and propagates the stale version confidently.

A stale description doesn't just go unread; it actively generates the wrong thing. Prefer "always" and "never" over "is" and "has".

Examples of the **form** (not rules for your project — delete these):

- *Never introduce a hue outside the status roles; everything else is neutral.*
- *One filled primary action per screen — a second reads as a duplicate, not a hierarchy.*
- *Reach for a shadow only after tonal offset and a hairline have both failed.*

## Deliberately not doing

> **Prompt — what this project rules out, and why.** The most valuable section and the one most often skipped. "No carousels — the content doesn't reward horizontal scanning and they hurt on mobile" prevents an entire class of suggestion, permanently.

## Open questions

> **Prompt — what isn't settled yet.** Naming an open question stops it being answered by accident, three components deep, by whoever got there first.
