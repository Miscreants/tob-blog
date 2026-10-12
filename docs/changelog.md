<!--docs-module: changelog-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->
<!-- cspell:ignore ropdown recieve behaviour initialised initialises normalised normalises Penalising recognises colour Colour colours tokenised tokenisation unoptimised labl primry semantik — misspellings quoted deliberately in the v2.13 entry -->

## Changelog
<!--rule: changelog | tier: reference-->

### v2.15 — 2026-08-09 — fonts: a strong default, not a gate

**[perf.fonts] drops from `required` to `default`.** Self-hosted WOFF2 is still what every build should ship, and the reasoning is unchanged — a third-party font host costs a DNS lookup and a TLS handshake on the critical path of a page whose LCP is usually text. What changed is the consequence of not managing it. As written, the rule made a licensing fact into a build blocker: Adobe Fonts and parts of the Monotype catalogue **forbid** self-hosting, so a project on those faces could not comply no matter how it was built, and a client who can only produce a CDN embed the week before launch left the build formally in breach. A rule that can't be satisfied gets ignored wholesale rather than deviated from deliberately. It is now a deviation to record in the project's notes.

**One line inside it stays hard, and is stated as such:** every family named in `--font-heading/-sans/-mono` needs an `@font-face` behind it or a real system-stack keyword. That was previously the last bullet in the list, which undersold it — it isn't a performance preference, it's a rendering bug that is invisible to whoever built the page. The font is installed locally on the designer's machine, so the stack resolves; on every machine that doesn't have it, the page silently falls through to a system font. Softening the tier around it made it worth pulling up out of the bullets.

**The rule now says how to produce a WOFF2**, because "self-host WOFF2" was quietly assuming a file we're rarely given — what arrives from a client is OTF or TTF. `pyftsubset` from `fonttools` converts and subsets in one pass, and the subsetting is the part that matters: on a 1.0MB TTF, straight conversion measured 424KB and a Latin subset of the same face measured 48KB. Two warnings ride along — a desktop license often doesn't cover webfont embedding, which no tool fixes, and `pyftsubset` will instance a variable font down to one weight if you let it.

### v2.14 — 2026-08-08 — tighter section rhythm, one naming scheme

**Every tier of the vertical rhythm scale moves down one rung.** The shape of the scale is unchanged — five tiers, still stepping up at `md:` — but each one lost a step:

| Tier | Before (mobile → `md:`) | After |
|------|------------------------|-------|
| `xs` | 48 → 64px | 32 → 40px |
| `sm` | 64 → 80px | 48 → 64px |
| `md` | 96 → 128px | 64 → 96px |
| `lg` | 128 → 192px | 96 → 128px |
| `xl` | 192 → 256px | 128 → 192px |

`SectionMain` defaults to `padding="md"`, so two stacked default sections now sit 192px apart on desktop rather than 256px, and 128px on mobile rather than 192px. The old values read as a page that had been pulled apart rather than composed.

**The `section-padding-*` block had been inert at `md:` the whole time.** It was written `py-12 md:py-12` — a no-op breakpoint that scaled nothing — while the `section-pt-*` / `section-pb-*` blocks it was supposed to mirror did step up. The same tier name meant two different things depending on which axis you reached for: `section-padding-lg` was a flat 128px, `section-pt-lg` was 128 → 192px. All three blocks now share one scale, with a comment above them saying to keep them in sync.

**The middle tier has a name now.** `section-padding` followed Tailwind's bare-base idiom (`border`, `rounded`, `shadow`), which reads fine in isolation but stopped being consistent the moment `section-pt-md` / `section-pb-md` existed — the same conceptual tier spelled two ways, a scale that scans as `xs, sm, ⟨blank⟩, lg, xl`, and a `grep` for `section-padding-` that misses the default tier. The canonical name is **`section-padding-md`**; bare `section-padding` stays as a one-line alias so anything already reaching for it keeps working.

**The default was never `lg` — the examples were.** `SectionMain` has always defaulted to `padding="md"`, but both canonical snippets in the rulebook wrote `<SectionMain id="features" padding="lg">`, and an example is what gets copied. Both now omit the prop, and [components.composition] states the rule directly: leave `padding` off unless you mean to break rhythm — `lg`/`xl` to isolate a hero or a page-closing CTA, `xs`/`sm` for a dense strip, `none` when the child owns its own spacing. A page where most sections carry an explicit `padding` has drifted from the scale rather than used it.

