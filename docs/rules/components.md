<!--docs-module: rules/components-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Components: the authoring standard
<!--rule: components | tier: reference-->

### Composition model: pages → sections → components
<!--rule: components.composition | tier: required-->

Treat the UI as **three tiers**, and let each page read like a table of contents.

**1. Primitives & blocks — *open* components (props + slots).**
Reusable UI units with a clear identity: `Button`, `Card`, `Field`, `Tag`. They live flat in `components/`, are fully parameterized (typed props + slots — [components.props]/[components.slots]), are styled only with tokens, and contain **no page-specific content**.

**2. Sections — *closed* components (little or no props).**
A whole page section: `Hero`, `SectionFeatures`, `SectionContact`. Lives flat in `components/` with a `Section*` prefix, **owns its own semantic `<section>` landmark**, and composes primitives + content inline. **Closed by default**: it bakes in its content and exposes *no* props. A section's job is to encapsulate a chunk of a page so the page file stays readable — not to be reusable.

> **Required — build sections on `SectionMain`.** `SectionMain.astro` is the section primitive; a new `Section*` renders it as its root rather than hand-rolling a wrapper. It supplies, in one place:
> - the semantic `<section>` element (pass `id` for anchor links and any `aria-*` — it spreads native attributes);
> - the centered `container-page` column, so every section lines up with the nav and footer;
> - the vertical rhythm presets — `padding` (`none`–`xl`), plus `paddingTop` / `paddingBottom` for asymmetric spacing;
> - the left/right side rules and an optional `borderTop` divider;
> - the horizontal content padding (`contentPadding`) and a `contentClass` hook on the inner column.
>
> Writing `<section class="section-gutter section-padding">` by hand drifts from the shared rhythm. Reach for bespoke markup **only** when a section is genuinely full-bleed or frames itself — an *allowed-with-reason* deviation, so state the reason.
>
> Components that manage their own grid and padding (`FlowSteps`, `FeatureScrollSpy`) still go *inside* `SectionMain`, with `padding="none" contentPadding="none"`.
>
> **Leave `padding` off.** The default is `"md"` — the base `section-padding` rhythm — and it is the right answer for an ordinary stacked section. Pass a tier only when the section has a reason to break rhythm: `lg`/`xl` to isolate a page-closing CTA or a hero, `xs`/`sm` for a dense strip (logo wall, stat bar), `none` when the child owns its own spacing. A page where most sections carry an explicit `padding` has drifted from the scale rather than used it.
>
> **The side rules are deliberate and stay unconditional.** They are part of the shared frame every section inherits — that consistency is the reason `SectionMain` exists, and a per-section opt-out prop would reintroduce exactly the drift it prevents. Width and border color are already token-driven (`container-page`, `border-stroke`) and tuned in `global.css`.
>
> A project whose design has no section borders **edits `SectionMain` in its own repo**. Client repos own their copy of the component set; changing a primitive to match the brand is normal work, not a deviation. The rule is that every section goes through `SectionMain` — not that `SectionMain` looks identical on every project.
>
> ```astro
> ---
> import SectionMain from "@components/SectionMain.astro";
> ---
> <SectionMain id="features">
>   <h2 class="h2">Features</h2>
>   <p class="text-body-lg text-fg-muted">…</p>
> </SectionMain>
> ```

**3. Pages — composition only.**
`pages/*.astro` reads like a table of contents. Push markup *down* into sections. **Avoid page-level `<style>`/`<script>`** — custom CSS or behavior in a page file is the signal it belongs in a section (or, if reusable, in `global.css` / an `@utility`).

```astro
<Layout title="…" jsonLd={homepageSchema}>
  <Hero />
  <SectionFeatures />
  <SectionContact />
</Layout>
```

**Open vs closed — the test:** *"Will this be reused with different content?"* Yes → **open** component with props/slots. No → **closed** section. When unsure, start closed; adding props later is easy. Don't parameterize a section "just in case."