The stale numbers that documented the old scale were corrected alongside: the padding map in `section-main.mdx`, the swatch table in the styleguide, the `section-padding` snippet under [tokens.layout], and the lookup map in the beginners guide.

A build whose design genuinely wants more air changes the default in `SectionMain` in its own repo, the same way [components.composition] already handles the side rules — the rule is that sections go through `SectionMain`, not that its spacing is identical on every project.

### v2.13 — 2026-08-05 — spell-check, deliberately advisory

**Copy quality is now a stated rule** ([content.copy]) with a tool behind it. `npm run spellcheck` runs `cspell` over **the whole repo — every page, not just `src/`**: collection entries, `data/*` labels, section copy, `alt` text, meta descriptions, form and error strings, `aria-label`s, and equally the rulebook under `docs/`, `DESIGN.md`, `AGENTS.md` and comments in config and scripts. A typo in the rulebook misleads the next agent that reads it, so it is worth the same attention as one on a page.

**It is not part of `npm run check`, and that is the design decision, not an oversight.** The script carries `--no-exit-code`: it prints a report and always exits 0. Client copy is dense with niche vocabulary — product names, industry jargon, coined terms — and a spelling gate that blocks a deploy over a correctly-spelled word nobody's dictionary knows is a gate people learn to route around. Every other entry in `check` is machine-decidable; this one needs a human to read the list. `[structure.gate]` says so explicitly so the omission doesn't read as a bug and get "fixed" later.

The first run proved the point in both directions:

- **It found real drift.** Nineteen en-GB spellings across the repo — `behaviour`, `initialised`, `initialises`, `normalised`, `normalises`, `Penalising`, `recognises`, `colour`/`Colour`/`colours`, `tokenised`, `tokenisation`, `unoptimised` — in component comments, seven `.mdx` docs, four rulebook modules, `DESIGN.md`, `astro.config.mjs` and both doc scripts, including one in a message string the checker prints. **`en-US` is the priority spelling**, set once via `"language": "en-US"` in `cspell.json`, and an en-GB flag is always fixed in the copy, never silenced by adding it to `words`.
- **It also flagged correct copy.** `ropdown` in `search.mdx` is `**D**ropdown` — markdown bold splitting a word mid-token. On a hard gate that is a blocked deploy over correct text. Resolved with a scoped `cspell:ignore` on that one file, the pattern the rule prescribes over any blanket disable.

Widening past `src/` surfaced a category worth naming: docs that **quote** misspellings on purpose — the teaching typos `labl` and `primry` in the beginners guide, the `[tokens.semantik]` example in `check-docs.mjs`, and this entry's own list above. Each carries a scoped `cspell:ignore` naming why, rather than the words being added globally — a repo-wide `words` entry for `recieve` would silence the real thing everywhere.

`cspell.json` ships with 82 starter terms (`astro`, `gsap`, `workerd`, `wordmark`, `nosniff`, `footgun`…) and the ignore patterns that keep imports, URLs, hex colors and `class`/`href` attributes out of the report. Adding a word is still a reviewed decision: a change that adds `recieve` to `words` is a change that ships `recieve`. The repo is clean at 155 files, 0 issues.