**Components vs raw markup.**
The "extract after the 2nd use" rule holds, but don't atomize every wrapper — that's *less* clean in Astro (prop-drilling, a maze of tiny files, harder for humans and agents to read). Inside a section, **raw semantic HTML + Tailwind is expected and correct** for one-off layout.
- **Extract to a component** when the thing has **identity, behavior, or reuse**: reused ≥2×, *or* it carries interaction/state/script, *or* it has a nameable identity with variants (even used once, e.g. `Hero`), *or* it owns accessibility logic that must stay consistent.
- **Leave it as raw markup** when it's a purely-presentational one-off wrapper. Don't invent a `<Stack>`/`<Row>` for every `<div>`.

Rule of thumb: **components for *things*, raw markup for *arrangement*.**

**"Raw markup" ≠ inline CSS/JS.** Keep the three concerns separated:
- **Structure** → semantic HTML + Tailwind utilities.
- **Styling** → Tailwind utilities or a scoped `<style>` using `var(--token)` ([tokens.scoped-styles]). **Never inline `style="…"`** — it bypasses tokens/theming, can't express hover/focus/media states, and isn't cacheable.
- **Behavior** → an Astro `<script>` (bundled, type-checked, tree-shaken; [components.scripting]). **Never inline `onclick="…"`.**
- Long Tailwind class lists are the one real noise source — fix by extracting a recurring combo into an `@utility` recipe, not by reaching for inline `style`.

### Props typing
<!--rule: components.props | tier: default-->

**Default: `interface Props`** for ordinary object-shaped props. It gives the cleanest consumer IDE hints and is what most components need.

```astro
---
interface Props {
  label: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  hideLabel?: boolean;
  class?: string;
}
const { label, size = "md", hideLabel = false, class: className } = Astro.props;
---
```

**Use `type` when the shape genuinely isn't an object literal** — discriminated unions, polymorphism, intersections. Consistency is about the *default*, not about fighting the type system.

**Components that proxy a native element** extend native attributes so callers can pass any `data-*`, `aria-*` or handler without you enumerating them:

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"button"> {
  variant?: "primary" | "secondary" | "tertiary";
  withArrow?: boolean;
}
const { variant = "primary", withArrow = true, class: className, ...rest } = Astro.props;
---
```

**Polymorphic components (renders `<a>` *or* `<button>`).** Two acceptable forms:

1. **Extend the primary element and forward the few props of the other** (`href`, `target`, `rel`). This is what `Button.astro` does. Simple, good hints, easy to destructure. It does not stop a caller passing `href` and `disabled` together.
2. **A discriminated union** (`type Props = ButtonProps | AnchorProps`) makes invalid combinations unrepresentable. Stronger, at the cost of needing narrowing before destructuring in frontmatter.

Prefer (1) by default; reach for (2) when a component's invalid combinations are genuinely dangerous. **Do not** use a flat `HTMLAttributes<"button"> & HTMLAttributes<"a">` intersection — it makes every attribute optional on both and weakens the hints callers get.

### Defaults
<!--rule: components.defaults | tier: default-->

Set defaults in the destructure, not with `??` scattered through the template:

```astro
const { label = "Learn More", variant = "primary", arrowDirection = "right" } = Astro.props;
```

### Slots — default + named, with introspection
<!--rule: components.slots | tier: default-->

- **Default slot** for the main content; provide a fallback if optional: `<slot>{label}</slot>`.
- **Named slots** for distinct regions: `<slot name="title" />`, `<slot name="media" />`.
- **Introspect to wire conditional regions + ARIA.**
  - Cheap check: `Astro.slots.has("title")`.
  - **Robust check** when a slot may be passed but render empty — `has()` returns true even for falsy conditional content:
    ```astro
    const mediaContent = Astro.slots.has("media") ? await Astro.slots.render("media") : "";
    const hasMedia = mediaContent.trim().length > 0;
    ```
- Hide empty slotted regions with CSS `:empty { display: none }`.

**Prop vs slot:** plain string/number/boolean → **prop**. Rich markup the caller composes → **slot**. Don't accept HTML strings as props.

### Variants & polymorphism
<!--rule: components.variants | tier: default-->

- Variants are a **typed union prop** (`variant?: "primary" | "secondary" | "tertiary"`), resolved via `class:list` or a lookup map. Never a freeform string.
- Polymorphic tag selection: `const Tag = href && !disabled ? "a" : "button"`, then `<Tag …>`.

### Styling components
<!--rule: components.styling | tier: required-->

- Reach for **Tailwind utilities with semantic tokens** first (`bg-panel`, `text-fg-muted`, `border-stroke`).
- **Focus ring is mandatory and built-in** on every interactive element:
  ```
  focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
  ```
  The equivalent hand-rolled form, for a component that already uses a `<style>` block, is `box-shadow: 0 0 0 2px var(--color-canvas), 0 0 0 4px var(--color-focus);` on `:focus-visible`. **Pick one per component — never mix the two**, or the offsets fight each other.
- **`is:global` is allowed with reason and must be namespaced.** Components that style slotted children (Field, Modal, Media, sliders) may use it, but **only** scoped under a component data attribute: `[data-field="component"] { … }`. Never emit a bare global class — it leaks site-wide and collides. Document the reason in a comment above the block.
- **External links:** `target="_blank"` always ships `rel="noopener noreferrer"`, and the link's accessible name indicates it opens a new context.

**Class naming.** Match the file you're in rather than imposing one style everywhere:
- **Tailwind utilities** for atomic components (`Button`, `Tag`, `Icon`, `Avatar`) — a class list is shorter than a stylesheet.
- **BEM-style names** for components with meaningful internal structure and cross-element selectors, where a scoped `<style>` block is doing real work. The class root matches the component (`accordion__item`, `bento-card__header`).

**The Astro scoping trap.** Astro appends its scope hash to **both** ends of a descendant selector. If the ancestor you're keying off is rendered by a *different* component, the rule silently never matches:

```css
/* Wrong — Astro hashes [data-state] as well as .child, but the state
   attribute lives on a parent rendered elsewhere. Matches nothing. */
[data-state="open"] .child { … }