Cited from [checklist.page] (with a companion line for the human read-through the tool can't do — `form`/`from`, duplicated words), [checklist.pre-launch] for sitewide strings, and Tier 0 in the router, since a copy edit is exactly when it should run.

Four **attribution comments** were also removed — `ComboboxGrouped`, `Footer`, `AnimatedTags` and `footer.mdx` credited the sources they were modeled on. The technical substance of each comment stays; only the credit line went.

### v2.12 — 2026-08-02 — a review pass on the docs themselves

Seven findings from an independent read of the documentation, all verified and all fixed. Every one was **documentation drifting from a decision** — which is precisely the class [guardrails.docs-check] cannot detect. It proves that ids resolve and links exist; it cannot know a sentence stopped being true.

- **The contact-form guide taught a retired architecture.** It walked an agent through installing the Cloudflare adapter and `mimetext`, creating `src/actions/index.ts` and using Astro Actions — all of which the current standard rules out — while claiming to be "end-to-end verified" and sitting linked from the docs index. Rewritten around the actual implementation: platform setup only (Email Routing, verified destinations, the WAF rate-limit rule), pointing at `functions/api/contact.ts` for the code rather than describing it twice.
- **The Tier 0 gate named a command that doesn't exist.** "Targeted `astro check`" — the CLI takes `--root` and `--tsconfig`, not a path. Tier 0 now splits by what changed: `docs:build` + `docs:check` for documentation, `typecheck` for copy in source, with a note that whole-project is the only mode and it takes seconds. A "maintaining the documentation" routing row was missing and is added.
- **The lifecycle still told people to record an upstream remote**, three releases after [structure.git] removed that requirement and explained why template-derived repos have none.
- **Tiers 2 and 3 overlapped on component API changes.** "Props on an existing component" sat in Tier 2 while "anything with more than one consumer" sat in Tier 3, leaving a prop on a shared component unclassifiable. Tier 2 is now page-local work only; any shared component API change is Tier 3, called out explicitly because adding a prop feels small and isn't.
- **The process layer promised gates and checklists that don't exist.** The router pointed at "the runbook's own phase gates" (it has steps), and the lifecycle claimed every phase has a checklist (the setup phases don't). Both corrected, and [checklists] is now a real index that states why setup phases deliberately have none.
- **The documented checks didn't match the checker.** It claimed duplicate module `order` was validated — `order` was removed in v2.3 — and that every module declares an id, while the implementation only checked uniqueness *when a declaration happened to exist*, so a module with no id passed silently. The check now requires a `docs-module` id on everything under `rules/` and `checklists/`, verified with a negative test.
- **Skill locations contradicted each other** — [principles] called `.agents/skills/*` canonical while everything else said `.claude/`. `.claude/` is where they are; the `.agents/` move was proposed and then declined, and the table entry was left behind.

### v2.11 — 2026-08-02 — the conformance table is empty

**Reference form endpoint hardened** ([components.forms]). `functions/api/contact.ts` already existed with a honeypot and presence checks; everything else the rule requires was missing. It now has an origin check as the CSRF strategy for a same-origin form, a body-size cap applied before reading, per-field length limits, and CR/LF stripped from every value that reaches a mail header — a newline in a name otherwise forges an extra `Bcc` or `Reply-To`.

Two deliberate non-implementations, both written into the file:

- **Rate limiting stays platform-level.** Edge isolates are per-colo and ephemeral, so an in-memory counter resets constantly and counts nothing — worse than none, because it looks like protection. It belongs in a WAF rule, and the audit marks it `NEEDS HUMAN`.
- **Alerting needs a destination the repo doesn't have.** Every failure path logs a stable `[contact:error]` prefix to point a drain at instead.

Logging also stopped writing submission contents. Names, addresses and message bodies are personal data; they belong in the notification, not in a log store with an unbounded retention window.

The commented email path was rewritten too: it recommended `mimetext`, whose default build fails esbuild on node built-ins and whose browser build throws inside workerd. Replaced with a hand-rolled RFC 5322 string, which is what the message actually needs.

**Component templates split three ways** ([templates]) — `Static` (the default), `Interactive` and `Polymorphic`, replacing `Basic`/`Advanced`. The interactive one now demonstrates the `WeakSet` init guard and full `AbortController` teardown the rules require, rather than describing them somewhere else.

**The env rule was corrected rather than implemented.** It demanded build-time assertions for required keys; the starter has none — `PUBLIC_GTAG_ID` is optional by design, and the endpoint's keys are read at *runtime* by the function, where a missing key can't fail a build. The rule now carries the assertion helper for a project's first genuinely required key, explains why the starter ships none, and treats runtime keys as a launch check instead.

`wrangler.jsonc` lost a personal email address and a note claiming the form path was disabled — it isn't, and hasn't been since the Pages Function landed.

**Conformance is now empty.** Every rule marked Required is true of the starter. Three of the gaps closed in this release turned out to be the rule over-specifying rather than the code falling short.

### v2.10 — 2026-08-02 — prefetch on, two components out

**Navigation prefetch enabled** ([perf.prefetch]) — `prefetchAll` with the hover strategy, so every internal link warms when a visitor signals intent and the navigation lands instantly. On a static site the pages are already built, so the cost is one cheap fetch for a link someone is about to click. It works without the client router; prefetch and view transitions are independent. Verified present in the built page entry script rather than assumed from config.

`viewport` was deliberately not used: it prefetches everything on screen, which on a long marketing page spends real bandwidth on links nobody follows.

**`HeroCanvas` and `ShinyButton` removed.** They were the last two components carrying literal hex custom properties that don't follow the theme — resolved by deletion rather than tokenization. Neither had a showcase entry, so neither was reachable from `/components` or visible to a client's agent; nothing in `src/` referenced either. `HeroCanvas` was also the only consumer of `src/lib/simplex-noise.js`, which went with it — four files in total.

That leaves the animated-canvas rules in [perf.canvas] with no in-repo example. They stay: the guidance is about what to do when a project needs an effect like that, and it was written from the failure mode, not from the component.

### v2.9 — 2026-08-02 — two rules corrected against how work actually happens

**`SectionMain`'s side rules stay unconditional.** Logged as a gap needing a `sideRules` opt-out prop; it isn't a gap, it's the design. The shared frame is the reason the primitive exists, and a per-section prop to switch off part of it reintroduces exactly the drift `SectionMain` prevents. A project whose design has no section borders edits `SectionMain` in its own repo — client repos own their component set. The rule is that every section goes *through* `SectionMain`, not that it looks identical on every project.

**Starter lineage rewritten around the template repo.** The rule required keeping the starter as an `upstream` remote and called resetting history "not acceptable" — but new builds are created from the **GitHub template repository**, which gives a fresh history with no upstream link by design. The rule was describing a workflow nobody uses.

What survives is the part that carries weight: knowing which starter version a build began from. `starterVersion` now lives in the **starter's own `package.json`**, so a template copy **inherits it automatically** and simply never bumps it again — no scaffold step to forget, no remote to configure. Add the starter as a remote ad hoc when you actually want to port a fix, diff from the recorded version, cherry-pick, drop the remote. Cherry-pick works across unrelated histories; merge and rebase don't, and aren't the workflow.

`starterVersion` tracks the changelog release and must be bumped in the same change as a new entry — a stamp that lags points a future port at the wrong baseline.

### v2.8 — 2026-08-02 — the starter ships DESIGN.md unanswered

v2.7 removed the values from `DESIGN.md` but kept this build's *answers* — monochrome with `intent` equal to `fg`, tonal depth, sharp rectangles, one intent action per screen. Wrong for a template. **A starter pre-loaded with someone else's brand decisions is worse than an empty one**: the next build inherits them silently, nobody rewrites a file that already looks finished, and the agent then generates confidently to the wrong brand.

`DESIGN.md` now ships as **prompts**, not content — brand character, a decisions table, project rules, "deliberately not doing", open questions. Scaffold phase 2 answers them and deletes each prompt.

**It also stopped restating house rules.** Semantic tokens only, no fixed font sizes, focus rings, reduced-motion paths, explicit theming, section-owned rhythm — every one of those already lives in `docs/rules/` and applies to every build. Repeating them in the brand doc was the same duplication problem one layer up. `DESIGN.md` now covers only what makes a given project *different*.

The one piece of authoring guidance it keeps is the lesson from v2.7, aimed at whoever fills it in: **write project rules normatively, not descriptively.** *"Never a radius above 4px"* survives any change to the code and correctly flags a violation; *"cards have a 4px radius"* is false the moment someone edits a card, and an agent reads a description as an instruction.

The `launch` audit now flags an unanswered `DESIGN.md` in production as SHOULD FIX — nothing user-visible breaks, but it means every build decision on that project was made without a brand contract.

### v2.7 — 2026-08-02 — DESIGN.md records decisions, not values

`DESIGN.md` was 233 lines, of which **155 were frontmatter duplicating `global.css`** — the full palette, the type ramp, the radius and spacing scales, and per-component specs. Nothing read that frontmatter. It existed only to go stale, and it had:

- **status colors already wrong** — `#dc2626` / `#16a34a` documented against `#841B20` / `#4C6649` actually rendering, so an agent would build bright red/green state styling for a maroon-and-olive site;
- **an internal contradiction** — "This build does not use rounded corners… Pills are off the table" three paragraphs above "**Nav (pill)** — a pill-rounded panel", with `nav-pill.rounded: {rounded.pill}` in the frontmatter backing the wrong one;
- **motion documented as "150–300 ms linear or ease-out"** against tokens of 0.2–1.6s on a custom bezier;
- a framework version two majors behind.

The rewrite ([tokens.design-doc]) keeps decisions, rationale and hard constraints, and drops every value in favour of pointers to `global.css`, `/styleguide` and `/components`. The file is ~45% shorter and considerably more specific about the things that can't rot — the editorial reasoning for sharp corners, why `intent` equals `fg`, the shadow-last depth order, what is deliberately not done.

**The reframe that drove it:** the problem was never specific-versus-general, it was derivable-versus-not. A stale *description* is worse than no description, because a description reads to an agent as an instruction — "the nav is a pill" becomes *make pills*. Normative statements ("never use rounded corners") can't fail that way: when code contradicts one, it identifies a bug instead of licensing it. So the fix was to be **more** specific about intent, not vaguer.

Enforced rather than remembered: [guardrails.docs-check] now fails the gate on any hex, `px` or `ms` literal in `DESIGN.md`. Discipline is what failed the first time.

### v2.6 — 2026-08-02 — the starter itself ships blocked

The AI crawler policy landed as allow-all in the starter's own `robots.txt`, which was the wrong file to put it in. The starter is a template: its preview deployment has no reason to be crawled, indexed, or used as training data.

`public/robots.txt` now ships `User-agent: * / Disallow: /`, with the full allow policy sitting directly beneath it as a commented block. Scaffold step 5 swaps them and sets the `Sitemap:` host. Keeping both in one file makes the flip a single edit with nothing to retype, and no drift between the rule and the file it describes.

The safety net was already in place: the launch audit blocks on a production `Disallow: /`, so a client site that never got flipped is caught rather than shipped. It now names that case directly, since "the scaffold step was skipped" is the most likely way it occurs.

**The starter deliberately does not ship `X-Robots-Tag: noindex` in `public/_headers`**, even though it would be a stronger signal. That file inherits into every client repo, and a blanket `noindex` reaching production deindexes the live site — the exact BLOCKER [seo.staging] defines. Keeping the landmine out of the template beats relying on an audit to defuse it in every project. The starter's preview leans on `Disallow: /` plus an unlinked URL; if it is ever shared widely, the fix is host-level access control or an `X-Robots-Tag` rule in the dashboard, where nothing can inherit it.

### v2.5 — 2026-08-02 — AI crawler policy stated, not inferred

`public/robots.txt` was `User-agent: * / Allow: /` — which does permit every AI crawler, but silently. An undeclared default is indistinguishable from nobody having considered the question, and it changes meaning the first time someone tightens the wildcard group.

**House policy is now explicit ([seo.ai-crawlers]): AI crawlers are allowed**, answer engines and training crawlers alike, each as a named group. Clients want to be cited in LLM answers, so allow-all is the deliberate default rather than an accident.

The named groups also document the trap that makes this worth writing down: **a crawler with its own group ignores `User-agent: *` entirely**, so a `Disallow` added to the wildcard blocks general crawlers while leaving the AI bots it was aimed at untouched. The `launch` skill treats that specific mistake as a BLOCKER.

`Google-Extended` and `Applebot-Extended` are documented as what they are — control tokens for Gemini/AI Overviews and Apple Intelligence grounding, not crawlers.

**`llms.txt` was considered and declined.** Direct `/llms.txt` fetches measure at roughly 0.1% of AI crawler traffic, and no major provider has committed to reading it in production; crawlers fetch HTML. What earns citations is what the starter already does — static HTML, real semantics, JSON-LD. It stays available on request and is explicitly not a launch finding at any severity, with the reasoning recorded so it isn't re-litigated.

Also corrects `robots.txt`'s own staging comment, which still advised `Disallow: /` "so the staging deploy is never indexed" — the claim [seo.staging] had already corrected everywhere else.

### v2.4 — 2026-08-02 — the placeholder origin warns, it doesn't block

The build-failing placeholder guard is gone, along with the `ALLOW_PLACEHOLDER_SITE` variable added to work around it. A placeholder origin now warns in every environment and never fails a build.

It was the wrong instrument at the wrong moment. Failing a build is the most disruptive response available, and a preview deploying with placeholder canonicals is harmless — nothing is indexed or linked. Client sites legitimately sit on a `*.pages.dev` URL for weeks before a domain is decided, and blocking every one of those deploys to prevent one launch mistake is a bad trade. It broke this starter's own preview on its first deploy, which is the kind of evidence worth listening to.

The escape hatch was worse than the problem: a variable that switches the check off is a footgun in a client repo, where setting it once silently removes the protection for good.

[checklist.pre-launch] remains the gate. It blocks on a placeholder origin in production mode and runs deliberately at cutover, which is the only moment this matters. The `launch` skill no longer implies a failed build would have caught it — it reads `site.ts` directly and treats the build's `[site]` warning as a hint, not proof.

The single-source import from [seo.identity] is unaffected and stays: the domain is still declared exactly once.

### v2.3 — 2026-08-02 — one home per thing

Three artifacts removed, each because something else already did its job better.

**`STANDARDS.md` (generated) — deleted.** Assembling every module into one file meant every documentation commit produced a doubled diff: the module and its copy. Its one unique benefit was that rule ids rendered as links there and nowhere else.

That benefit is now everywhere instead. `scripts/build-doc-links.mjs` appends an auto-managed reference-definition block to each citing file, listing only the ids that file uses — a `rule-links` comment wrapper around one `[id]: path#anchor` line per citation.

Reference definitions are invisible when rendered, so citations became clickable in every module, checklist and in `AGENTS.md` — 159 definitions across 20 files — while diffs went back to single. [guardrails.docs-check] now verifies those blocks are current instead of verifying a 1,500-line duplicate, and module headers lost the `order` field that only existed to sequence the assembly.

**`Doc/` — deleted.** 27 per-component reference docs that duplicated `src/content/components/*.mdx`, the live showcase and the documented home ([components.docs]). Four of them (Modal, AccordionMorph, Button, AnimatedTags) carried mechanism and design-rationale sections their MDX counterparts lack; that content is recoverable from git history if it's ever wanted. [components.docs] now states one home and raises the bar for what an MDX entry must cover, so the gap doesn't reopen.

**The `launch` skill's staging rule reconciled with [seo.staging].** It was the last place a shipped tool gave a wrong answer: it blocked when `Disallow: /` was *missing* from staging and treated its presence as protection — so it would have passed a staging site that search engines could index, which is precisely what [seo.staging] was rewritten to prevent.

It now checks for one of the four real methods, splitting them by what an audit can actually see: `X-Robots-Tag` and meta-`noindex` are verifiable from the repo and built output; host-level access control and a non-public preview URL are `NEEDS HUMAN`. It also gained the inverse production check — a blanket `X-Robots-Tag: noindex` in `public/_headers` ships to production and deindexes the live site — and is explicitly barred from auto-fixing the finding, because adding `Disallow: /` would close the report while leaving the site indexable.

**`Plan.md` — moved to [plan].** It was direction notes at the repo root competing for attention with the rulebook. Its "Component showcase site (in-repo)" section was dropped — that shipped, and is live at `/components`. The rest (template-repo distribution, component roadmap, long-term registry) is still live direction and now sits in `docs/` labelled as explicitly not rules.

### v2.2 — 2026-08-01 — the gates become true

**Site identity single-sourced ([seo.identity]).** `astro.config.mjs` now imports `site.url` from `src/data/site.ts` instead of repeating the domain, so there is one declaration rather than two plus a checklist item asking someone to keep them equal.

A placeholder origin is now structurally un-shippable: hosts set `CI=true`, so the config throws on a host build, while a local build — including the starter's own, which legitimately still has the placeholder — logs a warning and continues. Making the guard unconditional would force the reference implementation to violate its own rule, and a rule the starter breaks is a rule nobody keeps.

Downstream, the `launch` skill's "`site` and `url` are not byte-identical" check is gone — that drift is now impossible — and is replaced by a check that the config still imports rather than redeclaring.

### The type gate actually type-checks

`typecheck` ran `tsc --noEmit`, which never opens a `.astro` file — so every component, prop type and component usage in the repo passed the gate unread. It now runs `astro check --minimumFailingSeverity warning` ([structure.gate]), which checks `.astro` **and** `.ts` and runs `astro sync` itself.

The swap surfaced three real errors, all fixed at their source rather than suppressed:

- **`@fontsource-variable/*` side-effect imports** had no type declarations (ts 2882). Added `src/fontsource.d.ts` — a global declaration file, because an ambient module declaration for an unknown package is illegal in a file that has top-level imports.
- **`CodeBlock`'s `lang` prop** was `string`, which doesn't satisfy shiki's language union. Now derived from `<Code />` via `ComponentProps`, so it stays correct if Astro's accepted set changes.
- **`SliderBasicMap`'s `items`** was declared required while the destructure defaulted it to `[]` and the component documented manual children as an alternative. The declaration was the bug; `items` is now optional, and the preview route that tripped it renders real sample slides instead of an empty slider.

Result: 0 errors, 0 warnings across 71 files. 32 hints remain and do not fail the gate.

### v2.1 — 2026-08-01 — documentation restructure

The rulebook was a single 1,340-line file with no entry point shorter than "read all of it", and nothing detecting a stale cross-reference. Renumbering during the v2 rewrite silently broke four references across two files; this release fixes that structurally. **No rule text changed.**

**Structure**
- Split into modules under `docs/`: `rules/` (the rules), `checklists/` (the gates), and the process docs. `STANDARDS.md` is now **generated** from them by `scripts/build-standards.mjs` — table of contents included — and is never edited directly.
- **`docs/workflow.md`** added as the router: 13 task rows mapping a job to just the modules it needs.
- **Verification tiers** added, Tier 0 (copy) to Tier 4 (launch), classified by blast radius. A copy edit and a token change no longer carry the same gate.
- `AGENTS.md` became the vendor-neutral agent contract; `CLAUDE.md` reduced to a pointer at it, reversing the old direction. `README.md` replaced the stock Astro template readme.
- `astro-for-beginners.md` moved to `docs/learn/`, explicitly marked non-authoritative; the contact-form guide moved to `docs/how-to/`.

**Stable rule ids replace section numbers**
- Every rule now declares an id beside its heading (`<!--rule: components.scripting | tier: required-->`) and is cited as `[components.scripting]`. 87 rules declared; 194 section references converted.
- Section numbers are gone from headings entirely, and `§N` is now **banned syntax** — the gate rejects it.
- Ids are linkified automatically in the generated `STANDARDS.md`, so citations stay clickable without hand-maintained anchors.

**Enforcement ([guardrails.docs-check])**
- `scripts/check-docs.mjs` added and wired into `npm run check`. It fails on an unresolvable citation, a duplicate id or module order, an unknown tier, a surviving `§` reference, a broken relative link, or a stale `STANDARDS.md`.

### v2 — 2026-08-01

**Correctness**
- **Type gate rewritten ([structure.gate]).** `tsc --noEmit` does not read `.astro` files; the gate is now `astro check --minimumFailingSeverity warning`. Recorded as a gap until `package.json` follows ([conformance]).
- **Conformance contract added ([principles]).** A Required rule must be true of the starter or appear in [conformance] with a date. [conformance] rewritten from an undated wish list into a verified gap table; three stale entries cleared.
- **Staging indexing ([seo.staging]).** `Disallow: /` demoted to a secondary signal; access control / `X-Robots-Tag` / meta-noindex now required, with the `_headers` production caveat.
- **Site identity single-sourced ([seo.identity]).** `astro.config.mjs` imports `site.url`; placeholder guard fails the build on `example.com`.
- **Version drift removed ([structure.versions]).** Pinned framework versions replaced with a policy pointing at `package.json`.
- Token contract corrected ([tokens.model]): `--color-warning`, `--pattern-stripe` and `--accent-line` added; radius stance restated ([tokens.per-client]). Tree, root-file map and collection references corrected ([structure.layout], [content.md-vs-mdx]). Sitemap filter's actual role clarified ([seo.sitemap]).

**Authoring**
- **Init guard changed to per-behavior** `WeakSet` ([components.scripting]) — a single shared flag silently blocks a second behavior on the same element. Full `AbortController` teardown recipe added.
- **`astro:page-load` documented as conditional** on the client router, which is opt-in and not enabled in the starter ([components.scripting]).
- **Props typing relaxed ([components.props]):** `interface` for object shapes, `type` for unions/polymorphism/intersections; polymorphic guidance rewritten and the stale `Button` note removed.
- **Three component templates ([templates])** — static (default), interactive, polymorphic. Random-id generation dropped.
- **`SectionMain`** documented as-is, with visual framing named as a brand decision and the missing opt-out logged ([conformance]).
- Forms hardened ([components.forms]): server-side validation, limits, rate limiting, origin strategy, header-injection tests, logging/retention, failure alerting.
- Docs homes disambiguated ([components.docs]); `Hero` named as the sanctioned prefix exception ([structure.naming]).

**New**
- **Agent skills & commands documented ([guardrails.skills])** — the `launch` pre-launch audit and the `build-component` guided build, with authoring rules: derived from this file and never the reverse, every `§` reference must resolve, procedure not rules, no client-specific stances, no machine-specific paths, audit before fixing, `CLEAN` and `NEEDS HUMAN` mandatory. [checklist.pre-launch] now names the skill as its executable form; two skill/standard conflicts logged in [conformance].
- Responsive contract ([tokens.responsive]) — mobile-first, test widths, `min-w-0`, wide-content scrolling.
- `Layout.astro` prop contract ([seo.layout-contract]).
- Content-source seam ([content.source-seam]).
- Navigation prefetch policy ([perf.prefetch]).
- Performance budgets ([perf.budgets]) alongside Lighthouse smoke targets.
- Accessibility thresholds ([a11y.thresholds]) and a "page done" checklist ([checklist.page]).
- Local-development notes ([guardrails.skills]); starter lineage ([structure.git]); no-duplication rule for agent docs ([principles]).

**Accessibility corrections ([a11y])**
- "Every component ships with ARIA" → ships the behavior it needs, native-first.
- Keyboard table split into required vs optional: Esc removed from the accordion pattern; arrow/Home/End marked optional there; automatic vs manual tab activation stated as a choice.
- "One `h1` per page" relabelled an agency convention, not a WCAG requirement.
- Added focus-not-obscured, forced-colors, target size, reflow and text-spacing checks.

**Performance reframed**
- Canvas rules split into Required behavior vs tunable Defaults, with a measurement rule; superlative claim and project-specific result removed ([perf.canvas]).
- `inlineStylesheets: 'always'` given an explicit re-measure trigger ([perf.css]).
- Partytown made per-vendor and test-gated ([perf.third-party]).
- Fonts: requirement is self-hosted WOFF2, variable preferred, Fontsource as the default source rather than the only one ([perf.fonts]).
- Hosting made host-neutral ([deploy.static]): Cloudflare Workers static assets preferred, Pages supported, Netlify equal; downstream steps refer to "the production host".

---

*Maintained in the starter. Propose changes via PR against this file; once merged, roll relevant items into active client repos.*

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[a11y]: ./rules/accessibility.md#accessibility
[a11y.thresholds]: ./rules/accessibility.md#measurable-thresholds
[checklist.page]: ./checklists/page.md#page-done
[checklist.pre-launch]: ./checklists/pre-launch.md#pre-launch
[checklists]: ./checklists/index.md#checklists
[components.composition]: ./rules/components.md#composition-model-pages--sections--components
[components.docs]: ./rules/components.md#documentation--shared-components
[components.forms]: ./rules/components.md#forms--form--field-progressively-enhanced-and-hardened
[components.props]: ./rules/components.md#props-typing
[components.scripting]: ./rules/components.md#client-side-scripting
[conformance]: ./conformance.md#starter-conformance-gaps
[content.copy]: ./rules/content.md#copy-quality--spell-check-flags-a-human-decides
[content.md-vs-mdx]: ./rules/content.md#md-vs-mdx--pick-by-whether-the-author-places-components
[content.source-seam]: ./rules/content.md#content-source-seam
[deploy.static]: ./rules/deployment.md#deployment--static
[guardrails.docs-check]: ./guardrails.md#documentation-integrity-check-required--shipped
[guardrails.skills]: ./guardrails.md#agent-skills--commands-required--shipped
[perf.budgets]: ./rules/performance.md#budgets--targets
[perf.canvas]: ./rules/performance.md#animated-canvases--heavy-client-js
[perf.css]: ./rules/performance.md#css-inlining
[perf.fonts]: ./rules/performance.md#fonts--self-hosted
[perf.prefetch]: ./rules/performance.md#navigation-prefetch
[perf.third-party]: ./rules/performance.md#third-party-scripts
[plan]: ./plan.md#plan--direction-notes
[principles]: ./rules/principles.md#why-this-exists
[seo.ai-crawlers]: ./rules/seo.md#ai-crawler-policy
[seo.identity]: ./rules/seo.md#site-identity--one-source-of-truth
[seo.layout-contract]: ./rules/seo.md#the-layoutastro-contract
[seo.sitemap]: ./rules/seo.md#sitemap
[seo.staging]: ./rules/seo.md#staging--preview-indexing-control
[structure.gate]: ./rules/structure.md#required-scripts--the-type--build-gate
[structure.git]: ./rules/structure.md#git-branching-deploy--starter-lineage
[structure.layout]: ./rules/structure.md#directory-layout
[structure.naming]: ./rules/structure.md#naming-conventions
[structure.versions]: ./rules/structure.md#versions--engines
[templates]: ./rules/component-templates.md#component-author-templates
[tokens.design-doc]: ./rules/tokens.md#designmd-records-decisions-not-values
[tokens.layout]: ./rules/tokens.md#layout--spacing-utilities
[tokens.model]: ./rules/tokens.md#the-token-model
[tokens.per-client]: ./rules/tokens.md#per-client-design-decisions-set-at-intake
[tokens.responsive]: ./rules/tokens.md#responsive-contract
<!-- /rule-links -->