/* Right — keep the ancestor unhashed. */
:global([data-state="open"]) .child { … }
```

This is the most common cause of "my CSS isn't applying" in an Astro component, and it fails silently — no error, no warning, just no styling.

### Client-side scripting
<!--rule: components.scripting | tier: required-->

- **Drive behavior from `data-*` attributes**; keep ARIA/semantic attributes separate from scripting hooks (`data-modal-open` for JS; `role="dialog"` for a11y).
- **Guard single initialization per behavior, not per element.** A single shared flag means the first behavior to claim an element blocks every other behavior on that element, silently. Use a module-level `WeakSet`:

  ```ts
  const initialized = new WeakSet<HTMLElement>();

  function initTabs() {
    document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((el) => {
      if (initialized.has(el)) return;
      initialized.add(el);
      // wire interactions here
    });
  }
  ```

  If you must use an attribute (for debugging visibility), **name it per behavior** — `data-tabs-initialized`, `data-modal-initialized` — never a generic shared flag.

- **Always clean up.** One `AbortController` per instance removes every listener at once:

  ```ts
  const controller = new AbortController();
  const { signal } = controller;

  el.addEventListener("click", onClick, { signal });
  window.addEventListener("resize", onResize, { signal });
  mediaQuery.addEventListener("change", onMotionChange, { signal });

  // teardown — on close/unmount, and before re-init after navigation
  controller.abort();
  ```
  Observers (`IntersectionObserver`, `ResizeObserver`, `MutationObserver`) and timers/rAF handles aren't covered by the signal — disconnect and cancel them in the same teardown.

- **Navigation lifecycle is conditional.** `astro:page-load` is emitted by Astro's client router (view transitions), which is **opt-in and not enabled in the starter**. Write the init function so a direct call is sufficient, and attach the listener only in projects that enable the router:
  ```ts
  initTabs();
  document.addEventListener("astro:page-load", initTabs); // no-op without the client router
  ```
  If a project enables the client router, re-init and teardown across navigations become **Required** review items.

- **Custom events bubble and are cancelable** so parents can intercept: `namespace:verb` — `form:success`, `tag:close`.

### Forms — `Form` + `Field`, progressively enhanced and hardened
<!--rule: components.forms | tier: required-->

`Form.astro` is the standard for every form:

- Works without JS (native submit to `action`); JS intercepts and `fetch`-posts, setting `data-form-status="submitting|success|error"`.
- Validation surfaces in each `Field`'s `[data-field-error]` region; the first invalid field receives focus.
- Success/error feedback in `role="status"` / `role="alert"` live regions.
- The component takes an `action` URL — **the backend is per-project** and is not shipped by the starter.

**Required for any form that ships to production.** A honeypot is a spam nuisance filter, not a security boundary. The endpoint must have:

- **Server-side schema validation** of every field (shape, type, length) — never trust the client.
- **Payload and field-length limits**, with an early reject on oversize bodies.
- **Rate limiting** per IP/session, with a sane burst allowance.
- **Origin/CSRF strategy** appropriate to the endpoint (origin allowlist at minimum).
- **Bot handling beyond the honeypot** — timing checks, or a challenge where abuse is likely.
- **Header-injection safety**: sanitize CR/LF out of anything interpolated into email headers, and cover it with a test.
- **Logging without unnecessary personal data**, plus a stated retention window.
- **Failure alerting** on the email/CRM integration — a form that silently stops delivering is worse than one that errors.

On a pure-static site the endpoint is a separate function/Worker mounted on a same-origin `/api/*` route. When hand-rolling email MIME, build the RFC 5322 string directly and sanitize header values rather than pulling in a MIME library that isn't runtime-compatible.

### Documentation & shared components
<!--rule: components.docs | tier: default-->

- **Per-component documentation lives in `src/content/components/<kebab-name>.mdx`** — the single home, rendered as the live showcase at `/components` in dev. Every reusable component ships one, plus a header comment in the component file itself.
- **An MDX entry documents behavior, not just shape.** A props table is the floor. Include what the component *does* (`Preview` examples at meaningful states), how it works when the mechanism is non-obvious, which tokens it consumes, and the gotchas — the reasoning is the part nobody can reconstruct from the source later.
- A component without an MDX entry doesn't appear in the showcase routing at all, so it is invisible to both the client and their agent.
- **`src/components/_docs/`** holds showcase-only helpers (`Preview`, `PropsTable`) — never product components.
- **Don't modify a shared component for a one-off page need.** Add a prop or build a page-local wrapper. If a shared primitive genuinely must change, that's a deliberate, reviewed change — ask first, don't drive-by edit.

### Prop & event naming
<!--rule: components.naming | tier: default-->

- **Booleans read as flags/state**, positive: `disabled`, `withArrow`, `hideLabel`, `isOpen` — prefer `is*/has*/with*`; avoid negatives.
- **Always accept a `class` passthrough** (`class?: string`, merged via `class:list`).
- **Variants are unions**, not freeform strings: `variant` / `size` / `tone`.
- **Custom events are `namespace:verb`**, bubbling + cancelable.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[components.props]: ./components.md#props-typing
[components.scripting]: ./components.md#client-side-scripting
[components.slots]: ./components.md#slots--default--named-with-introspection
[tokens.scoped-styles]: ./tokens.md#accessing-tokens-inside-scoped-style--the-1-gotcha
<!-- /rule-links -->
