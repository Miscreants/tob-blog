<!-- cspell:ignore labl primry — deliberate typos used as teaching examples -->

# Astro for Beginners

> **Background material — not a rule source.** This is onboarding for people new to Astro. It is *not* part of the build standard and must never be cited as one: where it and [`docs/rules/`](../README.md) disagree, the rules win. It also predates the current framework baseline (see `docs/rules/structure.md` for the versions actually in use), so treat specific version numbers here as illustrative.

A practical guide to Astro + Tailwind 4, written from a real learning conversation. Concepts are introduced in the order they tend to come up when building your first project, not in dictionary order.

---

## Table of contents

1. [Project setup](#1-project-setup)
2. [Layouts](#2-layouts)
3. [Components](#3-components)
4. [Tailwind 4 fundamentals](#4-tailwind-4-fundamentals)
5. [The container / section / content pattern](#5-the-container--section--content-pattern)
6. [Component variants](#6-component-variants)
7. [Polymorphic components (button vs link)](#7-polymorphic-components-button-vs-link)
8. [The CSS box model — padding vs margin](#8-the-css-box-model--padding-vs-margin)
9. [Debugging tips](#9-debugging-tips)
10. [Useful CSS techniques](#10-useful-css-techniques)
11. [Images on Cloudflare](#11-images-on-cloudflare)
12. [General principles](#12-general-principles)
13. [Tailwind 4: `@utility` vs `@layer components`](#13-tailwind-4-utility-vs-layer-components)
14. [Responsive arbitrary values](#14-responsive-arbitrary-values)
15. [Named slots](#15-named-slots)
16. [Images in Astro: the five options](#16-images-in-astro-the-five-options)
17. [Flattening nested divs](#17-flattening-nested-divs)
18. [Optional content: slot vs prop vs variant](#18-optional-content-slot-vs-prop-vs-variant)
19. [Component prop pitfalls](#19-component-prop-pitfalls)
20. [The shared-border pattern](#20-the-shared-border-pattern)
21. [`class:list` directive](#21-classlist-directive)
22. [2D grid dividers with `gap-px`](#22-2d-grid-dividers-with-gap-px)
23. [Passing `class` to a component](#23-passing-class-to-a-component)
24. [`Astro.slots.has()` for conditional rendering](#24-astroslotshas-for-conditional-rendering)
25. [The 1px border subpixel quirk](#25-the-1px-border-subpixel-quirk)
26. [Icons with `astro-icon`](#26-icons-with-astro-icon)
27. [Fluid typography with container queries](#27-fluid-typography-with-container-queries)
28. [Theme management (light & dark)](#28-theme-management-light--dark)
29. [Custom color systems](#29-custom-color-systems)
30. [External scripts & `is:inline`](#30-external-scripts--isinline)
31. [Content collections (local CMS)](#31-content-collections-local-cms)
32. [Data files (JSON/YAML) vs content collections](#32-data-files-jsonyaml-vs-content-collections)
33. [Common pitfalls](#33-common-pitfalls)
34. [GSAP & ScrollTrigger in Astro](#34-gsap--scrolltrigger-in-astro)
35. [Third-party scripts with Partytown](#35-third-party-scripts-with-partytown)
36. [Navigation patterns — from basic nav to dropdowns + mega menus](#36-navigation-patterns--from-basic-nav-to-dropdowns--mega-menus)
37. [Sharing config between components (Nav + Footer)](#37-sharing-config-between-components-nav--footer)
38. [Forwarding HTML attributes on wrapper components](#38-forwarding-html-attributes-on-wrapper-components)
39. [MDX & component showcase pages](#39-mdx--component-showcase-pages)
40. [Components with subpieces — when and how to split](#40-components-with-subpieces--when-and-how-to-split)

---

## 1. Project setup

### Create a new project

```bash
npm create astro@latest my-project -- --template minimal --install --no-git --skip-houston --typescript strict --yes
cd my-project
npx astro add tailwind --yes
```

This gives you Astro 6 + Tailwind 4 wired up via the `@tailwindcss/vite` plugin (the modern Tailwind 4 path — no `tailwind.config.js`, no `@astrojs/tailwind` integration).

### Project structure

```
src/
├── components/    ← reusable .astro files (Button, Card, etc.)
├── layouts/       ← page shells (HTML structure, head, body, slot)
├── pages/         ← every .astro file here is a route
└── styles/
    └── global.css ← @import "tailwindcss"; + your custom classes
```

### Run it

```bash
npm run dev      # local dev server with hot reload
npm run build    # production build
npm run preview  # preview the production build
```

---

## 2. Layouts

A **layout** is a reusable wrapper for your pages. It owns the page chrome — `<html>`, `<head>`, `<body>`, nav, footer — and uses `<slot />` to inject the page's content.

### Minimal layout

```astro
---
// src/layouts/Layout.astro
import "../styles/global.css";

interface Props {
  title?: string;
}

const { title = "My Site" } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Using it from a page

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Layout.astro";
---

<Layout title="Home">
  <h1>Hello world</h1>
</Layout>
```

Whatever sits between `<Layout>...</Layout>` lands inside `<slot />`.

### When to use multiple layouts

One layout per **kind of page**. The most common split:

| Layout | Used for |
|---|---|
| `MarketingLayout.astro` | Homepage, pricing, about |
| `BlogLayout.astro` | `/blog/[slug]` posts |
| `DocsLayout.astro` | `/docs/*` |
| `AppLayout.astro` | Signed-in dashboard pages |

Reasons to add a new layout:
- Different page chrome (different nav, footer, sidebar)
- Different metadata patterns (article schema vs product schema)
- Different content widths
- Different runtime characteristics (auth-gated vs public)
- Different SEO requirements

**Don't make a new layout for** a single section that varies, a different background color, or "just in case." Wait until you have a second page that needs the same shell — then extract.

### Composing layouts

Layouts can use other layouts. Define a `BaseLayout` with the shared shell, then wrap it in specialized layouts:

```astro
---
// src/layouts/BlogLayout.astro
import BaseLayout from "./BaseLayout.astro";
const { title } = Astro.props;
---
<BaseLayout title={title}>
  <article class="mx-auto max-w-prose px-6 py-12">
    <slot />
  </article>
</BaseLayout>
```

The blog layout adds blog-specific structure but inherits the base shell.

---

## 3. Components

A component is just an `.astro` file. No registration, no boilerplate.

### Anatomy

```astro
---
// 1. Frontmatter — server-side JS that runs at render time.
//    Imports, props, data fetching, computations all live here.
interface Props {
  message: string;
}
const { message } = Astro.props;
---

<!-- 2. Markup — what gets rendered to HTML. -->
<div>{message}</div>
```

The frontmatter (`---` block) is **optional**. If a component is just markup, skip it entirely.

### Two important rules

1. **Component tag names must start with an uppercase letter.** `<Button />` is a component. `<button />` is a plain HTML tag.
2. **Every component you reference in markup must be imported in the frontmatter.** No auto-import.

```astro
---
import Button from "../components/Button.astro";
---
<Button label="Click me" />
```

If you forget to import, Astro throws `ReferenceError: Button is not defined`.

### Props with TypeScript

Every component prop goes through two steps: **declare** and **extract**.

```astro
---
interface Props {
  label?: string;       // optional
  variant?: "primary" | "secondary";  // union type
}

const { label = "Click me", variant = "primary" } = Astro.props;
---
```

**Why both?** They serve different purposes:

- **`interface Props`** — TypeScript type checking. It gives you autocomplete and error warnings when using the component (e.g., passing a wrong prop type). Astro uses this interface specifically to type `Astro.props`.
- **`const { ... } = Astro.props`** — Actually extracts the values so you can use them in the template below. Without this line, there's no `label` or `variant` variable to reference.

You *technically* could skip the interface and just destructure:

```astro
---
const { label = "Click me", variant = "primary" } = Astro.props;
---
```

This works, but you lose type safety — no autocomplete, no warnings if someone passes `labl` (typo) instead of `label`. Always include both.

Think of it as: **the interface describes the contract, the destructuring does the work.**

Defaults are set via destructuring (`= "primary"`).

### Slots — the equivalent of children

`<slot />` is where the content between the component's opening and closing tags renders:

```astro
---
// src/components/Card.astro
---
<div class="rounded-lg border p-4">
  <slot />
</div>
```

```astro
<Card>
  <h3>Title</h3>
  <p>Body text</p>
</Card>
```

### Common pitfall: an empty file outputs nothing

If a component file is empty (or you forgot to save it), it renders to an empty string. No error. If a component "isn't showing".

---

## 4. Tailwind 4 fundamentals

Tailwind 4 lives entirely in CSS — no `tailwind.config.js`. Everything happens through directives in your stylesheet.

### The four directives that matter

```css
@import "tailwindcss";    /* loads Tailwind's base + utilities */

@theme { ... }             /* design tokens → auto-generates utilities */
@layer components { ... }  /* reusable named class shortcuts */
@layer utilities { ... }   /* custom utilities (rare) */
```

### `@theme` — design tokens

Variables under recognized namespaces auto-generate matching utility classes:

```css
@theme {
  --color-brand: #f00;     /* generates bg-brand, text-brand, border-brand */
  --spacing: 0.25rem;       /* base unit for ALL spacing utilities */
  --container-7xl: 90rem;   /* max-w-7xl is now 90rem (default is 80rem) */
  --font-sans: "Inter", sans-serif;
}
```

The recognized namespaces are: `--color-*`, `--spacing-*`, `--font-*`, `--text-*`, `--container-*`, `--radius-*`, `--shadow-*`, and a few more.

**Key insight:** `--spacing` is the master variable. Every spacing utility multiplies it. `p-4` literally compiles to `padding: calc(var(--spacing) * 4)`. Change `--spacing` and the entire site's spacing scales proportionally.

### `@layer components` — reusable shortcuts

Use `@apply` to compose existing utilities into a named class:

```css
@layer components {
  .container-large {
    @apply mx-auto w-full max-w-7xl;
  }

  .btn-primary {
    @apply rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600;
  }
}
```

Then use them as if they were utilities:

```astro
<main class="container-large">
  <button class="btn-primary">Click me</button>
</main>
```

### Why `@layer`? Cascade layers explained

CSS cascade layers introduce a **second tier above specificity**. Tailwind sets up three layers in order:

```
@layer base, components, utilities;
```

Rules in **later** layers always beat rules in **earlier** layers, regardless of specificity or source order. So:

| Layer | Strength | What goes in it |
|---|---|---|
| `base` | Weakest | Resets, body font, default styles |
| `components` | Middle | Your reusable patterns (`.btn`, `.container-large`) |
| `utilities` | Strongest | `bg-red-500`, `mt-4`, `flex`, etc. |

This is why you can write `<main class="container-large py-12">` and the `py-12` always overrides anything `container-large` defines about vertical padding. Utilities always win.

**Without layers, you'd have specificity wars.** With layers, the override behavior is predictable.

### Common gotchas

**1. Invalid class names are silently ignored.** Tailwind doesn't error on unknown classes — it just produces no CSS. If a class seems to do nothing, the first thing to check is whether the class actually exists. There is no `align-center`, no `text-1xl`, no `m-width-auto`, no `container-7xl`. The real names are `items-center`, `text-xl`, `mx-auto`, `max-w-7xl`.

**2. Don't construct class names dynamically.**

```astro
<!-- ❌ DOESN'T WORK -->
<div class={`bg-${color}-500`}>
```

Tailwind reads source files as plain text to find class names. It can't follow `${color}`. The full class name must appear literally in your source. Use a lookup map instead (see [Component variants](#6-component-variants)).

**3. `@apply` only works with classes that exist.**

```css
.btn { @apply container-7xl; }  /* ❌ container-7xl is not a class */
```

### Reading raw CSS variables

Every `@theme` token is also exposed as a CSS variable. You can use them in raw CSS when utilities aren't enough:

```css
.something {
  background: var(--color-blue-500);
  padding: calc(var(--spacing) * 4);
  font-family: var(--font-sans);
  max-width: var(--container-7xl);
}
```

Reach for raw CSS only when `@apply` can't express what you need (e.g. `clamp()`, `calc()` with multiple variables, container-query units).

---

## 5. The container / section / content pattern

This is the single most important layout pattern in modern web design. Once you internalize it, you stop fighting layout problems.

### The mental model

Three independent layers, each with one job:

```
<Layout>                ← page chrome (html, head, nav, footer)
  <section>             ← full-bleed background owner, vertical padding
    <div container>     ← horizontal cap and centering
      content           ← whatever
    </div>
  </section>
</Layout>
```

| Layer | Job | What it owns |
|---|---|---|
| **Layout** | Chrome | `<html>`, `<head>`, `<body>`, nav, footer |
| **Section** | Background | Full-bleed colors/gradients, vertical padding |
| **Container** | Width | Max-width, horizontal centering |

### The three classes

```css
@layer components {
  .container-large {
    @apply mx-auto w-full max-w-7xl;
  }

  .section-gutter {
    @apply px-4 md:px-12 lg:px-24;
  }

  .section-padding-lg {
    @apply py-32 md:py-48;
  }
}
```

Each does **one** thing:
- `container-large` → caps width and centers (no padding)
- `section-gutter` → horizontal breathing room from screen edges
- `section-padding-lg` → vertical rhythm

### Putting it together

```astro
<section class="section-pattern section-gutter relative">
  <div class="container-large section-padding-lg flex flex-col items-center">
    <h1>Hello World</h1>
  </div>
</section>
```

### Why split horizontal padding from the container?

If you put padding ON the container, you can't have full-bleed sections without overrides. Splitting them lets you mix freely:

```astro
<!-- Section with full-bleed background, contained content -->
<section class="bg-zinc-900 section-gutter">
  <div class="container-large section-padding-lg">
    <h1>Hero</h1>
  </div>
</section>

<!-- Section with full-bleed background AND full-bleed content -->
<section class="bg-blue-500 section-padding-lg">
  <h2>Edge-to-edge banner</h2>
</section>
```

---

## 6. Component variants

When a component has visual variants (primary, secondary, ghost, etc.), the cleanest pattern is a **lookup object** mapping each variant to its classes.

### The pattern step by step

```astro
---
interface Props {
  label?: string;
  variant?: "primary" | "secondary";
}

const { label = "Learn More", variant = "primary" } = Astro.props;

const variantClasses = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary:
    "bg-transparent text-blue-500 border border-blue-500 hover:bg-blue-500 hover:text-white",
};
---

<button
  class={`inline-flex items-center gap-4 px-6 py-3 rounded-sm transition-colors duration-300 ${variantClasses[variant]}`}
>
  {label}
</button>
```

Here's what's happening:

1. **`interface Props`** — declares `variant` as a union type (`"primary" | "secondary"`). TypeScript will warn if someone passes `variant="primry"` (typo) or `variant="danger"` (not in the union).
2. **`const { variant = "primary" } = Astro.props`** — extracts the value with a default. If the caller doesn't pass `variant`, it falls back to `"primary"`.
3. **`variantClasses`** — a plain JavaScript object where each key is a variant name and each value is the Tailwind classes for that variant.
4. **`variantClasses[variant]`** — a dynamic lookup that grabs the right class string at build time.
5. **Template literal** — the base classes (layout, spacing, transitions) are written directly in the `class` attribute. The variant-specific classes are injected via `${variantClasses[variant]}`.

The result: the base styling is always applied, and the variant controls only the parts that change (colors, borders, backgrounds).

### Why this pattern

- **Adding a variant = adding one line.** Want a `ghost` variant? Add `ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800"` to the object and `"ghost"` to the union type. Done.
- **Variants are listed in one place** — easy to scan, easy to keep consistent.
- **Markup stays clean.** No nested ternaries or long `if/else` chains in the template.
- **Tailwind sees the full class names** in the source (because the strings are literal). This matters — Tailwind scans your files for class names at build time, so they must appear as complete strings.

### Three pitfalls

1. **Don't construct class names dynamically.** `bg-${color}-500` doesn't work — Tailwind can't find partial strings during its build scan. The full string `"bg-blue-500"` must appear literally somewhere in your source.
2. **Don't put properties in the base that variants might override.** Keep `bg-*` and `text-*` exclusively in the variant map; keep `px-*`, `py-*`, `rounded-*` in the base. If the base says `bg-white` and a variant says `bg-blue-500`, the last one in the stylesheet wins — not the last one in your class string. This causes unpredictable results.
3. **Don't forget to update the union type when adding variants.** If you add `ghost: "..."` to the object but don't add `"ghost"` to the `Props` interface, TypeScript won't autocomplete it and callers won't know it exists.

### Why brackets, not dot notation

`variantClasses[variant]` uses **bracket notation** because the key is coming from a variable. The two forms look similar but mean different things:

```js
variantClasses.primary    // dot notation — looks up a key literally named "primary"
variantClasses["primary"] // bracket notation with a string — same result
variantClasses[variant]   // bracket notation with a variable — looks up the key whose name = the value of `variant`
```

If you wrote `variantClasses.variant`, JavaScript would search for a key literally called `"variant"` and return `undefined`, because no such key exists in the object. Brackets are the only way to do a **dynamic** lookup where the key is decided at runtime.

This is why every variant-style helper in this guide — `borderClass[border]`, `paddingClasses[padding]`, etc. — uses brackets. It's not an Astro thing or a Tailwind thing; it's a core JavaScript rule.

The verbose equivalent without a lookup object would be a chain of `if`/`else` (or a `switch`):

```js
let classes;
if (variant === "primary")        classes = "bg-blue-500 text-white";
else if (variant === "secondary") classes = "border border-blue-500 text-blue-500";
```

Both produce the same result. The object-lookup version is just shorter, easier to scan, and trivial to extend with a new variant.

### Multiple dimensions of variants

Same pattern, just multiple maps:

```ts
const variantClasses = {
  primary: "bg-blue-500 text-white",
  secondary: "border border-blue-500 text-blue-500",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};
```

```astro
<button class={`... ${variantClasses[variant]} ${sizeClasses[size]}`}>
```

This is exactly how every component library works under the hood.

---

## 7. Polymorphic components (button vs link)

When something looks like a button but might navigate to a URL, render it as `<a>` — never `<button>` with a click handler.

### Why `<a>` matters semantically

- Cmd+click and middle-click open in a new tab
- Right-click → "Copy link" works
- Screen readers announce it as a link
- Search engines follow it
- Browser history works correctly

### The polymorphic pattern

A single component that becomes whichever element makes sense:

```astro
---
interface Props {
  label?: string;
  variant?: "primary" | "secondary";
  href?: string;
  type?: "button" | "submit" | "reset";
}

const { label, variant = "primary", href, type = "button" } = Astro.props;

const variantClasses = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white",
};

// Pick element: <a> if href provided, else <button>.
// Variable name MUST start with uppercase to be treated as a tag.
const Tag = href ? "a" : "button";
---

<Tag
  href={href}
  type={!href ? type : undefined}
  class={`inline-flex items-center gap-4 px-6 py-3 rounded-sm transition-colors duration-300 ${variantClasses[variant]}`}
>
  {label}
</Tag>
```

### Use it

```astro
<Button href="/pricing" label="See pricing" />     <!-- <a> -->
<Button label="Open menu" />                        <!-- <button> -->
<Button type="submit" label="Sign up" />            <!-- <button type="submit"> -->
```

### Three details

1. **`Tag` must be capitalized.** Astro treats lowercase as a literal HTML tag.
2. **`undefined` attributes are omitted.** Setting `type={undefined}` produces no `type` attribute in the output. Clean way to conditionally add attributes.
3. **External links** should add `target="_blank"` and `rel="noopener noreferrer"` for security and UX:
   ```ts
   const isExternal = href?.startsWith("http");
   ```

---

## 8. The CSS box model — padding vs margin

Every element has four concentric layers:

```
┌──── MARGIN ────┐  ← space OUTSIDE the box
│  ┌── BORDER ─┐ │
│  │ ┌─PADDING┐│ │  ← space INSIDE the box
│  │ │CONTENT ││ │
│  │ └────────┘│ │
│  └───────────┘ │
└────────────────┘
```

| Layer | Where | Tailwind utilities |
|---|---|---|
| Margin | Outside the box | `m-*`, `mx-*`, `my-*`, `ml-*`, `mr-*`, `mt-*`, `mb-*` |
| Border | The visible edge | `border-*` |
| Padding | Inside the box | `p-*`, `px-*`, `py-*`, `pl-*`, `pr-*`, `pt-*`, `pb-*` |
| Content | Inside the padding | Your h1, p, etc. |

### A real bug from the conversation

```html
<div class="container-large mx-6">
```

`container-large` includes `mx-auto` (which centers the box). But `mx-6` overrides it (margin-left/right become 1.5rem instead of auto). Result: the box stops centering.

**Why?** `mx-6` is a utility, `container-large` is a component, and **utilities always beat components in cascade layer order**. Add `mx-6` and centering breaks.

### The mental check

Before adding margin or padding, ask: "Do I want space **inside** the box (so content has room from the box edges) or **outside** the box (so the box has room from its parent's edges)?"

- Inside → padding
- Outside → margin

---

## 9. Debugging tips

### Inspect the element in DevTools

When something doesn't look right, **right-click → Inspect**, then look at the **Computed** styles panel. It shows you the final value of every CSS property and which rule set it. This catches:

- Class typos (no rule listed for that property → the class doesn't exist or wasn't picked up)
- Override conflicts (DevTools shows you which rule won and which lost)
- Specificity issues (struck-through values are overridden)

### Tailwind class typos are silent

There is no error for `text-1xl`, `align-center`, `m-width-auto`, or `container-7xl`. Tailwind just doesn't generate any CSS for them. If a class seems to do nothing, the first thing to check is: **does this class actually exist?**

Real names you might confuse:
- `align-center` → `items-center` (flex children) or `text-center` (text)
- `text-1xl` → `text-xl`
- `m-width-auto` → `mx-auto`
- `container-7xl` → `max-w-7xl`

### Check the file is saved

If a component or layout isn't behaving like the code says it should, look at the file tab in your editor. A `●` (dot) where the close button normally is means **unsaved changes**. Hit `Ctrl+S`.

### Read the dev server output

Astro's dev server prints helpful errors, including what file failed to compile, what import was missing, and a stack trace. Don't dismiss it — read it before debugging in the browser.

---

## 10. Useful CSS techniques

### The knockout pattern

> Put the decoration on the parent. Put a solid background on the child. The child covers the decoration in the middle, and the decoration only shows where the child isn't.

This trick lets you put diagonal stripes, gradients, or any background **outside** an element while still respecting the element's positioning.

```css
.section-pattern {
  --pattern-fg: rgb(0 0 0 / 0.15);
  background-image: repeating-linear-gradient(
    315deg,
    var(--pattern-fg) 0,
    var(--pattern-fg) 1px,
    transparent 0,
    transparent 50%
  );
  background-size: 10px 10px;
  background-attachment: fixed;
}
```

```astro
<section class="section-pattern section-gutter">
  <div class="container-large bg-white">
    <h1>The bg-white covers the pattern in the middle</h1>
  </div>
</section>
```

The pattern shows in the gutter columns; the white container hides it where the content is.

### Variations

| Effect | Change |
|---|---|
| Wider stripes | `background-size: 16px 16px` |
| Tighter stripes | `background-size: 6px 6px` |
| Stripes the other way | `135deg` instead of `315deg` |
| Bolder stripes | `var(--pattern-fg) 2px` instead of `1px` |
| Dots instead | `radial-gradient(circle, var(--pattern-fg) 1px, transparent 1.5px)` |

### Why use `rgb(... / opacity)` not a fixed color

Translucent colors adapt to whatever background they sit on. Light mode gets dark stripes on white; dark mode gets light stripes on dark; it just works:

```css
.section-pattern {
  --pattern-fg: rgb(0 0 0 / 0.15);
}

@media (prefers-color-scheme: dark) {
  .section-pattern {
    --pattern-fg: rgb(255 255 255 / 0.1);
  }
}
```

---

## 11. Images on Cloudflare

Astro's `<Image>` component from `astro:assets` runs images through an image service for optimization. On the Cloudflare adapter, this **defaults to Cloudflare Images** — a paid product requiring an `IMAGES` binding. Without the binding, you get blank images and `404` on `/_image?href=…` URLs.

### Fix: use sharp at build time

```js
// astro.config.mjs
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare({
    imageService: "compile",
  }),
});
```

`imageService: "compile"` runs sharp at **build time**, emitting hashed, optimized WebP files into `/_astro/`. No runtime endpoint, no Cloudflare Images binding, no service cost. PNG sources typically shrink ~90% when transcoded to WebP.

### When to use Cloudflare Images

Only if you genuinely need:
- Lots of user-uploaded photos served at the edge
- One URL for every device size/format automatically
- Centralized image storage outside your repo

For static placeholder images and a handful of marketing screenshots, build-time sharp is the right call.

---

## 12. General principles

A few cross-cutting lessons worth keeping in mind.

### Component first, CSS class second, copy-paste third

When you find yourself reusing markup, prefer extracting an Astro component over extracting a CSS class. Components encapsulate structure AND styling, take props, and grep cleanly. CSS classes only encapsulate styling — best for layout primitives like containers, not for things with structure.

### The Rule of Three

Don't extract a pattern after seeing it once or twice. **Wait until you've written it three times.** Two might be coincidence. Three confirms it's stable. This applies to CSS classes, components, and any other abstraction.

### Single responsibility for layout primitives

Each layout class should do **one thing**:
- `container-large` → horizontal cap (no padding)
- `section-gutter` → horizontal padding (no width)
- `section-padding` → vertical rhythm (nothing else)

When two classes overlap (e.g. both have `px-6`), you'll get conflicts. Split them.

### Constraints belong as close to the content as possible

Don't put `container-large` on the `<main>` in your layout — you lose the ability to opt out. Layouts are about **chrome**, not content width. Containers belong **inside** sections, not above them.

### Heuristic: if it has chrome, it's a layout. If it has structure, it's a component. Otherwise, it's utilities.

| Has its own nav, footer, sidebar? | → Layout |
| Has structure + props (button, card, hero)? | → Component |
| Just a few utilities for styling? | → Inline utilities |
| Used 3+ times with the same value? | → CSS class in `@layer components` |

---

## 13. Tailwind 4: `@utility` vs `@layer components`

Tailwind 4 introduced the `@utility` directive as the modern way to define reusable classes. It coexists with the older `@layer components { ... }` pattern, but it's the preferred shape going forward.

### The two forms

```css
/* Legacy — still works in v4 for backwards compat */
@layer components {
  .section-gutter { @apply px-4 md:px-12 lg:px-24; }
}

/* Modern v4 — top-level @utility directive */
@utility section-gutter {
  @apply px-4 md:px-12 lg:px-24;
}
```

### Why `@utility` is better

1. **Variant prefixes work.** You can write `hover:section-gutter`, `md:section-gutter`, `group-hover:section-gutter` etc. Classes defined inside `@layer components` cannot be variant-prefixed.
2. **Specificity ordering is automatic.** `@utility` participates in Tailwind's layer ordering the same way built-in utilities do.
3. **Composable with arbitrary values.** Mix `@apply` with raw CSS in the same block.

### Rules for `@utility`

- Must be a **top-level** at-rule (not nested inside `@layer`).
- Body can mix `@apply` and raw CSS properties.
- Name becomes the class name verbatim — `@utility foo` → `.foo { ... }`.

```css
@utility container-large {
  @apply mx-auto w-full max-w-7xl;
  container-type: inline-size;   /* raw CSS works alongside @apply */
}

@utility section-grid-outside {
  @apply grid grid-cols-[1fr_1rem_minmax(0,90rem)_1rem_1fr]
         md:grid-cols-[1fr_2.5rem_minmax(0,90rem)_2.5rem_1fr]
         border-y border-gray-200;
}
```

### Migration

Anywhere you currently have `@layer components { .foo { @apply ... } }`, you can flatten it to `@utility foo { @apply ... }`. Behavior is identical, plus you gain variant support.

---

## 14. Responsive arbitrary values

Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) work with arbitrary values too. The mobile-first rule applies: the **base** value targets mobile, and breakpoints scale **up** from there.

```html
<!-- 1rem gutters on mobile, 2.5rem from md (≥768px) -->
<div class="grid
  grid-cols-[1fr_1rem_minmax(0,90rem)_1rem_1fr]
  md:grid-cols-[1fr_2.5rem_minmax(0,90rem)_2.5rem_1fr]">
```

### Rule of thumb

- Default = mobile.
- Each breakpoint prefix replaces the value at that screen size and above.
- You don't need a `sm:` value if the base already works for sm.

### When to skip arbitrary values

If the same shape repeats on multiple elements, lift it to a `@utility` instead of pasting the long arbitrary expression everywhere. Arbitrary values are great for one-offs, awful when duplicated.

---

## 15. Named slots

Slots are how a component lets the caller inject markup into specific spots. There's the **default slot** (`<slot />`) for "everything passed as children," and **named slots** (`<slot name="icon" />`) for "this specific spot."

### The component side

```astro
---
// Card.astro
interface Props { eyebrow?: string; title?: string; }
const { eyebrow, title } = Astro.props;
---
<div class="card">
  <div class="header">
    <slot name="icon" />
    <span>{eyebrow}</span>
  </div>
  <h2>{title}</h2>
  <slot />                {/* default slot — anything without slot="..." */}
  <slot name="footer" />
</div>
```

### The call site

```astro
<Card eyebrow="Schema Builder" title="...">
  <svg slot="icon" class="w-6 h-6" .../>      {/* → icon slot */}
  <p>Body text</p>                              {/* → default slot */}
  <a slot="footer" href="/learn">Learn more</a> {/* → footer slot */}
</Card>
```

### The five rules

1. **Each child is routed by its own `slot="..."` attribute.** No attribute = goes to the default `<slot />`.
2. **Order in source doesn't matter.** Astro reads attributes, not positions.
3. **Multiple children can target the same slot.** They render in source order *within* that slot.
4. **Empty slots render nothing.** No empty wrapper, no whitespace. Use `gap-*` on the parent — it just collapses naturally.
5. **`slot="..."` must be on a direct child of the component.** Not nested two levels deep.

### Fallback content

```astro
<slot name="icon">
  <svg class="w-6 h-6 text-gray-300" .../><!-- placeholder shown if no icon passed -->
</slot>
```

### Wrapping multiple elements in one slot

Use `<Fragment>` (Astro's invisible wrapper) when you want multiple elements in one slot without an extra `<div>` in the output:

```astro
<Card>
  <Fragment slot="icon">
    <svg .../>
    <span class="sr-only">Schema icon</span>
  </Fragment>
</Card>
```

Or use a real `<div slot="icon">` if you actually want a wrapper element.

### ⚠️ The double-`slot` trap

If you wrap a single element in a div/Fragment AND also put `slot="..."` on the inner element, the inner one **gets stripped from the output entirely**:

```astro
{/* ❌ BROKEN — svg disappears */}
<Fragment slot="icon">
  <svg slot="icon" .../>
</Fragment>

{/* ❌ ALSO BROKEN */}
<div slot="icon">
  <svg slot="icon" .../>
</div>
```

The rule: `slot="..."` only works on **direct children of the component**. Putting it on a child of a non-component element makes Astro silently drop the element.

### The fix

For one element per slot, **don't wrap it at all** — put `slot` directly on the element:

```astro
{/* ✅ CORRECT */}
<Card>
  <svg slot="icon" .../>
</Card>
```

Wrappers are only for multi-element slots.

### Decision table

| Situation | What to write |
|---|---|
| One element in a slot | Put `slot="name"` on that element |
| Two+ elements in one slot | `<Fragment slot="name">…</Fragment>` |
| You want a real `<div>` wrapper | `<div slot="name">…</div>` |

---

## 16. Images in Astro: the five options

Astro's image pipeline only optimizes images that are **statically importable**. There are five ways to put an image on a page, with very different tradeoffs.

### Option 1 — Per-file import + `<Image />` (recommended default)

```astro
---
import { Image } from "astro:assets";
import featureOne from "../images/feature-1.webp";
---
<Image src={featureOne} alt="..." class="w-full h-auto" />
```

You import the image **as a JS module**, not a string path. Astro reads the file at build time, infers `width`/`height` (no CLS), generates optimized variants, writes a hashed URL. The `alt` attribute is **required** — Astro errors if you forget it.

**Use when:** small fixed number of images, each placed deliberately.

### Option 2 — `import.meta.glob` (bulk import a folder)

```astro
---
import { Image } from "astro:assets";

const images = import.meta.glob<{ default: ImageMetadata }>(
  "../images/*.webp",
  { eager: true }
);

function img(name: string) {
  const found = images[`../images/${name}`];
  if (!found) throw new Error(`Image not found: ${name}`);
  return found.default;
}

const features = [
  { eyebrow: "Schema Builder", image: "feature-1.webp" },
  { eyebrow: "API First",      image: "feature-2.webp" },
];
---

{features.map((f) => (
  <Image src={img(f.image)} alt={f.eyebrow} />
))}
```

**Use when:** you want to drive cards from a data array. Adding a new card = drop file in folder, add row to array.

`{ eager: true }` actually loads them now (not as lazy promises).

> [!WARNING]
> While `{ eager: true }` is perfect for a few dozen features or gallery images, **do not use it for massive directories** (e.g. 500+ images). It forces the bundler to process and hold all of them in memory simultaneously at build-time, which can aggressively spike memory usage. For large collections, use Content Collections (Option 3) instead.

### Option 3 — Content collections (the structured-content answer)

```ts
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const features = defineCollection({
  type: "data",
  schema: ({ image }) => z.object({
    eyebrow: z.string(),
    title: z.string(),
    image: image(),   // ← string path in JSON, ImageMetadata at runtime
  }),
});

export const collections = { features };
```

```astro
---
import { getCollection } from "astro:content";
import { Image } from "astro:assets";

const features = await getCollection("features");
---

{features.map(({ data }) => (
  <Image src={data.image} alt={data.title} />
))}
```

**Use when:** content has structure, will grow over time, or needs to be edited like a CMS. This is the "real production" answer.

### Option 4 — `public/` folder (no optimization)

```astro
<!-- file at public/images/feature-1.webp -->
<img src="/images/feature-1.webp" alt="..." />
```

**Use only for:** favicons, robots.txt, OG images referenced from `<head>`, third-party scripts that need stable filenames. **Don't use** for regular page images — you give up the entire image pipeline.

### Option 5 — Remote images

```astro
<Image
  src="https://cdn.example.com/feature-1.webp"
  alt="..."
  width={1200}
  height={630}
  inferSize
/>
```

`width`/`height` are required because Astro can't read remote files. Whitelist the domain in `astro.config.mjs` if you want the image service to proxy it.

**Use when:** images live in a CMS, image CDN, or any URL you don't control as a build input.

### Decision tree

| Situation | Use |
|---|---|
| 1–5 specific images, each placed deliberately | Option 1 |
| Many images driven by a data array | Option 2 |
| Content that grows, has structure, multiple authors | Option 3 |
| Files Astro shouldn't touch (favicons, downloads) | Option 4 |
| Hosted somewhere else | Option 5 |

### Common mistakes

1. **`<image>` (lowercase) is an SVG element, not HTML.** The HTML element is `<img>`. The Astro component is `<Image />` (capital I).
2. **String paths in `src=` won't work for `src/` files.** Browser-side resolution happens after build, where `src/` doesn't exist. Always import.
3. **Forgetting the import after moving an image to the call site.** If you move `<Image src={featureOne} />` from a component to the page, you must move both the `Image` import and the `featureOne` import.

---

## 17. Flattening nested divs

When you see a stack of divs where each one's only child is the next div, ask: *what would break if I merged this div into its parent or its child?* If the answer is "nothing visible," merge it.

### Example

```html
<!-- Before: 3 nested divs to render an icon + label -->
<div class="text-sm">
  <div class="flex items-center gap-2">
    <div class="flex items-center w-6 h-6 text-gray-500">
      <svg .../>
    </div>
    <span>Schema Builder</span>
  </div>
</div>
```

```html
<!-- After: 1 div, same render -->
<div class="flex items-center gap-2 text-sm">
  <svg class="w-6 h-6 text-gray-500" .../>
  <span>Schema Builder</span>
</div>
```

What changed: the outer "text-sm" wrapper merged into the flex row, and the icon's wrapper div was deleted (its sizing/color moved directly onto the SVG).

### Why flatten

- **Less to read.** The intent ("icon next to a word") becomes obvious at a glance.
- **Single source of truth.** No more `w-6 h-6` on a wrapper conflicting with `size-5` on the SVG.
- **Smaller DOM.** Negligible perf-wise but matters on huge pages.
- **Fewer places for styles to live.** Future you only changes one element.

### When NOT to flatten

A wrapper div is **earning its keep** if it's doing one of these:

- Establishing a containing block (e.g. `relative` so an absolutely-positioned child anchors to it)
- Creating a stacking/scroll/transform context the children need
- Being a flex/grid item with its own sizing while the children speak a different layout language
- Carrying a semantic role or ARIA attribute

If none of those apply, the wrapper is just styling noise — collapse it.

---

## 18. Optional content: slot vs prop vs variant

When part of a component is *sometimes there and sometimes not* (e.g. a card with an optional image), the question is which API to use. The wrong answer is almost always a `variant` prop.

### The heuristic

| Question | Answer |
|---|---|
| "This part exists or doesn't" | Optional slot or optional prop |
| "This part looks different" | Variant prop |
| "Whole layout is different" | Two components, or one with a layout-switching variant |

**Variants encode style, not presence.** If your variant prop's only job is "should this thing render," delete the variant and just check the thing.

### Option A — optional slot (most flexible)

```astro
---
// Card.astro
const { eyebrow, title } = Astro.props;
---
<div class="card">
  <span>{eyebrow}</span>
  <h2>{title}</h2>
  <slot name="media" />   {/* renders nothing if caller passes nothing */}
</div>
```

```astro
{/* with image */}
<Card eyebrow="..." title="...">
  <Image slot="media" src={featureOne} alt="..." />
</Card>

{/* without image — just don't pass the slot */}
<Card eyebrow="..." title="..." />
```

**Win:** the caller controls *what* media renders. Today image, tomorrow video, next week embed. Card never has to know.

### Option B — optional prop (more compact call site)

```astro
---
import type { ImageMetadata } from "astro";
import { Image } from "astro:assets";
interface Props { image?: ImageMetadata; imageAlt?: string; }
const { image, imageAlt = "" } = Astro.props;
---
<div class="card">
  ...
  {image && <Image src={image} alt={imageAlt} />}
</div>
```

**Win:** typed, terse call site, card owns image rendering for consistency. **Loss:** locks you into images — switching to video means changing the API.

### What NOT to do

```astro
{/* ❌ DON'T */}
interface Props {
  variant?: "with-image" | "no-image";
  image?: ImageMetadata;
}
{variant === "with-image" && <Image src={image} ... />}
```

Two sources of truth (`variant` and `image`) that can disagree. The variant adds zero information the prop doesn't already encode.

### Rule

When in doubt, use a slot. Slots scale to anything; props lock you into a type; variants lock you into a style.

---

## 19. Component prop pitfalls

When you add a new prop to a component, four things must all be true. Skip any one and the prop silently does nothing — Astro accepts unknown attributes without error, so there's no feedback that you broke it.

### The four-step checklist

1. **Add the prop to the `Props` interface** (with the right type).
2. **Destructure it from `Astro.props`** (otherwise it's not even read).
3. **Use the destructured variable** somewhere in the template or computations.
4. **Pass it from the call site with the exact same name** (props are case-sensitive).

If any step is missing, the prop becomes a no-op.

### Real bug from the conversation

```astro
---
interface Props {
  padding?: "xs" | "sm" | "md" | "lg" | "xl";
  contentClass?: string;
}
const { id, padding = "md", contentClass = "" } = Astro.props;

// Author wanted: a way to disable inner horizontal padding.
// What they wrote:
const contentPaddingClass = {
  none: "px-0",
  xs: "px-6",
  sm: "px-6",
  md: "px-6",
  lg: "px-6",
  xl: "px-6",
}[padding];   // ← keyed by `padding`, not by a new prop
---
```

```astro
{/* Call site */}
<SectionMain padding="sm" contentPaddingClass="none" paddingContent="none">
```

**Four bugs at once:**

1. The `none` key is **dead code**. `padding` can never be `"none"` because the type doesn't allow it. The lookup is always reached with one of `xs|sm|md|lg|xl`, so it always returns `"px-6"`.
2. `contentPaddingClass` is a **local variable**, not destructured from props. The call site's `contentPaddingClass="none"` is silently ignored.
3. `paddingContent="none"` is a **typo** — neither prop name exists in `Props`. Astro accepts it silently. Two non-functional props on one tag.
4. **TypeScript can't catch any of this** because none of the prop names are in the `Props` interface in the first place.

### The fix

Don't try to encode "an opt-out for X" as a magic value of an existing prop. **Add a new prop** with its own type:

```astro
---
interface Props {
  id?: string;
  padding?: "xs" | "sm" | "md" | "lg" | "xl";
  contentPadding?: "none" | "default";   // ← new prop, separate from padding
  contentClass?: string;
}
const {
  id,
  padding = "md",
  contentPadding = "default",            // ← destructured
  contentClass = "",
} = Astro.props;

const paddingClass = {
  xs: "section-padding-xs",
  sm: "section-padding-sm",
  md: "section-padding-md",
  lg: "section-padding-lg",
  xl: "section-padding-xl",
}[padding];                               // ← keyed by padding (vertical)

const contentPaddingClass = {
  none: "px-0",
  default: "px-6",
}[contentPadding];                        // ← keyed by contentPadding (horizontal)
---
```

```astro
<SectionMain padding="sm" contentPadding="none">
```

Now `padding` controls vertical rhythm and `contentPadding` controls inner horizontal padding, fully independent. You can write `padding="lg" contentPadding="none"` and it does exactly what it says.

### The general lesson

**One prop, one responsibility.** When you find yourself reaching for a magic value (`padding="none"` should also kill horizontal padding), that's a smell — you're coupling two concerns into one knob. Split them.

This is the same single-responsibility rule you apply to CSS classes (`section-padding-*` only does `py-*`, `section-gutter` only does `px-*`). Apply it to props too.

### Debugging silent prop failures

If you pass a prop and nothing changes, work the four-step checklist in order:

1. Is the prop name in `Props`?
2. Is it destructured from `Astro.props`?
3. Is the destructured variable actually used somewhere?
4. Is the spelling identical at the call site?

90% of "this prop isn't working" bugs are step 2 or step 4.

---

## 20. The shared-border pattern

When you have stacked items that should look like one connected block (cards in a grid, sections in a page, rows in a table, items in a list), naively giving each item its own border causes **double borders** at every shared edge — 1px from item A's bottom plus 1px from item B's top = 2px line.

The fix is the same every time: **wrapper owns the outer frame, children contribute zero borders**.

### The pattern

```html
<div class="border-y divide-y divide-gray-200 border-gray-200">
  <Item />   <!-- no border -->
  <Item />   <!-- no border -->
  <Item />   <!-- no border -->
</div>
```

What each piece does:
- **`border-y`** on the wrapper draws the outer top + bottom edges (first item's top, last item's bottom).
- **`divide-y`** on the wrapper adds `border-top: 1px` to all *direct children except the first* — exactly one 1px line between every pair.
- **Items themselves have no borders.** They contribute zero, the wrapper contributes everything.

Result: single 1px lines on every edge, no doubles, anywhere.

### Two-dimensional grids

Same pattern for grids — combine `divide-x` and `divide-y`:

```html
<div class="grid grid-cols-2 border border-gray-200 divide-x divide-y divide-gray-200">
  <Card border="none" />
  <Card border="none" />
  <Card border="none" />
  <Card border="none" />
</div>
```

`border` on the wrapper → outer rectangle. `divide-x divide-y` → grid lines between cells. Cards contribute nothing.

### Responsive grids

If your grid only splits at `md`, the column divider should only activate at `md`:

```html
<div class="grid grid-cols-1 md:grid-cols-2 border-y border-gray-200 md:divide-x md:divide-gray-200">
```

On mobile (1 column), only the wrapper's top + bottom show. At `md` (2 columns), a vertical divider appears between them. If you want a divider between the *stacked* mobile rows too, add `divide-y md:divide-y-0` so it's on for mobile and off for `md`.

### Component side: support `border="none"`

Give your reusable item component a `border` prop so the wrapper pattern is one line at the call site:

```astro
---
interface Props {
  border?: "all" | "y" | "x" | "none";
}
const { border = "all" } = Astro.props;
const borderClass = {
  all:  "border border-gray-200",
  y:    "border-y border-gray-200",
  x:    "border-x border-gray-200",
  none: "",
}[border];
---
<div class:list={["px-6 pt-8 pb-0", borderClass]}>
  <slot />
</div>
```

Default to `"all"` so existing usage keeps working. Pass `border="none"` when the wrapper owns the frame.

### Same pattern, different scopes

This pattern applies anywhere "items in a line should look like one connected block":

| Scope | Wrapper | Children |
|---|---|---|
| Cards in a grid | `border-y md:divide-x` on the grid | `border="none"` on each card |
| Sections in a page | `border-y divide-y` on `<main>` | no borders on the section |
| Accordion rows | `divide-y` on the accordion | no borders on each row |
| Sidebar nav groups | `divide-y` on the sidebar | no borders on each group |
| Table rows | `divide-y` on `<tbody>` | no borders on `<tr>` |

Once you see it, you'll use it constantly. **It's the canonical "shared-edge" answer in Tailwind.**

### Gotcha: `divide-y` only affects direct children

`divide-y` adds borders to *direct children* of the element it's on. If you wrap your items in another element (e.g. a flex container inside the grid), the divider runs between the wrong things. Either keep items as direct children or move `divide-y` onto a dedicated div.

Also: `divide-y` runs between **all** direct children, not just same-type ones. If `<main>` has `<aside>` + `<section>` siblings, the divider will run between them too. Move `divide-y` onto a dedicated container if you only want it between specific items.

---

## 21. `class:list` directive

When you build a className from multiple fragments — base classes + variant classes + conditional classes — Astro has a special directive that's cleaner than template strings.

### Template string vs `class:list`

```astro
{/* template string — works but verbose, brittle with falsy values */}
<div class={`px-6 pt-8 pb-0 ${borderClass} ${extraClass}`}>

{/* class:list — handles arrays, objects, falsy values */}
<div class:list={["px-6 pt-8 pb-0", borderClass, extraClass]}>
```

### What `class:list` accepts

```astro
<div class:list={[
  "always-on",                          {/* string literal */}
  borderClass,                          {/* string variable */}
  isActive && "ring-2 ring-blue-500",   {/* conditional — falsy is dropped */}
  { "opacity-50": isDisabled },         {/* object — keys included when value is truthy */}
  ["nested", "arrays", "work"],         {/* arrays flatten */}
]}>
```

It outputs a clean, deduplicated, space-separated string. Falsy values (`false`, `null`, `undefined`, `""`) are silently dropped — no need to ternary `: ""`.

### Why prefer it

1. **No empty-string artifacts.** Template strings produce `class="px-6  px-0"` (double space) when a fragment is empty. `class:list` skips empties.
2. **Conditional classes are first-class.** No nested `${cond ? "a" : ""}` ternaries.
3. **Composes with array spread.** Useful when a parent passes a list of extra classes via props.
4. **Idiomatic Astro.** Same convention as `client:load`, `set:html`, etc.

### When to use what

| Situation | Use |
|---|---|
| Static classes only | `class="..."` |
| One or two interpolated variables | template string or `class:list` |
| Multiple fragments, conditionals, or maybe-empty values | `class:list` |
| Spreading from props | `class:list` |

`class:list` doesn't replace `class=`; both work side by side. Use whichever reads cleaner for the situation.

### Conditional classes — three forms

When you want a class to appear *only* when some condition is true, there are three idiomatic ways to write it inside `class:list`. All three produce the same output:

```astro
<div class:list={[
  "base",
  borderTop && "border-t border-gray-200",       {/* short-circuit && */}
  borderTop ? "border-t border-gray-200" : "",   {/* ternary */}
  { "border-t border-gray-200": borderTop },     {/* object form */}
]}>
```

#### How `&&` short-circuit works

`a && b` is JavaScript shorthand for "evaluate `a`; if it's truthy, return `b`; otherwise return `a`." It returns the value, not just `true`/`false`:

```ts
true  && "border-t border-gray-200"   // → "border-t border-gray-200"
false && "border-t border-gray-200"   // → false
```

So `borderTop && "border-t"` evaluates to the string when `borderTop` is true, and to `false` when it's false. `class:list` automatically drops the `false` — that's why this pattern works without an explicit `: ""`.

#### Which form when

- **`&&`** for "one class, one condition" — terse and the most common in real code.
- **Ternary** when you need *either A or B* (not on/off): `cond ? "a" : "b"`.
- **Object form** for "many classes, many conditions" — keeps everything aligned in a column:
  ```astro
  class:list={[
    "btn",
    {
      "bg-blue-500": variant === "primary",
      "bg-gray-200": variant === "secondary",
      "opacity-50":  isDisabled,
      "ring-2":      isFocused,
    },
  ]}
  ```

#### Gotcha: `&&` outside `class:list`

`&&` short-circuits on **all** falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Inside `class:list` this is fine — falsy values are dropped. But in render contexts, `0` is dangerous:

```jsx
{count && <span>{count} items</span>}   {/* ❌ renders "0" when count is 0 */}
{count > 0 && <span>{count} items</span>} {/* ✅ explicit comparison */}
```

Always use an explicit comparison when the value could legitimately be `0` or `""` and you don't want it rendered.

### Class conflicts — internal vs passed classes

When a component hardcodes a class internally and the caller passes a conflicting class via the `class` prop, **the order in your class string doesn't decide the winner.** CSS specificity and source order in Tailwind's compiled stylesheet do.

```astro
<!-- HeroCanvas.astro — component internals -->
<div class:list={["relative overflow-hidden", className]}>
```

```astro
<!-- index.astro — caller passes absolute -->
<HeroCanvas class="absolute inset-0 h-full w-full" />
```

```html
<!-- Rendered HTML — both position utilities on the same element -->
<div class="relative overflow-hidden absolute inset-0 h-full w-full">
```

You might expect `absolute` to win because it appears later in the class attribute. But Tailwind doesn't care about left-to-right order. Both `relative` and `absolute` have identical CSS specificity (one class each), so whichever rule is defined later in Tailwind's generated stylesheet wins. In this case `relative` happens to come after `absolute` in the output, so `relative` wins — and the element stays in flow, pushing content down instead of overlaying it.

**The rule:** never put conflicting CSS utilities on the same element. If a component hardcodes `relative` internally, passing `absolute` from outside won't override it.

**The fix:** keep a component's internal classes neutral — only include what the component *always* needs (like `overflow-hidden`). Let the caller control positioning, sizing, and other context-dependent concerns via the `class` prop.

```astro
<!-- Good — component stays neutral about positioning -->
<div class:list={["overflow-hidden", className]}>

<!-- Bad — hardcoded relative fights any absolute passed from outside -->
<div class:list={["relative overflow-hidden", className]}>
```

This applies to any pair of Tailwind utilities that target the same CSS property: `relative` vs `absolute`, `block` vs `hidden`, `bg-white` vs `bg-blue-500`, etc. If two utilities set the same property, only one can win — and the winner is decided by the stylesheet, not your class string.

---

## 26. Icons with `astro-icon`

Inline `<svg>` blocks are fine for one-offs but get noisy fast — every icon is 10–20 lines of `<path>` data sitting in your markup, and reusing one means copy-pasting the whole block. The cleanest pattern is to **reference icons by name** the same way you reference images by import.

### The three approaches

| Approach | Best for |
|---|---|
| **Native SVG import** (`import Star from './star.svg'`) | A handful of project-specific custom icons |
| **`astro-icon` + Iconify** | Almost everything else — name-based, huge catalog, tree-shaken |
| **Manual `import.meta.glob` wrapper** | When you want zero dependencies and only local SVGs |

`astro-icon` is the de-facto standard. It gives you the entire Iconify catalog (200,000+ icons across ~150 sets — Lucide, Heroicons, Material, Phosphor, simple-icons brand logos, etc.) and only ships the ones you actually use.

### Install

```bash
npm i astro-icon
npm i -D @iconify-json/lucide   # pick one or more icon sets
```

The `@iconify-json/*` packages are dev dependencies. They live in `node_modules` (the Lucide set is ~5 MB on disk) but **none of that ships to the browser**. The build statically scans your components for `<Icon name="...">` usages and inlines only the matching SVGs into the HTML output.

### Configure

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [icon()],
  vite: { plugins: [tailwindcss()] },
});
```

### Use

```astro
---
import { Icon } from 'astro-icon/components';
---
<Icon name="lucide:database" class="w-6 h-6 text-gray-500" />
<Icon name="lucide:zap"      class="w-6 h-6 text-blue-500" />
<Icon name="lucide:settings-2" class="w-6 h-6" />
```

The format is `setname:icon-name`. Browse the catalog at <https://icones.js.org> — every icon has a copy-name button.

Because the icons are inlined as real SVG (not background images or icon fonts), all the usual CSS works: `text-*` controls `currentColor`, you can size with `w-*`/`h-*`, animate with `transition`, etc.

### Local custom icons

Drop your own SVGs into `src/icons/` and reference them without a prefix:

```astro
<Icon name="my-logo" class="h-8" />
```

Mix freely with Iconify icons in the same project.

### The "only used icons ship" guarantee

This is the killer feature, but it depends on **static analysis**. The build scans for `<Icon name="literal-string" />`. As long as the name is a string literal, the build can see it and include just that one icon.

```astro
{/* ✅ build can see "lucide:database" — bundled */}
<Icon name="lucide:database" />

{/* ❌ build can't tell which icon — won't work */}
<Icon name={iconName} />
<Icon name={`lucide:${kind}`} />
```

If you need dynamic icons (e.g. driven by CMS data), the workaround is to map possible values to literal names in a lookup object — same pattern as the variant components in §6:

```astro
---
const iconMap = {
  database: "lucide:database",
  bolt: "lucide:zap",
  gear: "lucide:settings-2",
};
---
<Icon name={iconMap[item.icon]} />
```

The build still sees all three literal names in the source, so all three get bundled. You're just choosing between them at runtime.

### Before / after

Before — one card icon as inline SVG:

```astro
<svg
  slot="icon"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class="w-6 h-6 text-gray-500"
>
  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
</svg>
```

After:

```astro
<Icon slot="icon" name="lucide:layers" class="w-6 h-6 text-gray-500" />
```

Same visual result. Swapping icons becomes a one-word change. Adding a new card with a different icon doesn't drag in another 16 lines of `<path>` data.

### When *not* to reach for `astro-icon`

- You need **one** icon, ever → just paste the SVG inline.
- You're shipping a single brand logo → import the SVG file directly.
- The icon is part of a larger illustration with custom art → keep it as a real SVG file under `src/images/` and use Astro's `<Image>` or native SVG import.

For everything else — UI affordances, feature cards, nav icons, form controls — `astro-icon` is the low-friction default.

---

## 27. Fluid typography with container queries

The goal: headings and body text that scale smoothly between a min and max size — without breakpoint hops — and that stay **accessible** when users zoom or bump their default font size. The modern, proper way to do this in Tailwind 4 is **`clamp()` + `cqi` units + `rem` anchors**.

### Why not `vw`?

The naive version uses viewport units:

```css
font-size: clamp(2.5rem, 5vw + 1rem, 5.5rem);
```

Two problems:

1. **`vw` ignores user zoom and the root font size.** When a user cranks browser zoom or sets a larger default font (a primary accessibility need — WCAG 1.4.4), `vw` barely responds, because the viewport *in CSS pixels* stays roughly the same. The text grows less than the user asked for.
2. **`vw` is tied to the window, not the content.** If a heading lives inside a 600px sidebar on a 1920px screen, `5vw` gives you 96px — enormous for that box. The text doesn't know about its container.

### The modern fix: `cqi` + `rem` anchors

`cqi` = "1% of the nearest query container's inline size." Combine that with `rem` floor/ceiling and you get type that:

- **Responds to the container**, not the window (fixes the sidebar problem).
- **Scales with user zoom** (because `rem` scales with the root font size).
- **Interpolates linearly** between two anchor points — predictable, not jumpy.

The pattern:

```css
font-size: clamp(MIN_rem, INTERCEPT_rem + SLOPE_cqi, MAX_rem);
```

For anchors *(container 20rem → MIN)* and *(container 90rem → MAX)*:

```
slope      = (MAX - MIN) / 70
intercept  = MIN - slope * 20
slope_cqi  = slope * 100     ← the number before "cqi"
```

That's just the equation of a line, `y = mx + b`, where x is container width in rem and y is font-size in rem. `clamp()` pins the output between the two anchors so it never overshoots.

### Making `<body>` a query container by default

`cqi` only works if *some* ancestor has `container-type: inline-size`. If you don't set one, `cqi` silently evaluates to `0` and your text collapses to the `min`. The cleanest fix is to make `<body>` itself a query container:

```css
@layer base {
  body {
    container-type: inline-size;
  }
}
```

One line, global effect. Every descendant now has a valid ancestor for `cqi` to resolve against — no wrapper required. `<body>` already behaves independently of its children's width, so there's no layout surprise.

### Independent clamps per heading

Design systems usually want each heading tuned individually (different scale jumps, different letter-spacing, different line-heights). So skip the "modular scale calculator" abstraction and write one `@utility` per size, each with its own pre-computed `clamp()`:

```css
/* ----- H1: 2.75rem → 5.25rem  (44 → 84px) ----- */
@utility h1 {
  font-family: var(--font-sans);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.045em;
  font-size: clamp(2.75rem, 2.0357rem + 3.5714cqi, 5.25rem);
  text-wrap: balance;
}

/* ----- H2: 2rem → 3.5rem  (32 → 56px) ----- */
@utility h2 {
  font-family: var(--font-sans);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-size: clamp(2rem, 1.5714rem + 2.1429cqi, 3.5rem);
  text-wrap: balance;
}

/* ----- H3: 1.5rem → 2.25rem  (24 → 36px) ----- */
@utility h3 {
  font-family: var(--font-sans);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-size: clamp(1.5rem, 1.2857rem + 1.0714cqi, 2.25rem);
  text-wrap: balance;
}
```

Do the same for `h4`, `h5`, `h6`, and body sizes (`text-body-xl` → `text-body-sm`). Comment each one with its MIN/MAX in rem *and* px — you'll want to retune later and the comment is the spec.

### Why `@utility`, not `@layer components`

Because these are real utilities, variants work:

```astro
<h2 class="h2 md:h1">Bigger on desktop</h2>
```

If you wrapped the same rules in `@layer components`, the `md:h1` variant would silently do nothing. See section 13 for the full comparison.

### The escape hatch: `cq` for nested re-anchoring

Sometimes you want type inside a card or sidebar to size to **the card**, not the page. Add a one-line utility:

```css
@utility cq {
  container-type: inline-size;
}
```

Now drop `cq` onto any element and its descendants' fluid type re-anchors to that element's width:

```astro
<article class="cq rounded-lg p-6 bg-white">
  <h3 class="h3">Sized to the card, not the page</h3>
  <p class="text-body-md">Shrink the card → this shrinks with it.</p>
</article>
```

Rule: **nearest query-container ancestor wins.** With `<body>` as the default and `cq` as the opt-in override, you get the right behavior in both directions without repeating `container-type` across every utility.

### How to retune later

Pick new MIN and MAX, then recompute:

```
slope      = (MAX - MIN) / 70
intercept  = MIN - slope * 20
slope_cqi  = slope * 100
```

e.g. to make `h2` range `2.25rem → 4rem`:

- slope = 1.75 / 70 = 0.025
- intercept = 2.25 − (0.025 × 20) = 1.75
- slope × 100 = 2.5
- → `clamp(2.25rem, 1.75rem + 2.5cqi, 4rem)`

### Gotchas

1. **No query container = collapse to MIN.** If you remove `container-type` from `<body>` and forget to add one elsewhere, every fluid size quietly pins to its floor value. Debug: in DevTools, check whether an ancestor actually has `container-type: inline-size`.
2. **`container-type: inline-size` creates containment.** The element can no longer size its block-axis based on its children's *inline* size. For `<body>` and normal block containers this is already how they work. Don't slap it on flex/grid items without testing.
3. **`cqi` ≠ `@container` queries.** You can use `cqi` units without ever writing a `@container (min-width: ...)` rule. They share the container mechanism but are independent features. Fluid type only needs `cqi`.
4. **Anchor choice matters per context.** A 20rem → 90rem range assumes a page-sized container. Inside a card that's never wider than 40rem, the MAX anchor is unreachable. Consider tighter anchors (or a component-specific utility) when the container is much narrower than a page.
5. **`vw` vs `cqi` accessibility difference is real.** At 200% browser zoom, a `rem` floor of `2.75rem` becomes `88px`. A `vw`-only middle term barely budges. Always anchor with `rem`.

### The mental model

Three layers stack cleanly:

1. **Tokens** (`@theme`) — raw values: fonts, colors, spacing. Not fluid. Tailwind generates utilities from these.
2. **Query containers** — `container-type: inline-size` on `<body>` by default, plus a `cq` utility to re-anchor when needed.
3. **Fluid utilities** (`@utility h1 { clamp(...) }`) — the type scale, expressed as interpolations between rem anchors driven by `cqi`.

Once you see it as three layers, a file full of `clamp()` expressions stops looking like a pile of math and starts looking like a small, coherent system.

---

## 28. Theme management (light & dark)

Tailwind 4 changed how dark mode works compared to v3. The old `darkMode: 'class'` config in `tailwind.config.js` is gone — everything is CSS-first now. The whole system rests on one idea: **components reference semantic tokens; themes redefine those tokens.** Components don't know which theme is active.

### The mental model

Three layers, same shape as fluid type:

1. **Semantic tokens** (`--color-bg`, `--color-fg`, `--color-border`, `--color-intent`...) — the *role*, not the value. Components only use these.
2. **Theme definitions** — light and dark each redefine the semantic tokens to point at different raw values.
3. **A switch mechanism** — system preference, a class on `<html>`, or both.

The mistake to avoid: writing `bg-zinc-900` in a Card component. If you do that, switching themes is 500 search-and-replaces. Write `bg-panel` instead and switching themes is one place.

### Step 1 — Semantic tokens in `@theme`

```css
@theme {
  /* Semantic color roles — not raw values */
  --color-bg:           #ffffff;   /* page background */
  --color-bg-elevated:  #f9fafb;   /* cards, panels */
  --color-bg-sunken:    #f3f4f6;   /* inputs, wells */

  --color-fg:           #0a0a0a;   /* primary text */
  --color-fg-muted:     #4b5563;   /* secondary */
  --color-fg-subtle:    #9ca3af;   /* tertiary, captions */

  --color-border:        #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-intent:    #6366f1;
  --color-fg-on-intent: #ffffff;     /* text ON primary */
}
```

These auto-generate utilities: `bg-canvas`, `bg-panel`, `text-fg`, `text-fg-muted`, `border-stroke`, `bg-intent`, `text-fg-on-intent`. Tailwind strips the `--color-` prefix when generating the utility name.

**Always pair backgrounds with foregrounds.** `--color-intent` + `--color-fg-on-intent` lets you write `bg-intent text-fg-on-intent` and never wonder which text color contrasts with the brand.

### Step 2 — Pick a switching pattern

Three options. They stack — pick the one that matches your needs.

#### Pattern A — System preference only

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:           #0a0a0a;
    --color-bg-elevated:  #18181b;
    --color-fg:           #fafafa;
    --color-fg-muted:     #a1a1aa;
    --color-border:       #27272a;
    --color-intent:      #818cf8;
    --color-fg-on-intent:   #0a0a0a;
  }
}
```

Pros: zero JS, respects OS, no FOUC. Cons: user can't override the OS choice.

#### Pattern B — Class-based override (manual toggle)

In v4 you opt into class-based dark mode with `@custom-variant`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

That registers a `dark:` variant that activates when an ancestor has `.dark`. Then scope your overrides to a class on `<html>`:

```css
.dark {
  --color-bg:          #0a0a0a;
  --color-bg-elevated: #18181b;
  --color-fg:          #fafafa;
  --color-border:      #27272a;
  --color-intent:     #818cf8;
  --color-fg-on-intent:  #0a0a0a;
}
```

Important: theme overrides are **regular CSS**, not inside `@theme`. `@theme` is the *defaults* block; overrides redeclare custom properties further down the cascade. Tailwind's generated utilities reference the variables, so when the variables change, the utilities follow automatically.

#### Pattern C — Both (recommended for production)

Default to system, let a class override. Three states: `auto` (no class), `light` (forced), `dark` (forced).

```css
/* Defaults — light */
@theme {
  --color-bg: #ffffff;
  --color-fg: #0a0a0a;
}

/* Auto: respect OS dark preference */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0a0a0a;
    --color-fg: #fafafa;
  }
}

/* Manual overrides win over OS */
:root.light { --color-bg: #ffffff; --color-fg: #0a0a0a; }
:root.dark  { --color-bg: #0a0a0a; --color-fg: #fafafa; }
```

Store the user's choice in `localStorage` so it persists across visits.

### Step 3 — Avoid the FOUC

If you toggle dark mode in JS *after* the page renders, the user sees a white flash before the switch. Fix: a tiny **inline blocking script in `<head>`** that runs before paint.

In `Layout.astro`:

```astro
<head>
  <!-- ...other head tags... -->
  <script is:inline>
    (() => {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored ?? (prefersDark ? "dark" : "light");
      document.documentElement.classList.add(theme);
    })();
  </script>
</head>
```

Three things matter:

1. **`is:inline`** — Astro ships this verbatim, doesn't bundle it, runs synchronously.
2. **It must be in `<head>` before the body renders.**
3. **It reads localStorage first, falls back to system preference.**

> [!CAUTION]
> If you deploy to an environment with a strict **Content Security Policy (CSP)** that blocks `unsafe-inline` scripts, this snippet will be blocked. In such strict security environments, you must either supply a cryptographic nonce/hash for this script block or accept the fallback FOUC.

This is the single most important detail for theme polish. Without it, every dark-mode user sees a white flash on every page load.

### Step 4 — `color-scheme` for native UI

Add this so native form controls and scrollbars also adapt:

```css
.light { color-scheme: light; }
.dark  { color-scheme: dark; }
```

Without this, scrollbars and `<input>` controls stay light even when your CSS goes dark.

### Step 5 — Components stay theme-agnostic

Once tokens are defined, components don't think about themes:

```astro
<article class="bg-panel text-fg border border-stroke rounded-lg p-6">
  <h3 class="h3 text-fg">Card title</h3>
  <p class="text-body-md text-fg-muted">Subtitle</p>
  <button class="bg-intent text-fg-on-intent px-4 py-2 rounded">
    Action
  </button>
</article>
```

**No `dark:` variants anywhere.** The tokens do the work. Reach for `dark:` only when something needs to be *structurally* different in dark mode (swap an image, hide a logo variant, change a border style):

```astro
<img src="/logo-light.svg" class="dark:hidden" />
<img src="/logo-dark.svg" class="hidden dark:block" />
```

### Step 6 — The toggle button

```astro
<button
  type="button"
  aria-label="Toggle theme"
  onclick="
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    root.classList.remove('dark', 'light');
    root.classList.add(isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  "
  class="p-2 rounded-md hover:bg-panel"
>
  <Icon name="lucide:sun" class="w-5 h-5 hidden dark:block" />
  <Icon name="lucide:moon" class="w-5 h-5 block dark:hidden" />
</button>
```

For a three-state toggle (`auto` / `light` / `dark`), use a small dropdown or segmented control instead.

### Common gotchas

1. **Don't put theme overrides inside `@theme`.** `@theme` is the defaults block. Overrides are regular CSS that redeclares the variables on `:root`, `.dark`, etc.
2. **`@custom-variant dark` is required.** Without it, the `dark:` variant doesn't exist in v4. (In v3 it was implicit; v4 made it opt-in.)
3. **Always pair backgrounds with foregrounds.** Without `--color-fg-on-intent`, you'll guess text colors per component and get inconsistencies.
4. **Test contrast in both themes.** A `--color-fg-muted` that passes WCAG AA on white might fail on near-black.
5. **Don't reference raw palette names in components.** No `bg-zinc-900 dark:bg-zinc-100`. That defeats the entire point — go through semantic tokens.

### Beyond light/dark — multi-theme

The same pattern handles brand themes, customer themes, etc. Just stack classes:

```css
:root.theme-ocean       { --color-intent: #0ea5e9; --color-bg: #f0f9ff; }
:root.theme-forest      { --color-intent: #16a34a; --color-bg: #f0fdf4; }
:root.theme-ocean.dark  { --color-intent: #38bdf8; --color-bg: #082f49; }
```

Two orthogonal axes (brand × light/dark) compose by stacking classes on `<html>`. Same toggle pattern, same FOUC prevention, same component code.

### This starter's setup — three modes via `data-theme`

The starter uses a single-axis `[data-theme="..."]` attribute instead of stacked classes. Three modes:

- **`light`** — default palette (matches the `@theme` values).
- **`dark`** — inverse palette.
- **`brand`** — brand palette (currently dark-leaning, differentiated over time by `--color-intent`, `--pattern-stripe`, etc.).

The whole contract fits in six pieces inside `src/styles/global.css`. Here's each piece, in order.

#### 1. Register one variant per mode

Tailwind v4 needs `@custom-variant` to create `dark:` / `brand:` utility prefixes. Each mode gets its own, so `dark:bg-panel` fires only under dark and `brand:bg-panel` only under brand — they don't leak across modes.

```css
@import "tailwindcss";

@custom-variant dark  (&:where([data-theme="dark"],  [data-theme="dark"]  *));
@custom-variant brand (&:where([data-theme="brand"], [data-theme="brand"] *));
```

Light doesn't need a variant — it's the default, so bare utilities (`bg-panel`, `text-fg`) already describe it.

#### 2. Define the light palette as the default inside `@theme`

`@theme` is the *defaults* block. Everything you put here becomes a utility (`--color-canvas` → `bg-canvas`) and also feeds the cascade when no theme override is active.

```css
@theme {
  /* Semantic roles — light defaults */
  --color-canvas: #f3f3f3;
  --color-panel: #f9f9f9;
  --color-panel-muted: #ebebeb;

  --color-fg: #0a0a0a;
  --color-fg-muted: #525252;
  --color-fg-subtle: #8a8a8a;
  --color-fg-on-intent: #ffffff;

  --color-intent: #0a0a0a;
  --color-intent-hover: #1a1a1a;

  --color-stroke: #d7d7d7;
  --color-stroke-strong: #bdbdbd;
  --color-focus: #0a0a0a;

  --color-error: #dc2626;
  --color-success: #16a34a;

  /* Theme-aware decorative tokens flip per mode too */
  --pattern-stripe: rgb(0 0 0 / 0.08);

  /* Shadows flip per mode as well */
  --shadow-popover:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 12px 24px -8px rgb(0 0 0 / 0.08),
    0 24px 48px -12px rgb(0 0 0 / 0.12);
  --shadow-header: 0 8px 10px -10px rgb(0 0 0 / 0.2);
}
```

#### 3. Make every `data-theme` attribute paint its own element

By default, CSS custom properties inherit — so a `<div data-theme="dark">` recolors its *descendants* but not itself. Force the element to also pick up the new `canvas` / `fg` it just redefined:

```css
[data-theme="light"],
[data-theme="dark"],
[data-theme="brand"] {
  color: var(--color-fg);
  background-color: var(--color-canvas);
}
```

> [!IMPORTANT]
> Every mode you add must appear in this selector list. A mode you forget here will color its children correctly but leave the attributed element showing the parent's background — a classic "the dark panel has a light strip around it" bug.

#### 4. Write one override block per non-default mode

Each override block just redeclares the semantic tokens. The cascade does the rest — `bg-panel` / `text-fg` / `border-stroke` / `bg-intent` all automatically flip because they resolve through the `var(--color-…)` chain.

```css
[data-theme="light"] {
  /* Explicit light block so a <div data-theme="light"> inside a dark
     ancestor forces itself back to light. It's a duplicate of @theme,
     but intentionally — it wins against dark/brand via specificity. */
  --color-canvas: #f3f3f3;
  --color-panel: #f9f9f9;
  /* …full token list… */
  --pattern-stripe: rgb(0 0 0 / 0.08);
}

[data-theme="dark"] {
  --color-canvas: #0a0a0a;
  --color-panel: #141414;
  --color-panel-muted: #1f1f1f;
  --color-fg: #f5f5f5;
  --color-fg-muted: #a3a3a3;
  --color-fg-on-intent: #0a0a0a;
  --color-intent: #f5f5f5;
  /* …full token list… */
  --pattern-stripe: rgb(255 255 255 / 0.1);

  color-scheme: dark;
}

[data-theme="brand"] {
  --color-canvas: #0a0a0a;
  --color-panel: #141414;
  /* …same structural tokens as dark… */
  /* …but brand-distinctive accent colors: */
  --color-intent: #8b5cf6;        /* brand hue — the primary-action color */
  --color-intent-hover: #7c3aed;
  --color-focus: #8b5cf6;         /* focus ring inherits brand */

  color-scheme: dark;
}
```

> [!CAUTION]
> `color-scheme` only accepts `normal | light | dark | light dark`. Writing `color-scheme: brand` is invalid and browsers silently ignore it, which leaves native scrollbars and form controls stuck in the previous mode. Always resolve each custom theme to one of the four valid values based on whether its surfaces are light- or dark-leaning.

#### 5. Apply a mode

One attribute — anywhere in the tree. At the root for a whole-page theme:

```astro
<!-- Layout.astro — whole page in dark -->
<html lang="en" data-theme="dark">
  …
</html>
```

Or nested, for an island that bucks the page theme:

```astro
<section data-theme="light" class="bg-canvas text-fg">
  <!-- Forced light island inside a dark page -->
</section>

<aside data-theme="brand" class="bg-canvas text-fg p-8">
  <!-- A promotional strip in brand mode, no matter what the page is -->
</aside>
```

The classes inside the island don't change. `bg-canvas` resolves against whichever `data-theme` it finds on the nearest ancestor.

#### 6. A per-mode toggle

Same pattern as the light/dark toggle earlier — just cycle three values instead of two, and persist to `localStorage`:

```astro
<script is:inline>
  (() => {
    const stored = localStorage.getItem("theme");
    if (stored) document.documentElement.setAttribute("data-theme", stored);
  })();
</script>

<button
  type="button"
  aria-label="Cycle theme"
  onclick="
    const root = document.documentElement;
    const order = ['light', 'dark', 'brand'];
    const current = root.getAttribute('data-theme') || 'light';
    const next = order[(order.indexOf(current) + 1) % order.length];
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  "
  class="p-2 rounded-md hover:bg-panel-muted"
>
  Theme
</button>
```

The `is:inline` block at the top runs before paint and applies the stored theme — that's the FOUC prevention from earlier, adapted to the attribute-based switch.

#### Where `dark:` and `brand:` utilities are useful

With tokens doing the real work, component code stays theme-agnostic. You should rarely reach for `dark:*` or `brand:*`. The few cases where they're the right tool:

- **Structural swaps** — a different logo file per mode (`dark:hidden` / `brand:hidden`), or a chart that needs grid-color inverted.
- **One-off surfaces** — a hero image that has a white edge on dark backgrounds; add `brand:mask-b-from-40%` just for brand.
- **Debug visualization** — a per-mode outline to verify which theme an island is resolving to.

If you find yourself writing `dark:bg-panel`, that's a sign the token is wrong — fix `--color-panel` in the dark override block instead, and *every* `bg-panel` in the codebase follows automatically.

#### Adding a fourth (or nth) mode

Every new mode needs the same five touch-points. If any is missing, you get a silent failure.

1. Register a variant: `@custom-variant <name> (&:where([data-theme="<name>"], [data-theme="<name>"] *));`
2. Add it to the `[data-theme="…"]` selector list in the paint-own-element rule.
3. Write an override block `[data-theme="<name>"] { … }` redeclaring every token.
4. Set a valid `color-scheme` (`light` or `dark`) in the block.
5. Extend the toggle's `order` array if the user can cycle to it.

---

## 29. Custom color systems

Tailwind's default palette (`zinc-700`, `blue-500`, etc.) is designed as a *starting* point, not a design system. For production work you want your own palette built on the same principles. Here's how.

### The two-layer model (the key insight)

Every mature color system has **two distinct layers**:

1. **Primitives** (a.k.a. "ramps" or "scales") — the raw palette. `brand-50` through `brand-950`. Many colors, many shades. **Nobody uses these directly in components.**
2. **Semantic tokens** — roles like `bg`, `fg-muted`, `border`, `primary`, `danger`. These reference primitives. **Components only ever use these.**

The mistake everyone makes at first: defining one flat list (`brand`, `accent`, `gray`, `red`) and using it directly in components. It works until you need a second theme, a hover state, a disabled state, or a third brand variant — then everything tangles.

Two layers keeps the palette and the *meaning* separate. Designers can retune the palette without touching components. Developers can rename a semantic role without touching the palette.

### Step 1 — Build primitive ramps

A ramp is 10–11 stops of the same hue. Stick with Tailwind's stop convention (`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`) — your future self and any new dev will thank you.

```css
@theme {
  /* ---------- BRAND (primary hue) ---------- */
  --color-brand-50:  #f5f3ff;
  --color-brand-100: #ede9fe;
  --color-brand-200: #ddd6fe;
  --color-brand-300: #c4b5fd;
  --color-brand-400: #a78bfa;
  --color-brand-500: #8b5cf6;
  --color-brand-600: #7c3aed;
  --color-brand-700: #6d28d9;
  --color-brand-800: #5b21b6;
  --color-brand-900: #4c1d95;
  --color-brand-950: #2e1065;

  /* ---------- NEUTRAL (your custom gray) ---------- */
  --color-neutral-50:  #fafaf9;
  --color-neutral-100: #f5f5f4;
  /* ...etc, all the way to 950 */
}
```

These auto-generate `bg-brand-500`, `text-neutral-700`, etc. **You won't use them in components**, but they're available for one-offs.

#### How to actually pick the colors

Three options, ranked by output quality:

1. **A perceptually uniform color space** (OKLCH/OKLab). Tools: [OKLCH Color Picker](https://oklch.com), [Huetone](https://huetone.ardov.me), [Leonardo](https://leonardocolor.io). Pick a hue, fix lightness steps perceptually, generate the ramp. Tailwind v4 actually uses OKLCH internally for its default palette.
2. **A ramp generator from a single seed color** — [UI Colors](https://uicolors.app), [Tailwind Shades](https://www.tailwindshades.com), [Palettte.app](https://palettte.app). Quick, decent results.
3. **Eyeballing it in hex.** Don't. The middle stops will look muddy and the contrast progression will be uneven.

**Critical rule**: each stop should differ from its neighbor by a *consistent perceptual amount*, not a consistent hex amount. That's why OKLCH wins — it's the only color space designed to make this easy.

#### Use OKLCH directly in CSS (recommended)

Modern browsers support `oklch()` natively:

```css
@theme {
  --color-brand-500: oklch(0.62 0.24 295);   /* L C H */
  --color-brand-600: oklch(0.55 0.25 295);
  --color-brand-700: oklch(0.48 0.22 295);
  /* L = lightness 0-1, C = chroma 0-0.4, H = hue 0-360 */
}
```

Advantage: change `H` once and the whole ramp shifts to a new hue while keeping the lightness curve identical. Try doing that with hex.

### Step 2 — Semantic tokens reference the ramps

This is where the system actually lives. Components use these names.

```css
@theme {
  /* ---------- SURFACES (backgrounds) ---------- */
  --color-bg:          var(--color-neutral-50);
  --color-bg-elevated: #ffffff;
  --color-bg-sunken:   var(--color-neutral-100);
  --color-bg-overlay:  var(--color-neutral-900);

  /* ---------- CONTENT (foregrounds) ---------- */
  --color-fg:          var(--color-neutral-900);
  --color-fg-muted:    var(--color-neutral-600);
  --color-fg-subtle:   var(--color-neutral-500);

  /* ---------- LINES ---------- */
  --color-border:        var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-divider:       var(--color-neutral-100);

  /* ---------- BRAND ROLES ---------- */
  --color-intent:        var(--color-brand-600);
  --color-intent-hover:  var(--color-brand-700);
  --color-intent-active: var(--color-brand-800);
  --color-intent-soft:   var(--color-brand-50);
  --color-fg-on-intent:     #ffffff;

  /* ---------- STATUS ---------- */
  --color-success:      var(--color-emerald-600);
  --color-success-soft: var(--color-emerald-50);
  --color-success-fg:   #ffffff;

  --color-warning:      var(--color-amber-500);
  --color-warning-soft: var(--color-amber-50);
  --color-warning-fg:   var(--color-neutral-900);

  --color-danger:       var(--color-red-600);
  --color-danger-soft:  var(--color-red-50);
  --color-danger-fg:    #ffffff;

  /* ---------- INTERACTIVE ---------- */
  --color-focus-ring: var(--color-brand-500);
  --color-selection:  var(--color-brand-200);
}
```

In components:

```astro
<div class="bg-panel text-fg border border-stroke rounded-lg p-6">
  <h3 class="text-fg">Card title</h3>
  <p class="text-fg-muted">Subtitle</p>
  <button class="bg-intent text-fg-on-intent hover:bg-intent-hover px-4 py-2">
    Action
  </button>
  <span class="bg-success-soft text-success px-2 py-1 rounded">Saved</span>
</div>
```

**Zero references to `brand-600` or `neutral-200`.** All meaning, no raw palette. If you switch `--color-intent` to point at `--color-accent-600` tomorrow, every primary button updates instantly.

### Step 3 — The naming taxonomy

A good naming system answers three questions for each token:

1. **What is it?** (`bg`, `fg`, `border`, `primary`, `success`...)
2. **What variant/state?** (`-hover`, `-active`, `-disabled`, `-soft`, `-strong`, `-muted`...)
3. **What's it paired with?** (`-fg` for "foreground used on top of this")

| Pattern | Meaning | Example |
|---|---|---|
| `bg-*` | Surface colors | `bg`, `bg-elevated`, `bg-sunken` |
| `fg-*` | Text/icon colors | `fg`, `fg-muted`, `fg-subtle` |
| `border-*` | Lines | `border`, `border-strong`, `divider` |
| `<role>` | Solid color for that role | `primary`, `danger` |
| `<role>-soft` | Tinted background of that role | `primary-soft`, `danger-soft` |
| `<role>-fg` | Foreground used ON that role | `primary-fg`, `danger-fg` |
| `<role>-hover` | Hover state | `primary-hover` |
| `<role>-active` | Active/pressed state | `primary-active` |

The two non-obvious ones are `-soft` and `-fg` — and they're the most useful tokens you can have:

- **`-soft`** lets you do tinted-background patterns (green "Success" pill, red error banner) without redefining the contrast pair every time. `bg-danger-soft text-danger` works for any role.
- **`-fg`** removes "what color text goes on this background?" from every component decision. Define it once when you set up the role.

### Step 4 — How this plays with light/dark

Theme overrides redeclare *semantic tokens*, **not primitives**. The ramps stay the same in both themes — only the *mappings* change.

```css
/* Defaults — light theme */
@theme {
  --color-brand-50:  oklch(0.97 0.02 295);
  --color-brand-950: oklch(0.20 0.10 295);
  /* ...full ramp... */

  --color-bg:         var(--color-neutral-50);
  --color-fg:         var(--color-neutral-900);
  --color-intent:    var(--color-brand-600);
  --color-fg-on-intent: #ffffff;
}

/* Dark theme — same ramps, different mappings */
:root.dark {
  --color-bg:         var(--color-neutral-950);
  --color-fg:         var(--color-neutral-50);
  --color-intent:    var(--color-brand-400);   /* lighter for dark bg */
  --color-fg-on-intent: var(--color-neutral-950);
}
```

Two important rules:

1. **Brand colors usually need a different stop in dark mode.** A `brand-600` that pops on white looks muddy on near-black. Bump it to `brand-400` or `brand-500` in dark mode. The ramp doesn't change; the *role mapping* does.
2. **Neutrals invert.** Light pulls from `50`/`100`/`200`; dark pulls from `950`/`900`/`800`. Same ramp, opposite ends.

### Step 5 — Validate accessibility

Non-negotiable. Every text-on-background pair needs to meet WCAG ratios:

- **Body text**: 4.5:1 minimum (AA), 7:1 ideal (AAA)
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI elements** (borders, icons): 3:1 minimum

Test every semantic pair you define, in *both* themes:

- `bg` × `fg`
- `bg` × `fg-muted`
- `bg-elevated` × `fg`
- `primary` × `primary-fg`
- `success-soft` × `success`
- `danger-soft` × `danger`

Tools: WebAIM Contrast Checker, Chrome DevTools color picker (shows the ratio inline), Stark, Lighthouse.

**Most common failures**: `fg-muted` and `fg-subtle` on tinted backgrounds. They pass on pure white but fail on `bg-elevated` if it's anything but pure white. Always check the actual combinations you'll use.

### Step 6 — Document what each token is *for*

Tokens without docs become guesswork. Add a reference at the top of `global.css`:

```css
@theme {
  /* ============================================================
     SEMANTIC COLOR TOKENS

     bg              page background
     bg-elevated     cards, panels, modals — sits ON bg
     bg-sunken       inputs, wells — sits BELOW bg

     fg              primary text on bg/bg-elevated
     fg-muted        secondary text, helper copy
     fg-subtle       tertiary, captions, placeholders

     border          default 1px lines, card edges
     border-strong   emphasized borders, focused inputs
     divider         intra-component splits, list separators

     primary         main brand action — buttons, links
     primary-soft    tinted brand bg — pills, badges, alerts
     primary-fg      text/icons placed ON primary
     primary-hover   primary in hover state

     <status>        solid status (success/warning/danger/info)
     <status>-soft   tinted background of that status
     <status>-fg     text placed ON the solid status

     focus-ring      outline color for keyboard focus
     ============================================================ */
}
```

When a designer asks "what color should this confirmation modal be?", the answer is documented. When a new dev joins, they don't have to spelunk through Figma to figure out what `bg-sunken` means.

### Step 7 — Don't fight Tailwind's defaults — replace surgically

Tailwind v4 ships with its full default palette (`red`, `blue`, `zinc`, etc.). You don't have to nuke it:

- **Define your custom ramps** (`brand`, `accent`, custom `neutral`).
- **Define semantic tokens** that reference whatever ramp is right (yours or Tailwind's).
- **Leave Tailwind defaults available** for one-off prototypes or status colors you don't want to redefine (`emerald`, `amber`, `red` work fine for success/warning/danger if you don't have brand-specific ones).

If you genuinely want to remove all defaults:

```css
@theme {
  --color-*: initial;   /* wipe all default colors */
  /* now define yours from scratch */
}
```

I rarely recommend this. Keeping defaults available is more useful than the slightly smaller CSS bundle.

### Step 8 — Handling alpha (transparency)

Two patterns, both useful:

#### Pattern A — Tailwind's slash syntax

Tailwind v4 lets you do `bg-intent/20`, `text-fg/50`, `border-stroke/30` out of the box. Works with any color token, including yours. Use this for one-offs.

#### Pattern B — Dedicated alpha tokens

When the same translucency appears in multiple places (overlay backdrops, glass panels, focus shadows), promote it to a token:

```css
@theme {
  --color-overlay:      rgb(0 0 0 / 0.6);
  --color-glass:        rgb(255 255 255 / 0.08);
  --color-focus-shadow: rgb(139 92 246 / 0.4);
}
```

Tip: store base color components separately so you can compose alphas dynamically:

```css
@theme {
  --color-brand-rgb: 139 92 246;   /* space-separated, no commas */
}

.glow {
  box-shadow: 0 0 40px rgb(var(--color-brand-rgb) / 0.4);
}
```

### Common gotchas

1. **Don't put semantic tokens in components, then realize you need primitives.** Build primitives first, semantics second, components third. Going backwards is painful.
2. **Don't name semantic tokens after colors.** `--color-blue` for a primary action is a trap — what happens when the brand changes to green? Always name by *role*, never by hue.
3. **Don't skip the `-fg` pair tokens.** If you only define `--color-intent` and not `--color-fg-on-intent`, every component author guesses. They will guess differently. You will end up with white-text-on-yellow somewhere.
4. **Don't mix systems mid-component.** Either a component uses semantic tokens or it uses primitives — not both. Mixing leads to "this is `bg-panel` but the border is `border-zinc-300`" inconsistencies that survive theme changes and break.
5. **Don't forget hover/active/focus.** A `primary` token without `primary-hover` means every developer reaches for `hover:bg-brand-700` and you're back to primitives in components.
6. **Don't try to make every color a token.** One-off illustration colors, decorative gradients, marketing-page hero accents — these can stay as raw values or arbitrary classes. Tokens are for *system* colors, not *content* colors.

### TL;DR

1. **Build primitive ramps** (`brand-50` → `brand-950`) using OKLCH for perceptual evenness.
2. **Define semantic tokens** (`bg`, `fg`, `primary`, `primary-fg`, `primary-soft`, `success`, `border`...) that reference primitives.
3. **Components only use semantic tokens.** Never raw palette names.
4. **Pair foregrounds with backgrounds** — `primary-fg`, `success-fg`, `bg`/`fg` — so contrast decisions are made once.
5. **`-soft` variants** for tinted backgrounds (pills, badges, alerts).
6. **State variants** (`-hover`, `-active`, `-disabled`) defined upfront.
7. **Theme switching changes the semantic mappings, not the primitives.** Same ramps, different role assignments per theme.
8. **Validate contrast** for every semantic pair, in every theme.
9. **Document what each token is *for***, not just what color it is.
10. **Don't nuke Tailwind defaults** unless you have a reason.

The whole system is "primitives are paint, semantics are roles, components are blind to both." Once you have the two-layer split, custom palettes, multi-brand theming, dark mode, and accessibility audits all become *the same problem* — and you only have to solve it in one place.

---

## Quick reference

### Astro

```astro
---
import Layout from "../layouts/Layout.astro";
import Button from "../components/Button.astro";
interface Props { title: string; }
const { title } = Astro.props;
---
<Layout title={title}>
  <h1>Hello</h1>
  <Button label="Click" />
</Layout>
```

### Tailwind 4 stylesheet

```css
@import "tailwindcss";

@theme {
  --color-brand: #f00;
  --container-7xl: 90rem;
}

@layer components {
  .container-large { @apply mx-auto w-full max-w-7xl; }
  .section-gutter { @apply px-4 md:px-12 lg:px-24; }
  .section-padding-lg { @apply py-32 md:py-48; }
}
```

### Section template

```astro
<section class="section-gutter">
  <div class="container-large section-padding-lg">
    <h1>Section content</h1>
  </div>
</section>
```

### Variant component

```astro
---
interface Props {
  variant?: "primary" | "secondary";
  href?: string;
}
const { variant = "primary", href } = Astro.props;
const variantClasses = {
  primary: "bg-blue-500 text-white",
  secondary: "border border-blue-500 text-blue-500",
};
const Tag = href ? "a" : "button";
---
<Tag href={href} class={`px-4 py-2 ${variantClasses[variant]}`}>
  <slot />
</Tag>
```

---

## 30. External scripts & `is:inline`

By default, Astro **bundles and processes** every `<script>` tag — it resolves imports, tree-shakes, and outputs optimized JS. This is great for your own code, but it breaks third-party scripts that load from external URLs or rely on global variables (like HubSpot's `hbspt`, Google Analytics `gtag`, chat widgets, etc.).

### The problem

```astro
<!-- Astro tries to bundle this and fails -->
<script src="//js.hsforms.net/forms/embed/v2.js"></script>
<script>
  hbspt.forms.create({ ... }); // ReferenceError: hbspt is not defined
</script>
```

Astro processes the second script at build time, sees `hbspt` isn't defined anywhere in your project, and the build breaks.

### The fix: `is:inline`

Adding `is:inline` tells Astro to pass the script through untouched — no bundling, no processing, just raw HTML output:

```astro
<script is:inline src="//js.hsforms.net/forms/embed/v2.js"></script>
<script is:inline>
  hbspt.forms.create({
    region: "na1",
    portalId: "40120329",
    formId: "34f97be6-a435-4a54-a676-371efe148e70"
  });
</script>
```

### When to use `is:inline`

| Scenario | Use `is:inline`? |
|---|---|
| Your own component logic | No — let Astro bundle it |
| Third-party SDK from external URL | Yes |
| Script using globals like `hbspt`, `gtag`, `Intercom` | Yes |
| Analytics/tracking snippets | Yes |
| Inline event handlers or widgets | Yes |

### Passing Astro variables into inline scripts with `define:vars`

Since `is:inline` scripts skip Astro's bundler, they can't access frontmatter variables directly. Use `define:vars` to bridge server-side values into the script:

```astro
---
const formId = "34f97be6-a435-4a54-a676-371efe148e70";
const portalId = "40120329";
---
<script is:inline define:vars={{ formId, portalId }}>
  hbspt.forms.create({
    region: "na1",
    portalId: portalId,
    formId: formId,
  });
</script>
```

This is how you make reusable components with props that feed into third-party scripts.

### Reusable third-party component pattern

```astro
---
interface Props {
  formId: string;
  portalId?: string;
  region?: string;
}
const {
  formId,
  portalId = "40120329",
  region = "na1",
} = Astro.props;
---

<div id="hubspot-form-container"></div>

<script is:inline src="//js.hsforms.net/forms/embed/v2.js"></script>
<script is:inline define:vars={{ region, portalId, formId }}>
  hbspt.forms.create({
    region: region,
    portalId: portalId,
    formId: formId,
    target: "#hubspot-form-container",
  });
</script>
```

Usage — same component, different forms:

```astro
<HubspotForm formId="abc123" />
<HubspotForm formId="xyz789" portalId="99999" region="eu1" />
```

### Iframes

Iframes work in Astro like plain HTML — no special syntax needed:

```astro
<iframe
  src="https://example.com"
  width="100%"
  height="500"
  frameborder="0"
  loading="lazy"
></iframe>
```

Works for YouTube, Google Maps, Calendly, Typeform, or any embeddable content.

### Passing data to iframes

Iframes are fully isolated — they're a separate browser context with their own DOM, scripts, and origin. You **cannot** pass JavaScript objects into an iframe the way you pass props to a component. There are three approaches depending on what you're embedding:

#### 1. URL parameters (most common)

Pass config as query strings. The page inside the iframe reads them on its own side. This is how most third-party embeds work — you don't control the iframe's code, you configure it via the URL.

```astro
---
interface Props {
  formId: string;
  theme?: string;
}
const { formId, theme = "light" } = Astro.props;
---

<iframe
  src={`https://example.com/embed?formId=${formId}&theme=${theme}`}
  width="100%"
  height="500"
  frameborder="0"
  loading="lazy"
  title="Embedded form"
></iframe>
```

Props flow into the `src` URL at build time — same pattern as data attributes on a canvas, but the destination is a query string instead of `dataset`.

#### 2. `postMessage` (two-way communication)

When you control both sides (your page and the iframe content), you can send data back and forth at runtime. This is useful for passing complex objects or reacting to events inside the iframe.

```astro
<iframe id="my-embed" src="/embed-page" title="Interactive embed"></iframe>

<script>
  const iframe = document.querySelector<HTMLIFrameElement>("#my-embed");

  // Wait for iframe to load, then send data
  iframe?.addEventListener("load", () => {
    iframe.contentWindow?.postMessage(
      { color: "#3b82f6", speed: 1, items: ["a", "b", "c"] },
      window.location.origin  // target origin — use the actual URL in production
    );
  });

  // Listen for messages back from the iframe
  window.addEventListener("message", (event) => {
    // Always verify the origin for security
    if (event.origin !== window.location.origin) return;
    console.log("Received from iframe:", event.data);
  });
</script>
```

Inside the iframe page, the receiving side looks like this:

```js
// Inside the iframe's own script
window.addEventListener("message", (event) => {
  if (event.origin !== "https://your-site.com") return;
  const { color, speed, items } = event.data;
  // Use the values
});

// Send data back to the parent
window.parent.postMessage({ status: "ready" }, "https://your-site.com");
```

**Security rule:** always check `event.origin` before using `event.data`. Without this, any page that embeds your iframe could inject data.

#### 3. Same-origin direct access (rare)

If the iframe loads a page from your own site (same domain), you can reach into its DOM directly:

```js
const iframe = document.querySelector("iframe");
const innerDoc = iframe.contentDocument;
innerDoc.getElementById("canvas"); // works only if same origin
```

This is rarely useful — if you control the content, skip the iframe and use a component with a `<script>` tag instead. It's simpler and more performant.

#### When to use what

| Need | Approach |
|---|---|
| Embed third-party content (YouTube, Calendly, forms) | iframe + URL params |
| Two-way communication with an embedded page you control | iframe + `postMessage` |
| Custom animation or interactive element you fully control | Skip iframe — use a component with `<script>` (canvas pattern from 30b/30c) |

The key insight: iframes are for **isolation** — embedding content you don't control or don't want to mix with your own DOM. If you control everything, components with scripts are always simpler.

---

## 30b. Canvas animations in Astro

Canvas is a purely client-side API — it only exists in the browser. Astro's frontmatter runs at build time on the server. So you can't create a canvas context or draw anything in the frontmatter. Instead, you pass **configuration as props**, render a `<canvas>` element, and let a client-side script do the drawing.

### The workflow

**Step 1 — Create the script in `public/scripts/`.**

Files in `public/` are served as-is with no bundling. The script should read its configuration from `data-*` attributes on the canvas element:

```js
// public/scripts/hero-animation.js
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Read config from data attributes (always strings — parse as needed)
  const speed = Number(canvas.dataset.speed) || 1;
  const color = canvas.dataset.color || '#3b82f6';

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... draw using speed, color, etc.
    requestAnimationFrame(draw);
  }

  draw();
});
```

**Step 2 — Create the Astro component.**

Props define the configuration. They get passed to the `<canvas>` as `data-*` attributes — this is the bridge between build time and runtime. The `class` prop lets the caller control positioning and sizing.

```astro
---
interface Props {
  speed?: number;
  color?: string;
  class?: string;
}

const { speed = 1, color = "#3b82f6", class: className } = Astro.props;
---

<div class:list={["overflow-hidden", className]}>
  <canvas
    id="canvas"
    data-speed={speed}
    data-color={color}
    class="block w-full h-full"
    aria-hidden="true"
  ></canvas>
</div>

<script is:inline src="/scripts/hero-animation.js"></script>
```

**Step 3 — Use it on a page.**

The canvas typically sits behind content with `absolute inset-0`, while the content layers on top with `relative z-10`:

```astro
<SectionMain padding="none" contentPadding="none" contentClass="relative">
  <HeroCanvas class="absolute inset-0 h-full w-full" speed={0.5} color="#6366f1" />
  <div class="relative z-10 py-32 px-6">
    <h1 class="h1">Hello World</h1>
  </div>
</SectionMain>
```

### The data flow

```
Props (build time) → data-* attributes (HTML) → JS reads dataset (runtime) → canvas draws
```

Each step crosses a boundary:
- **Props → data attributes**: Astro renders the values into HTML at build time. Numbers and strings become attribute values.
- **Data attributes → JS**: The script reads `canvas.dataset.speed` at runtime in the browser. Values are always strings, so parse them with `Number()` or `parseFloat()`.
- **JS → canvas**: The script uses the parsed values to configure the animation loop.

### Why `is:inline` and `public/`

- **`is:inline`** tells Astro not to bundle the script. Canvas animation scripts often use IIFEs, attach to `window`, or depend on load order — bundling breaks these patterns.
- **`public/scripts/`** serves the file at a predictable URL (`/scripts/hero-animation.js`). Astro doesn't touch files in `public/`.
- The `src` path in `<script is:inline src="/scripts/...">` is relative to `public/`, not `src/`.

### Two ways to pass config to client-side JS

| Method | Tradeoff |
|---|---|
| `data-*` attributes | Script is loaded once, each instance reads its own config from the DOM. Works with multiple instances on one page. |
| `define:vars` on `<script is:inline>` | Variables are injected directly as JS — no parsing needed. But the script is inlined (duplicated) for each component instance. |

For canvas animations, **data attributes are the better choice** — you get one cached script file and each canvas reads its own config.

### Common mistakes

1. **Trying to use `canvas.getContext("2d")` in the frontmatter.** The canvas doesn't exist at build time. All drawing code must live in a `<script>` tag.
2. **Using a regular `<script>` (without `is:inline`) for scripts that use globals.** Astro will try to bundle it and fail on undefined references like `SimplexNoise`.
3. **Hardcoding `relative` in the component wrapper.** This prevents the caller from using `absolute` to position the canvas behind content (see the class conflicts lesson above).
4. **Forgetting to resize the canvas.** Canvas resolution is set by its `width`/`height` attributes, not CSS. The script should listen for `resize` and update both.

---

## 30c. Three.js and npm-based canvas libraries

The canvas workflow from section 30b applies to Three.js, but with one key difference: Three.js is an npm package with ES module imports, so you **want** Astro's bundler. Use a regular `<script>` tag (no `is:inline`) and Astro will handle the import, tree-shaking, and code-splitting automatically.

### Setup

Install Three.js:

```bash
npm install three
```

### The component

```astro
---
interface Props {
  speed?: number;
  color?: string;
  class?: string;
}

const { speed = 1, color = "#3b82f6", class: className } = Astro.props;
---

<div class:list={["overflow-hidden", className]}>
  <canvas
    data-three-canvas
    data-speed={speed}
    data-color={color}
    class="block w-full h-full"
    aria-hidden="true"
  ></canvas>
</div>

<script>
  import * as THREE from "three";

  const canvas = document.querySelector<HTMLCanvasElement>("[data-three-canvas]");
  if (canvas) {
    const speed = Number(canvas.dataset.speed) || 1;
    const color = canvas.dataset.color || "#3b82f6";

    // Renderer — uses the existing <canvas> element
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Example: a rotating box
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    scene.add(directional);

    // Resize handler
    function resize() {
      const parent = canvas.parentElement!;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    // Animation loop
    function animate() {
      mesh.rotation.x += 0.01 * speed;
      mesh.rotation.y += 0.015 * speed;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }
</script>
```

### The key difference from section 30b

| | 2D canvas (SimplexNoise) | Three.js |
|---|---|---|
| **Install** | Copy script to `public/scripts/` | `npm install three` |
| **Script tag** | `<script is:inline src="/scripts/...">` | `<script>` (bundled by Astro) |
| **Imports** | None — uses globals / IIFE | `import * as THREE from "three"` |
| **Why** | Script uses IIFE / `window` globals — bundling breaks it | ES module with standard imports — bundling works perfectly |

The rule: if the library is on npm and uses `import`/`export`, let Astro bundle it. If it's a standalone script that attaches to `window` or uses an IIFE, use `is:inline`.

### Data flow (same as before)

```
Props (build time) → data-* attributes (HTML) → JS reads dataset (runtime) → Three.js renders
```

### Usage

```astro
---
import ThreeHero from "../components/ThreeHero.astro";
---

<SectionMain padding="none" contentPadding="none" contentClass="relative">
  <ThreeHero class="absolute inset-0 h-full w-full" speed={0.5} color="#6366f1" />
  <div class="relative z-10 py-32 px-6">
    <h1 class="h1">Hello World</h1>
  </div>
</SectionMain>
```

### Adding more Three.js features

Three.js has a large ecosystem of add-ons that are imported from subpaths:

```js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
```

These all work with Astro's bundler — just import them in the `<script>` block like any other module. Astro tree-shakes the bundle so only the parts you use get shipped to the browser.

### Reduced motion

Wrap the animation in a `prefers-reduced-motion` check so users who opt out see a static scene:

```js
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animate() {
  if (!prefersReduced) {
    mesh.rotation.x += 0.01 * speed;
    mesh.rotation.y += 0.015 * speed;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

This renders the scene once (so it's not blank) but skips continuous rotation.

---

## 31. Content collections (local CMS)

Content collections are Astro's built-in system for managing structured content — like a CMS, but the data lives in your repo as markdown files. Think of it as the Astro equivalent of Webflow CMS collections: you define a structure, create entries, and query them on any page.

### The mental model

```
Markdown files       →  content.config.ts    →  getCollection()  →  template
(data + content)         (validates shape)        (queries entries)   (renders them)
```

Each markdown file is one entry (like one CMS item). The frontmatter (`---` block) holds structured fields (like CMS fields). The body below the frontmatter is rich content that gets rendered as HTML.

### Step 1: Create the content folder

Create a folder inside `src/content/` named after your collection:

```
src/content/faq/
```

The folder name becomes the collection name. You can have multiple collections:

```
src/content/
  faq/          → "faq" collection
  blog/         → "blog" collection
  team/         → "team" collection
  changelog/    → "changelog" collection
```

### Step 2: Add markdown entries

Each `.md` file inside the folder is one entry. The filename becomes the entry's `id` (e.g., `what-is-astro.md` → id `what-is-astro`).

```md
---
question: "What is Astro?"
page: "homepage"
order: 1
---

Astro is a web framework that delivers lightning-fast performance
by shipping zero JavaScript by default. It uses an island architecture
where only interactive components are hydrated.
```

**The frontmatter** (between `---` fences) contains structured data — strings, numbers, booleans, dates, arrays. You decide what fields to include.

**The body** (below the second `---`) is markdown content that will be rendered as HTML. It can include headings, lists, links, bold, code blocks — anything markdown supports.

Create as many files as you need:

```
src/content/faq/
  what-is-astro.md          → order: 1
  astro-vs-nextjs.md        → order: 2
  existing-components.md    → order: 3
```

### Step 3: Define the schema in `content.config.ts`

Create `src/content.config.ts`. This file tells Astro what collections exist and what shape the frontmatter must have:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    page: z.string(),
    order: z.number(),
  }),
});

export const collections = { faq };
```

Breaking this down:

| Part | What it does |
|---|---|
| `defineCollection()` | Registers a collection with Astro |
| `loader: glob(...)` | Tells Astro where to find the files |
| `pattern: "**/*.md"` | Match all `.md` files in the folder (including subfolders) |
| `base: "./src/content/faq"` | The folder to search in |
| `schema: z.object({...})` | Validates frontmatter — Astro will throw a build error if a field is missing or has the wrong type |
| `export const collections` | Exposes the collections to Astro |

#### Common Zod field types

```ts
z.string()                    // required string
z.string().optional()         // optional string
z.number()                    // required number
z.boolean()                   // true or false
z.date()                      // date (parsed from YAML date format)
z.enum(["blog", "tutorial"])  // must be one of these values
z.string().default("draft")   // defaults to "draft" if not provided
z.array(z.string())           // array of strings (e.g., tags: ["astro", "css"])
```

#### Multiple collections

```ts
const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    page: z.string(),
    order: z.number(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { faq, blog };
```

> **Important:** After creating or modifying `content.config.ts`, you must **restart the dev server**. Hot reload does not pick up config changes.

### Step 4: Query the collection in your page

In the frontmatter of any `.astro` page, import and query the collection:

```astro
---
import { getCollection, render } from "astro:content";

const faqs = (await getCollection("faq"))
  .filter((faq) => faq.data.page === "homepage")
  .sort((a, b) => a.data.order - b.data.order);
---
```

| Part | What it does |
|---|---|
| `getCollection("faq")` | Returns all entries in the `faq` collection as an array |
| `faq.data.question` | Access frontmatter fields (typed and validated by the schema) |
| `faq.id` | The filename without extension (e.g., `"what-is-astro"`) |
| `.filter()` | Standard JS — filter entries by any field |
| `.sort()` | Standard JS — sort entries by any field |

You can filter and sort however you want — it's just a JavaScript array:

```ts
// All FAQs for the pricing page
const pricingFaqs = (await getCollection("faq"))
  .filter((faq) => faq.data.page === "pricing");

// All non-draft blog posts, newest first
const posts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

### Step 5: Render the entries in the template

Use `.map()` to loop over entries and render them:

```astro
{faqs.map(async (faq) => {
  const { Content } = await render(faq);
  return (
    <div>
      <h3>{faq.data.question}</h3>
      <Content />
    </div>
  );
})}
```

| Part | What it does |
|---|---|
| `render(faq)` | Converts the markdown body into a `<Content />` Astro component |
| `faq.data.question` | Pulls from frontmatter — use for headings, labels, metadata |
| `<Content />` | Outputs the rendered markdown as HTML |

> **Astro 6 note:** In earlier Astro versions, you'd call `faq.render()` on the entry itself. In Astro 6 with the `glob` loader, you import `render` from `astro:content` and call `render(faq)` instead.

### Full example: FAQ accordion from content collection

**`src/content/faq/what-is-astro.md`**

```md
---
question: "What is Astro?"
page: "homepage"
order: 1
---

Astro is a web framework that delivers lightning-fast performance
by shipping zero JavaScript by default.
```

**`src/content.config.ts`**

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    page: z.string(),
    order: z.number(),
  }),
});

export const collections = { faq };
```

**`src/pages/index.astro`**

```astro
---
import { getCollection, render } from "astro:content";
import Accordion from "../components/Accordion.astro";
import { Icon } from "astro-icon/components";

const faqs = (await getCollection("faq"))
  .filter((faq) => faq.data.page === "homepage")
  .sort((a, b) => a.data.order - b.data.order);
---

<Accordion openByDefault={1}>
  {faqs.map(async (faq) => {
    const { Content } = await render(faq);
    return (
      <div data-accordion="item" class="bg-canvas">
        <button data-accordion="button" class="flex w-full items-center justify-between px-6 py-5 cursor-pointer text-left">
          <span class="h5">{faq.data.question}</span>
          <Icon data-accordion="icon" name="lucide:chevron-down" class="w-5 h-5 text-gray-500 shrink-0" aria-hidden="true" />
        </button>
        <div data-accordion="content">
          <div class="px-6 pb-5 text-gray-500">
            <Content />
          </div>
        </div>
      </div>
    );
  })}
</Accordion>
```

### Adding a new entry

To add a new FAQ, create a new `.md` file in `src/content/faq/`:

```md
---
question: "Is Astro free?"
page: "homepage"
order: 4
---

Yes. Astro is open source and free to use. Hosting on platforms
like Cloudflare Pages, Netlify, or Vercel is also free for most projects.
```

No code changes needed — `getCollection("faq")` automatically picks it up. The `page` and `order` fields control where and in what order it appears.

### Using the same collection on different pages

The `page` field in frontmatter acts as a tag. Filter by it on each page:

```astro
<!-- On homepage -->
const faqs = (await getCollection("faq"))
  .filter((faq) => faq.data.page === "homepage");

<!-- On pricing page -->
const faqs = (await getCollection("faq"))
  .filter((faq) => faq.data.page === "pricing");
```

You could also use an array field for entries that appear on multiple pages:

```md
---
question: "Is Astro free?"
pages: ["homepage", "pricing"]
order: 4
---
```

```ts
// In schema
pages: z.array(z.string()),

// In query
.filter((faq) => faq.data.pages.includes("homepage"))
```

### When to use content collections vs hardcoded content

| Approach | Best for |
|---|---|
| Hardcoded in `.astro` | One-off content that won't change (hero text, single CTA) |
| Content collection | Repeating structured content (FAQs, blog posts, team members, testimonials, changelog entries) |

The rule of thumb: if you have **multiple items with the same shape**, use a collection. If it's a single block of text, hardcode it.

---

## 32. Data files (JSON/YAML) vs content collections

Not everything needs a content collection. If your entries are just structured data with **no markdown body**, a plain JSON file is simpler.

### When to use which

| | JSON/YAML data file | Content collection |
|---|---|---|
| Markdown body (`<Content />`) | No | Yes |
| Schema validation (Zod) | No | Yes |
| Setup required | None — just import | `content.config.ts` + server restart |
| Best for | Logos, nav links, social links, pricing tiers | Blog posts, FAQs, team bios, case studies |

**The rule:** if the entry needs rich content (paragraphs, bold, links, lists), use a content collection. If it's just fields, use a JSON file.

### Step-by-step: JSON data file

**Step 1 — Create the data file** in `src/data/`:

```json
// src/data/clients.json
[
  { "name": "Acme", "logo": "/logos/acme.svg" },
  { "name": "Stripe", "logo": "/logos/stripe.svg" },
  { "name": "Vercel", "logo": "/logos/vercel.svg" }
]
```

**Step 2 — Import it** in any `.astro` page or component:

```astro
---
import clients from "../data/clients.json";
---

{clients.map((client) => (
  <img src={client.logo} alt={client.name} class="h-8" />
))}
```

That's it. No config file, no schema, no server restart. Just an import.

### Key differences from content collections

- **No `getCollection()`** — you import the file directly like any JS module
- **No `render()`** — there's no markdown body to render
- **No `content.config.ts` entry needed** — Astro treats it as a regular import
- **Changes are picked up by hot reload** — no server restart needed

### JSON syntax pitfalls

JSON is strict. Common mistakes:

```json
// WRONG — missing comma between objects
[
  { "name": "Acme", "logo": "/logos/acme.svg" }
  { "name": "Stripe", "logo": "/logos/stripe.svg" }
]

// RIGHT — comma after every item except the last
[
  { "name": "Acme", "logo": "/logos/acme.svg" },
  { "name": "Stripe", "logo": "/logos/stripe.svg" }
]
```

```json
// WRONG — trailing comma after last item (valid in JS, invalid in JSON)
[
  { "name": "Acme", "logo": "/logos/acme.svg" },
  { "name": "Stripe", "logo": "/logos/stripe.svg" },
]
```

```json
// WRONG — single quotes (JSON requires double quotes)
[
  { 'name': 'Acme' }
]
```

### Import syntax

JSON uses a **default export**, not a named export:

```astro
// CORRECT — default import
import clients from "../data/clients.json";

// WRONG — named import (will error)
import { clients } from "../data/clients.json";
```

### When to use `src/data/` vs `public/`

- **`src/data/`** — for JSON/YAML files you import in frontmatter. These are bundled into the build and don't exist as files in the output.
- **`public/`** — for files served as-is by URL (images, fonts, favicons, downloads). Drop a file in `public/logos/acme.svg` and it's available at `/logos/acme.svg`.

---

## 32b. Environment variables (`.env`)

Environment variables store values that change between environments (local dev, staging, production) — API keys, service IDs, feature flags, base URLs. They stay out of your code and out of git.

### Setup

Create a `.env` file in the project root:

```
# .env
PUBLIC_GTAG_ID=G-XXXXXXXXXX
PUBLIC_SITE_URL=https://example.com
API_SECRET_KEY=sk_live_abc123
```

Astro loads `.env` automatically — no extra packages needed.

### The `PUBLIC_` prefix rule

Astro splits env vars into two categories based on their name:

| Prefix | Available in | Use for |
|---|---|---|
| `PUBLIC_` | Server **and** client (browser) | Analytics IDs, public API keys, feature flags |
| No prefix | Server only (frontmatter, endpoints) | Secret keys, database URLs, private tokens |

```astro
---
// Both work in frontmatter (server-side)
const gtagId = import.meta.env.PUBLIC_GTAG_ID;    // "G-XXXXXXXXXX"
const secret = import.meta.env.API_SECRET_KEY;     // "sk_live_abc123"
---
```

```astro
<script>
  // Only PUBLIC_ vars work in client-side scripts
  const gtagId = import.meta.env.PUBLIC_GTAG_ID;    // "G-XXXXXXXXXX"
  const secret = import.meta.env.API_SECRET_KEY;     // undefined — blocked
</script>
```

**If you forget the `PUBLIC_` prefix**, the variable will be `undefined` in the browser. This is a security feature — it prevents secret keys from leaking into client-side bundles.

### Using env vars in components

The typical pattern: read the variable in the frontmatter, then use it conditionally so the component doesn't break when the variable isn't set.

```astro
---
const gtagId = import.meta.env.PUBLIC_GTAG_ID;
---

{gtagId && (
  <script type="text/partytown" src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}></script>
)}
```

The `{gtagId && (...)}` guard means: if the env var isn't set (local dev without `.env`, or a deployment where it's not configured), render nothing. No broken requests, no console errors.

### Passing env vars to `is:inline` scripts

`is:inline` scripts skip Astro's bundler, so they can't access `import.meta.env` directly. Use `define:vars` to bridge:

```astro
---
const apiUrl = import.meta.env.PUBLIC_API_URL;
---

<script is:inline define:vars={{ apiUrl }}>
  // apiUrl is available as a JS variable here
  fetch(apiUrl + "/data").then(r => r.json()).then(console.log);
</script>
```

Or use data attributes (same pattern as canvas components):

```astro
<div data-api-url={import.meta.env.PUBLIC_API_URL}>...</div>
```

### Environment-specific files

Astro supports multiple `.env` files, loaded by mode:

| File | Loaded when |
|---|---|
| `.env` | Always |
| `.env.local` | Always, but **gitignored** — your local overrides |
| `.env.development` | `astro dev` only |
| `.env.production` | `astro build` only |

Precedence: mode-specific file > `.env.local` > `.env`. More specific files override less specific ones.

### The `.env.example` template

Since `.env` is gitignored (it should be — it may contain secrets), create a `.env.example` file that documents what variables the project expects. This **is** committed to git:

```
# .env.example — copy to .env and fill in values

# Google Analytics (optional — omit to disable tracking)
PUBLIC_GTAG_ID=

# Site URL (used for canonical links, OG tags)
PUBLIC_SITE_URL=

# HubSpot (optional — omit to skip form embed)
PUBLIC_HUBSPOT_PORTAL_ID=
PUBLIC_HUBSPOT_FORM_ID=

# Private — never use PUBLIC_ prefix for secrets
API_SECRET_KEY=
```

When someone clones the repo, they copy `.env.example` to `.env` and fill in their values:

```bash
cp .env.example .env
```

### TypeScript support

Add type declarations so `import.meta.env` has autocomplete:

```ts
// src/env.d.ts
interface ImportMetaEnv {
  readonly PUBLIC_GTAG_ID: string;
  readonly PUBLIC_SITE_URL: string;
  readonly API_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Now TypeScript will warn you about typos like `import.meta.env.PUBLIC_GTAG_IDD`.

### Common mistakes

1. **Committing `.env` to git.** Add it to `.gitignore`. Secrets in git history are compromised forever.
2. **Forgetting `PUBLIC_` on client-side vars.** The variable will be `undefined` in the browser with no error — a silent failure.
3. **Using env vars in `is:inline` scripts without `define:vars`.** `import.meta.env` doesn't work in inline scripts — they skip the bundler.
4. **Hardcoding values that change per environment.** If it's different between dev and production (URLs, IDs, keys), it belongs in `.env`.

---

## 33. Common pitfalls

A collection of mistakes that are easy to make and hard to debug.

### `<Image>` vs `<img>` — when to use which

Astro's `<Image>` component optimizes images at build time. But it **only works with imported files from `src/`** or remote URLs with explicit dimensions.

```astro
// CORRECT — imported file from src/
import { Image } from "astro:assets";
import photo from "../images/photo.webp";
<Image src={photo} alt="..." />

// CORRECT — plain img for public/ files
<img src="/logos/acme.svg" alt="..." />

// WRONG — <Image> with a public/ path string
import { Image } from "astro:assets";
<Image src="/logos/acme.svg" alt="..." />
// Error: Missing width and height attributes
```

**The rule:**

| Image source | Use |
|---|---|
| File in `src/` (imported) | `<Image>` — gets optimization |
| File in `public/` (URL path) | `<img>` — no optimization, no import needed |
| Remote URL | `<Image>` with `width`/`height` or `inferSize` |
| SVGs (anywhere) | `<img>` — SVGs don't need optimization |

### `@utility` cannot be nested

In Tailwind 4, `@utility` blocks must be at the **top level** of your CSS file. They cannot be nested inside other `@utility` blocks, `@layer` blocks, or any other rule:

```css
/* WRONG — nested inside another @utility */
@utility section-grid {
  @apply grid;
  @utility animate-marquee {
    animation: marquee 30s linear infinite;
  }
}

/* RIGHT — each @utility at top level */
@utility section-grid {
  @apply grid;
}

@utility animate-marquee {
  animation: marquee 30s linear infinite;
}
```

This usually happens when you paste new CSS inside an existing block without noticing. Watch your closing braces.

### `content.config.ts` requires a server restart

When you create or modify `src/content.config.ts`, the dev server **must be restarted**. Hot reload does not pick up config changes. If you see `The collection "x" does not exist or is empty`, restart the server before debugging further.

### Astro 6: `render()` is a standalone import

In Astro 6 with the `glob` loader, you don't call `.render()` on the entry. You import `render` from `astro:content` and pass the entry to it:

```astro
// WRONG (old Astro syntax)
const { Content } = await faq.render();

// RIGHT (Astro 6)
import { getCollection, render } from "astro:content";
const { Content } = await render(faq);
```

### Slot duplication doesn't work

In Astro, `<slot />` renders once. If you write `<slot />` twice in a component template, the content still only appears once (in the first slot). This matters for patterns like marquees where you need duplicated content for seamless loops.

**Workaround:** pass data as a prop and `.map()` over it twice instead of using slots:

```astro
---
interface Props {
  items: { name: string; logo: string }[];
}
const { items } = Astro.props;
---
<div class="flex">
  {items.map((item) => <img src={item.logo} alt={item.name} />)}
  {items.map((item) => <img src={item.logo} alt={item.name} aria-hidden="true" />)}
</div>
```

The second set gets `aria-hidden="true"` because it's a visual duplicate — screen readers should only read the content once.

---

## 34. GSAP & ScrollTrigger in Astro

GSAP is a JavaScript animation library. ScrollTrigger is a GSAP plugin that triggers animations based on scroll position. Neither is bundled with Astro — you need to install and import them.

### Step 1: Install GSAP

```bash
npm install gsap
```

This installs both GSAP core and all official plugins (ScrollTrigger, ScrollSmoother, etc.).

### Step 2: Import and use in a component

GSAP is client-side only — it needs the DOM. In Astro, put it inside a `<script>` tag (not the frontmatter):

```astro
<div class="hero-title">Hello World</div>

<script>
  import gsap from "gsap";

  gsap.from(".hero-title", {
    opacity: 0,
    y: 50,
    duration: 1,
  });
</script>
```

Astro processes `<script>` tags through its bundler, so standard `import` works. No `is:inline` needed — this is your own code, not a third-party CDN script.

### Step 3: Adding ScrollTrigger

ScrollTrigger is a plugin that must be registered before use:

```astro
<section class="feature-section">
  <h2 class="feature-title">Features</h2>
</section>

<script>
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".feature-title", {
    scrollTrigger: {
      trigger: ".feature-section",
      start: "top 80%",
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
  });
</script>
```

### Key concepts

| Concept | What it means |
|---|---|
| `gsap.registerPlugin()` | Required once before using any plugin |
| `scrollTrigger.trigger` | The element that triggers the animation when scrolled into view |
| `scrollTrigger.start` | When to start — `"top 80%"` means "when the top of the trigger hits 80% down the viewport" |
| `gsap.from()` | Animate FROM these values TO the element's current CSS state |
| `gsap.to()` | Animate from current state TO these values |

### Using GSAP in a reusable component

When you have GSAP logic inside a component's `<script>`, Astro bundles it once and runs it once. If the component appears multiple times on a page, you need to scope your selectors.

**Wrong — selects all matches globally:**

```astro
<script>
  import gsap from "gsap";
  gsap.from(".card", { opacity: 0 });
</script>
```

**Right — scope to each instance:**

```astro
<div class="card-wrapper" data-animate>
  <div class="card">Content</div>
</div>

<script>
  import gsap from "gsap";

  document.querySelectorAll("[data-animate]").forEach((wrapper) => {
    gsap.from(wrapper.querySelector(".card"), {
      opacity: 0,
      y: 20,
      duration: 0.6,
    });
  });
</script>
```

### CDN approach (alternative)

If you don't want to install GSAP via npm (e.g., using GSAP's CDN for Club plugins), use `is:inline`:

```astro
<script is:inline src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script is:inline src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script is:inline>
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-title", {
    scrollTrigger: ".hero-section",
    opacity: 0,
    y: 50,
  });
</script>
```

With CDN, GSAP is a global (`window.gsap`), so no `import` statement. Use `is:inline` because these are external scripts.

### npm import vs CDN — when to use which

| Approach | Pros | Cons |
|---|---|---|
| `npm install gsap` + `import` | Tree-shaken, bundled, typed | Only free plugins |
| CDN + `is:inline` | Access to Club plugins, no build step | No tree-shaking, globals, larger payload |

### Optional GSAP pattern

If your component should work with or without GSAP (like the Tabs component), check before using it:

```astro
<script>
  const hasGSAP = typeof gsap !== "undefined";

  if (hasGSAP) {
    // Animate with GSAP
    gsap.from(".element", { opacity: 0 });
  } else {
    // Fallback — no animation, just show it
    document.querySelector(".element").style.opacity = "1";
  }
</script>
```

This only works with the CDN approach where `gsap` is a global. With npm imports, GSAP is always available if installed — no need to check.

### ScrollTrigger.refresh()

After dynamically changing layout (opening accordions, switching tabs, loading content), call `ScrollTrigger.refresh()` to recalculate trigger positions:

```js
// After a layout change
if (typeof ScrollTrigger !== "undefined") {
  ScrollTrigger.refresh();
}
```

Without this, scroll-triggered animations may fire at wrong positions because ScrollTrigger cached the old layout measurements.

---

## 35. Third-party scripts with Partytown

Third-party scripts — analytics, tag managers, chat widgets, ad pixels — run on every page and do work your users never directly interact with. But they execute on the **main thread**, the same thread that renders your UI and responds to clicks. Heavy third-party scripts show up in Lighthouse as **Total Blocking Time (TBT)** and hurt your **Interaction to Next Paint (INP)** score.

**Partytown** is an Astro integration that moves those scripts off the main thread and runs them inside a **web worker**. The DOM access they need is proxied back via `postMessage`. From the script's perspective, nothing changed — from your page's perspective, the main thread is free.

### When it's a good fit

- Analytics (Google Analytics, Plausible, Mixpanel, Fathom)
- Tag managers (GTM, Segment)
- Chat widgets (Intercom, Drift) — if they don't need instant UI response
- Ad / conversion pixels (Meta, LinkedIn, TikTok)

### When it's NOT a good fit

- Scripts that read layout synchronously (`window.scrollY`, `getBoundingClientRect` in a tight loop)
- Scripts that use `document.write` or synchronous XHR
- Scripts that need to intercept user input with zero latency
- Scripts your own code calls frequently — every call crosses a postMessage boundary (~1ms hit per call)

Rule of thumb: if it fires events but doesn't read the DOM, Partytown works. If it continuously observes the DOM, keep it on the main thread.

### Install it

```bash
npx astro add partytown
```

Or manually:

```bash
npm install @astrojs/partytown
```

Then add it to `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";

export default defineConfig({
  integrations: [
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
});
```

### The `forward` config — the one thing most people miss

Scripts in the worker can't write directly to `window` on the main thread. So if a script sets `window.dataLayer` and pushes events to it, those pushes happen in the worker's isolated `window`, not yours. Result: events silently disappear.

**`forward`** tells Partytown: "when the script calls `dataLayer.push(...)`, proxy that call back to the main thread so it reaches the real `dataLayer`."

Common forwards:

```js
partytown({
  config: {
    forward: [
      "dataLayer.push",     // Google Analytics / GTM
      "gtag",               // Some gtag.js setups
      "fbq",                // Meta Pixel
      "_hsq.push",          // HubSpot
      "Intercom",           // Intercom
    ],
  },
})
```

Always check the third-party script's docs for the global it writes to. Miss this and the script appears to work (no errors) but your analytics dashboard stays empty.

### Use it — change `<script>` to `type="text/partytown"`

Regular inline script (main thread):

```astro
<script is:inline async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
```

Same script in the worker (Partytown):

```astro
<script type="text/partytown" async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
```

That's literally the only change. Partytown sees the `text/partytown` MIME type, intercepts the script, and runs it in the worker instead.

### Full gtag example with an env variable

The measurement ID is environment-specific and you probably don't want it hardcoded. Put it in `.env`:

```
PUBLIC_GTAG_ID=G-XXXXXXXXXX
```

> The `PUBLIC_` prefix is required — Astro only exposes env vars with that prefix to client-side code. Without it, `import.meta.env.PUBLIC_GTAG_ID` is `undefined` in the browser.

Then in `src/layouts/Layout.astro`:

```astro
---
const gtagId = import.meta.env.PUBLIC_GTAG_ID;
---

<html lang="en">
  <head>
    <title>{title}</title>

    {gtagId && (
      <>
        <script type="text/partytown" async src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}></script>
        <script type="text/partytown" define:vars={{ gtagId }}>
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', gtagId);
        </script>
      </>
    )}
  </head>
  <body>
    <slot />
  </body>
</html>
```

Two Astro-specific details:

- **`{gtagId && (...)}`** — if the env var isn't set (local dev without `.env`), render nothing. No broken `id=undefined` request, no console noise.
- **`define:vars={{ gtagId }}`** — Astro's safe way to inject a server-side value into a client script. It generates `const gtagId = "G-XXXXXX";` at the top of the script body. Don't use string interpolation inside a script tag — that breaks if the value has quotes or newlines and is harder to read.

### Verifying it's working

1. Open DevTools → **Network** tab.
2. Reload the page. You should see requests to `/~partytown/partytown.js` and `/~partytown/partytown-sw.js` — that's the Partytown runtime and its service worker.
3. In the **Application** tab → **Service Workers**, you should see a worker registered at `/~partytown/`.
4. For gtag specifically: install the **Google Analytics Debugger** extension, or watch the Network tab for requests to `google-analytics.com/g/collect`. If those fire, events are reaching the real `dataLayer` via `forward`.
5. Run Lighthouse before and after. TBT should drop noticeably on sites with multiple third-party scripts.

### Gotchas

- **Service worker scope** — Partytown registers a service worker at `/~partytown/`. If you host under a subpath, you may need to configure `base` in Astro and `lib` in Partytown's config to match.
- **Dev mode feels the same** — Partytown's benefit shows up on real production builds under real network conditions. Don't judge the performance win from `npm run dev`.
- **Debugging** — errors from worker scripts show up in DevTools with a slightly different stack trace. Use `debug: true` in Partytown config during development to log everything the worker does.
- **CSP headers** — if you set a strict Content-Security-Policy, you'll need to allow `'self'` for workers and the third-party script origins, same as before.
- **One worker per origin** — Partytown runs all your `type="text/partytown"` scripts in a single shared worker. They share the same `window` proxy, which is usually what you want.

### Mental model

Think of Partytown as a second, slower, isolated copy of `window` running in a different thread. Scripts run there feel normal to themselves. Any time they touch the real DOM, that call crosses a bridge. Cheap events (pushes to an array) are fine. Chatty DOM observation is not. Pick your scripts accordingly.

---

## 36. Navigation patterns — from basic nav to dropdowns + mega menus

Navigation is the component that teaches you almost every Astro + Tailwind pattern: semantic HTML, conditional rendering from a data array, client-side JS for interactivity, responsive layouts, accessibility, and grid-based alignment. Build one and you've touched everything.

This section walks through the architecture in layers. Start at the bottom; add layers only when you need them.

### Layer 1 — the markup skeleton

Every nav has the same bones: a semantic `<header>` wrapper for positioning, a visible bar inside, a logo, a link list, and a CTA.

```astro
<header class="fixed inset-x-0 top-0 z-50">
  <div data-nav-bar class="flex h-14 items-center justify-between">
    <a href="/">Logo</a>
    <nav><!-- links --></nav>
    <a href="/signup">Get started</a>
  </div>
</header>
```

Two layers of element intentionally:
- **`<header>`** owns positioning (fixed, z-index, full width).
- **`<div data-nav-bar>`** owns visuals (height, background, border, rounded corners).

Why split? Because the header needs to span full viewport for `fixed` to work correctly, but the visible bar often needs a max-width. Separating the concerns keeps each element responsible for one thing.

### Layer 2 — links as a data array

Inline markup works for 3 links. For anything more, pull the data out:

```astro
---
const links = [
  { label: "Products", href: "/products" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];
---

<nav>
  {links.map((link) => (
    <a href={link.href}>{link.label}</a>
  ))}
</nav>
```

One place to edit, one place to style. Adding a link is a one-line change.

**Why not JSON?** You'll want to add children, icons, imports, or type safety eventually. A `.ts` file (or an inline TS `const` like above) gives you all of that for free. JSON only wins if non-developers edit the data.

### Layer 3 — three kinds of nav links

Real nav has three archetypes:

1. **Plain link** — `<a href="/pricing">Pricing</a>`. No children.
2. **Menu dropdown** — single column of links, positioned directly under the trigger. Think "Company → About / Careers / Blog / Contact".
3. **Mega menu** — multi-column panel spanning the full nav width. Think "Products → 3 columns of categories, each with 4 items and descriptions".

To render all three from one data array, **tag each entry with a `type` discriminator**:

```ts
type PlainLink = { label: string; href: string };

type MenuLink = {
  label: string;
  type: "menu";
  id: string;
  items: { label: string; href: string }[];
};

type MegaLink = {
  label: string;
  type: "mega";
  id: string;
  columns: {
    heading: string;
    items: { label: string; href: string; description?: string }[];
  }[];
};

type NavLink = PlainLink | MenuLink | MegaLink;
```

The `type` field is a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) — TS narrows to the right shape when you check `link.type === "menu"`, so `link.columns` is only available inside the `mega` branch. Autocomplete works perfectly.

### Layer 4 — conditional rendering by type

Map over the array and branch on the discriminator:

```astro
{links.map((link) => {
  if ("type" in link && link.type === "menu") {
    return (
      <div class="relative" data-nav-item>
        <button data-nav-trigger aria-controls={`nav-panel-${link.id}`}>
          {link.label}
        </button>
        <div id={`nav-panel-${link.id}`} data-nav-panel class="absolute top-full hidden">
          {link.items.map((item) => (
            <a href={item.href}>{item.label}</a>
          ))}
        </div>
      </div>
    );
  }

  if ("type" in link && link.type === "mega") {
    return (
      <div data-nav-item>
        <button data-nav-trigger aria-controls={`nav-panel-${link.id}`}>
          {link.label}
        </button>
        {/* Mega panel is rendered elsewhere — see below */}
      </div>
    );
  }

  // Plain link fallback
  return <a href={link.href}>{link.label}</a>;
})}
```

**Key detail:** for **menu** dropdowns, the panel is nested inside the trigger's wrapper (`<div class="relative">`). For **mega** dropdowns, only the trigger renders here — the panel itself lives elsewhere because of how positioning works.

### Layer 5 — why menu panels nest but mega panels don't

This is the architectural insight that makes dropdowns click.

**Menu panel** (single column, small, pinned under trigger):
- Lives inside a `<div class="relative">` wrapper
- Uses `class="absolute left-0 top-full"`
- `absolute` positions against the nearest *positioned* ancestor, which is the `relative` wrapper
- Result: panel appears exactly below the trigger, left-aligned to it

**Mega panel** (full-width, spans the whole nav):
- Cannot live inside the trigger's wrapper — that wrapper is only as wide as the trigger text, and `inset-x-0` inside it would span that narrow area, not the full nav
- Must be a **sibling of the bar**, positioned relative to the `<header>` itself
- Uses `class="absolute inset-x-0 top-full"` on the panel, where "nearest positioned ancestor" is now the `fixed` header

So in the component, mega panels render in a separate block **after** the bar:

```astro
<header>
  <div data-nav-bar>
    {/* triggers including mega triggers */}
  </div>

  {/* Mega panels rendered outside the bar */}
  {links
    .filter((link) => "type" in link && link.type === "mega")
    .map((link) => (
      <div id={`nav-panel-${link.id}`} data-nav-panel class="absolute inset-x-0 top-full hidden">
        {/* columns with items */}
      </div>
    ))
  }
</header>
```

The trigger inside the bar has `aria-controls={nav-panel-${link.id}}` pointing to its panel by id. JS uses that attribute to find which panel to open when the trigger is hovered or clicked. **The DOM relationship is by id, not by parent-child nesting.** This decoupling is what lets mega and menu panels coexist.

### Layer 6 — the script: one handler for both dropdown types

Because every trigger has `aria-controls`, the script is type-agnostic:

```js
const triggers = document.querySelectorAll("[data-nav-trigger]");

const closeAllDropdowns = () => {
  triggers.forEach((t) => {
    t.setAttribute("aria-expanded", "false");
    const id = t.getAttribute("aria-controls");
    if (id) document.getElementById(id)?.classList.add("hidden");
  });
};

triggers.forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const id = trigger.getAttribute("aria-controls");
    const panel = document.getElementById(id);
    const willOpen = panel.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) {
      panel.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});
```

No branching on "is this a mega or menu?" — the script doesn't care. It just finds the panel via id and toggles `hidden`. This is the payoff of the `aria-controls` pattern.

### Layer 7 — hover-to-open with intent

Click-to-open is fine on mobile. On desktop, users expect hover. Add two constants and a state machine:

```js
const HOVER_ENTER = 100;  // ms to wait before opening on hover
const HOVER_LEAVE = 150;  // ms to wait before closing on leave
let hoverTimer, leaveTimer;

const anyDropdownOpen = () =>
  Array.from(triggers).some((t) => t.getAttribute("aria-expanded") === "true");

triggers.forEach((trigger) => {
  trigger.addEventListener("mouseenter", () => {
    clearTimeout(leaveTimer);
    clearTimeout(hoverTimer);
    // If another dropdown is already open, switch instantly (no delay).
    // Otherwise wait for hover intent so sweeping the cursor doesn't flash panels.
    const delay = anyDropdownOpen() ? 0 : HOVER_ENTER;
    hoverTimer = setTimeout(() => openDropdown(trigger), delay);
  });
});

// Track leave on both the trigger wrapper AND the panel
// so moving between them doesn't close the dropdown
[...navItems, ...allPanels].forEach((el) => {
  el.addEventListener("mouseenter", () => clearTimeout(leaveTimer));
  el.addEventListener("mouseleave", () => {
    leaveTimer = setTimeout(closeAllDropdowns, HOVER_LEAVE);
  });
});
```

**Three things worth understanding:**

1. **Hover intent delay** (`HOVER_ENTER = 100`) prevents accidental opens when the user sweeps the cursor across the nav. Too low and panels flash; too high and the nav feels sluggish. 80–120ms is the sweet spot.

2. **Close delay** (`HOVER_LEAVE = 150`) gives the user time to move from the trigger *down into* the panel without it closing. If the trigger is at `y: 56px` and the panel starts at `y: 80px` (with an 8px gap), the cursor needs a moment to travel. 150ms covers typical mouse speeds.

3. **Instant switching** (`anyDropdownOpen() ? 0 : HOVER_ENTER`) — once a user has committed to "I'm browsing dropdowns," further hovers switch instantly. That's the standard pattern in every large nav you've used (GitHub, Stripe, Vercel).

### Layer 8 — the "hover bridge" problem

If the trigger and panel have a visible gap between them, the cursor falls through the gap as it travels from one to the other. The `mouseleave` fires, the close timer starts, and by the time the cursor reaches the panel, the panel is closing.

**Fix:** either remove the gap or extend the hover area across it.

Best approach: **use padding, not margin**, for the visual gap. Instead of:

```astro
<div class="panel mt-2 ...">
```

Do:

```astro
<div class="panel top-full ...">
  <div class="pt-2">
    <div class="actual-card-styles">...</div>
  </div>
</div>
```

The outer `pt-2` is part of the panel's hit area but visually transparent. The cursor never leaves the panel when crossing from trigger to visible card. No hover bridge bug.

### Layer 9 — keyboard accessibility

A click-only nav excludes keyboard users. Two things to add:

**On the trigger:**
```js
trigger.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (state.activePanel === trigger.dataset.id) closeDropdown();
    else openDropdown(trigger);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    openDropdown(trigger);
    // Move focus into the first link in the panel
    setTimeout(() => panel.querySelector("a")?.focus(), 80);
  }
});
```

**On the panel's links:**
```js
panel.addEventListener("keydown", (e) => {
  const links = [...panel.querySelectorAll("a")];
  const idx = links.indexOf(document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    links[(idx + 1) % links.length].focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (idx <= 0) trigger.focus();
    else links[idx - 1].focus();
  }
});
```

**Global Escape to close:**
```js
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllDropdowns();
    getActiveTrigger()?.focus();  // return focus to the trigger
  }
});
```

This is the minimum for keyboard-accessible dropdowns. ARIA attributes (`aria-expanded`, `aria-controls`, `aria-haspopup`) should already be on the trigger from the markup.

### Layer 10 — responsive behavior (mobile)

On mobile, hover doesn't exist and dropdown panels wouldn't fit next to the trigger. Two choices:

**A — Hide the desktop panels, show a hamburger**
```astro
<nav class="hidden md:flex">{/* desktop links */}</nav>

<button data-nav-toggle class="md:hidden">☰</button>

<div data-nav-mobile class="md:hidden hidden">
  {/* Mobile menu — flat list of all links */}
  {links.map((link) => <a href={link.href || "#"}>{link.label}</a>)}
</div>
```

Simple, works for most marketing sites. Trade-off: mobile users don't see the dropdown children (just the top-level labels).

**B — Mobile gets a full-screen overlay with a "drill-down" pattern**
Clicking "Products" on mobile opens a full-screen panel that replaces the main menu. A "Back" button returns to the top level. This is the pattern Stripe and Vercel use. It's more code but feels native.

For option B, you need:
- Mobile panel list (flat)
- Mobile panel detail (one per dropdown)
- JS state for "which panel is active"
- CSS transitions for slide-in/out

Start with option A. Graduate to B only if you have rich dropdowns whose contents are actually useful to mobile users.

### Layer 11 — grid-based alignment

If your page uses a CSS grid for section layout (column 3 at `minmax(0, 90rem)` for content, gutter columns for decoration), your nav needs to align with the same content column. Two approaches:

**A — Wrap the bar in `container-page`** (a utility that mirrors col-3's max-width):
```css
@utility container-page {
  @apply mx-auto w-full max-w-[90rem];
}
```
Then: `<div data-nav-bar class="container-page">`. Simple but doesn't auto-follow grid changes.

**B — Make the header itself a section grid** and place children into `col-start-3`:
```astro
<header class="section-grid-outside fixed inset-x-0 top-0 z-50">
  <div data-nav-bar class="col-start-3">...</div>
</header>
```
The nav inherits the grid's geometry exactly — change the grid definition once and the nav follows.

**Gotcha with option B:** every direct child of the header that isn't `position: absolute` needs `col-start-3` (or `col-span-full` if it should span everything). Without it, CSS grid auto-placement sticks the element into the next empty cell — which might be a 1rem gutter, squishing it to 16px wide. The mega panels escape this because they're `absolute` and removed from grid flow. The mobile panel and any other non-absolute children must opt in explicitly.

**Responsive column placement:** if you want the bar to be in col-3 on desktop but span full-width on mobile:
```astro
<div class="col-span-full md:col-span-1 md:col-start-3">
```
- `col-span-full` at mobile = `grid-column: 1 / -1`
- `md:col-span-1` resets the span to 1 column at md+
- `md:col-start-3` places that single column at col 3

The `md:col-span-1` is the line people forget. Without it, `md:col-start-3` only overrides the start, leaving the end at `-1`, so the bar would span cols 3→5 on desktop. Learn this once; you'll use it every time you mix responsive with grid placement.

### Layer 12 — scroll-aware state

A fixed nav usually needs to change appearance when the user scrolls (background appears, border darkens, shadow lifts). The cleanest pattern:

**CSS owns the appearance:**
```css
[data-nav-bar].is-scrolled {
  border-color: var(--color-grid-border);
  background-color: color-mix(in oklab, var(--color-bg) 70%, transparent);
  backdrop-filter: blur(24px);
  box-shadow: 0 8px 30px -10px rgba(0, 0, 0, 0.6);
}
```

**JS only toggles one class:**
```js
let isScrolled = false;
const update = () => {
  const scrolled = window.scrollY > 12;
  if (scrolled === isScrolled) return;
  isScrolled = scrolled;
  navBar.classList.toggle("is-scrolled", scrolled);
};
window.addEventListener("scroll", update, { passive: true });
```

**Four things to notice:**

1. **Styles live in CSS, not JS.** JS flips a state flag; everything else is CSS. You can change the scrolled appearance without touching the script.
2. **Short-circuit when unchanged.** The `isScrolled === scrolled` check prevents the `classList.toggle` from running 60 times/second on a long scroll.
3. **`{ passive: true }`** tells the browser the handler won't call `preventDefault`, so it can scroll without waiting for the handler to finish. Free performance.
4. **Transition the bar classes, not the state class.** The bar itself has `transition-all duration-300` so when `.is-scrolled` is added/removed, properties animate over 300ms.

### Putting it together — the file structure

For a nav with all the above layers, the file breaks down into:

1. **Frontmatter** — TypeScript types + link data array (~50 lines)
2. **Markup** — header → bar → triggers and links → mega panels (outside) → mobile panel (~100 lines)
3. **`<style>`** — scroll-aware state rules (~10 lines)
4. **`<script>`** — hover/click/keyboard handlers, mobile toggle, scroll listener (~100 lines)

Total: ~250–400 lines depending on features. One file, one component, one place to change anything.

### Common mistakes to avoid

- **Stopping at one level of nesting.** The `<header>` + `<div data-nav-bar>` split looks redundant but separates positioning from appearance. You'll thank yourself when you add `backdrop-filter`, because blur applies to backgrounds, and the outer header has no background.
- **Putting mega panels inside their trigger wrapper.** They'll span only the trigger's width. Mega panels belong as siblings of the bar.
- **Toggling many classes in JS** (`classList.toggle("bg-white")`, `.toggle("shadow")`, etc.) instead of one state class. Move styles to CSS and toggle one flag.
- **Using `absolute` without a positioned ancestor.** Every dropdown panel needs either `relative` on its wrapper or a `fixed`/`absolute` ancestor that serves as the positioning context.
- **Forgetting `e.stopPropagation()` on trigger clicks.** Without it, the document-level "click outside closes" handler fires immediately after the trigger's click handler — you open the dropdown and close it in the same tick.
- **Silent Tailwind typos.** `align-items-center` is not a class. `items-center` is. Tailwind doesn't throw on unknown classes — they just do nothing. Whenever a style "isn't working," first verify the class actually exists.

### The golden rule

Build the nav in layers, starting from the markup skeleton. Add a feature, verify it works, commit. Then add the next feature. **Do not try to write a 400-line nav in one pass** — you'll miss a bug in layer 3 and spend an hour debugging what you broke in layer 7.

Every layer above is a natural commit boundary. Each one is testable on its own:

- Layer 1: "does the bar render?"
- Layer 2: "does adding a link to the array add a link to the UI?"
- Layer 3: "can I pick menu vs mega from the data?"
- Layer 4: "do both dropdown types render correct markup?"
- Layer 5: "is the mega panel the full nav width?"
- Layer 6: "does clicking a trigger open its panel?"
- Layer 7: "does hovering open with intent delay?"
- Layer 8: "can I move from trigger to panel without it closing?"
- Layer 9: "can I navigate with the keyboard?"
- Layer 10: "does the mobile hamburger work at md breakpoint?"
- Layer 11: "does the bar align with sections at every viewport?"
- Layer 12: "does the bar change appearance when scrolling?"

Twelve commits, each one green before the next one starts. That's how you ship a nav without losing a weekend.

---

## 37. Sharing config between components (Nav + Footer)

The Nav in this starter keeps all its data — links, CTA, home URL — inline in the component's frontmatter. That's deliberate: for one component on one site, inline is the shortest path from "I need to change a link" to "done."

But eventually you'll hit the case where **Nav and Footer want the same data**. Both link to `/pricing`, `/docs`, `/blog`, `/contact`. You update one place and forget the other — now your footer says "Changelog" while the nav says "What's New." That's when config extraction earns its keep.

This section walks through doing it properly, and — just as important — when NOT to bother.

### The tradeoff: inline vs extracted

| When                                             | Pick                |
| ------------------------------------------------ | ------------------- |
| Only one component uses the data                 | Inline              |
| Two+ components share the same data              | Extract to `lib/`   |
| Two+ components have *overlapping* data          | Extract the overlap |
| Two+ components have totally different data      | Inline each         |
| You want to re-skin the component without losing local edits | Extract     |

The point of extraction isn't "cleanliness" — it's **one source of truth for data that's referenced in multiple places**. If there's only one place, there's nothing to share, and the extra file is just indirection.

### Step-by-step: extract shared links for Nav + Footer

Let's say you already have an inline Nav (like this starter's). You're about to build a Footer. Both will link to "Pricing", "Docs", and "Changelog" from the top-level nav, and both care about the list of company pages ("About", "Careers", "Blog", "Contact").

#### Step 1 — identify what's actually shared

Before writing any config file, list the data that appears in *both* components:

| Data                                     | Nav | Footer |
| ---------------------------------------- | --- | ------ |
| Top-level links (Pricing, Docs, …)       | ✅  | ✅     |
| Company links (About, Careers, …)        | ✅  | ✅     |
| CTA button ("Get a Demo")                | ✅  | ❌     |
| Mega-menu "Products" columns             | ✅  | ❌     |
| Social media icons                       | ❌  | ✅     |
| Legal links (Privacy, Terms)             | ❌  | ✅     |
| Copyright line                           | ❌  | ✅     |

The rows with ✅ in both columns are what deserves extraction. Everything else stays in its own component. Don't extract "all nav data" or "all footer data" as blobs — extract the overlap.

#### Step 2 — create the shared file

```ts
// src/lib/siteLinks.ts

export type SiteLink = { label: string; href: string };

export const topLinks: SiteLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
];

export const companyLinks: SiteLink[] = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
```

Notes:
- **One type, shared.** `SiteLink` is the shape both components consume. Adding a `description?: string` later means both components get it for free.
- **Export named, not default.** Default exports are anonymous when you grep. Named exports keep things searchable.
- **Small scope.** Only what's actually shared lives here. Not the whole nav config.

#### Step 3 — Nav imports and extends

Nav has its own structure (mega panels, menu dropdowns) on top of the plain links. So Nav composes:

```astro
---
// src/components/Nav.astro
import { topLinks, companyLinks, type SiteLink } from "../lib/siteLinks";

type MegaLink = {
  label: string;
  type: "mega";
  id: string;
  columns: { heading: string; items: SiteLink[] }[];
};

type MenuLink = {
  label: string;
  type: "menu";
  id: string;
  items: SiteLink[];
};

type NavLink = SiteLink | MenuLink | MegaLink;

const links: NavLink[] = [
  {
    label: "Products",
    type: "mega",
    id: "products",
    columns: [
      { heading: "Platform", items: [/* mega-only items */] },
    ],
  },
  {
    label: "Company",
    type: "menu",
    id: "company",
    items: companyLinks,    // ← shared data
  },
  ...topLinks,              // ← shared data spread as plain links
];
---
```

The mega-menu data is Nav-only, so it stays in Nav's frontmatter. The company dropdown pulls from the shared array. The top-level links spread from the shared array. Nav renders its own layout; the data flows in from one source.

#### Step 4 — Footer consumes the same data

```astro
---
// src/components/Footer.astro
import { topLinks, companyLinks, type SiteLink } from "../lib/siteLinks";

// Footer-only data stays inline:
const legalLinks: SiteLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const copyright = "© 2026 Miscreants";
---

<footer class="border-t border-stroke py-16">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
    <div>
      <h3 class="font-semibold mb-3">Product</h3>
      <ul class="flex flex-col gap-2">
        {topLinks.map((link) => (
          <li>
            <a href={link.href} class="text-fg-muted hover:text-fg">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h3 class="font-semibold mb-3">Company</h3>
      <ul class="flex flex-col gap-2">
        {companyLinks.map((link) => (
          <li>
            <a href={link.href} class="text-fg-muted hover:text-fg">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h3 class="font-semibold mb-3">Legal</h3>
      <ul class="flex flex-col gap-2">
        {legalLinks.map((link) => (
          <li>
            <a href={link.href} class="text-fg-muted hover:text-fg">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </div>

  <p class="mt-8 text-sm text-fg-subtle">{copyright}</p>
</footer>
```

Same `topLinks`, same `companyLinks`. Rename "Contact" → "Get in touch" in `siteLinks.ts` and both components update on the next build.

#### Step 5 — the real win: types

The unsung benefit of extraction isn't the data — it's the type. Once `SiteLink` is defined once:

- A future `Breadcrumb.astro` imports it.
- A future `SiteMap.astro` imports it.
- A `sitemap.xml` endpoint loops over `[...topLinks, ...companyLinks]` to generate the feed.
- An A/B test imports the list and swaps labels based on a flag.

The type is a contract. Anything that speaks `SiteLink` speaks to everything else.

### Variation: when nav and footer have totally different links

What if the Nav links to "Pricing, Docs, Changelog" and the Footer links to "Jobs, Press, Investor Relations" — no overlap at all?

Then **you don't extract**. Each component keeps its own inline array. `src/lib/siteLinks.ts` doesn't get created. Don't make a file just because "sharing feels organized." You'd be paying the indirection cost for zero benefit.

But if there's even *one* thing in common — say, the company logo and its `href="/"` — extract only that:

```ts
// src/lib/siteLinks.ts
export const homeHref = "/";
export const logoSrc = "/logo.svg";
```

Two lines. Both components import those two constants. Nav keeps its own link array inline; Footer keeps its own inline. The shared file is exactly the size of the overlap.

### Gotchas

**1. Circular imports.** If `Nav.astro` imports from `siteLinks.ts`, nothing in `siteLinks.ts` should import from any component. Keep `lib/` a leaf: data-only, no UI imports, no framework dependencies.

**2. Relative paths.** From `src/components/Nav.astro`, the import is `"../lib/siteLinks"`. You can set up a TypeScript path alias (`@/lib/siteLinks`) in `tsconfig.json` — worth it once you have more than a few `../../` climbs, overkill before that.

**3. Types vs values.** Use `import { type SiteLink }` (or `import type`) for types-only imports. It tells the bundler "this is erased at build time" and prevents accidental import cycles. Values (`topLinks`, `companyLinks`) don't need it.

**4. Don't mix data and helpers.** If you later add `getLinkByHref()` or `filterByCategory()`, put those in a separate file (`src/lib/links.ts`) or inline them in the consumer. `siteLinks.ts` should stay boring data so you can re-read it in 2 seconds.

**5. Don't pre-commit.** You don't need the shared file on day 1. Build Nav inline. Build Footer inline. The day you find yourself ctrl-F'ing "/pricing" across two files, that's when you extract. The pattern works best as a response to a concrete duplication, not an anticipation of one.

### Why this starter keeps Nav inline

This starter kept Nav inline because:
1. There's currently no Footer component consuming the same data.
2. Adding `src/lib/navConfig.ts` for a single consumer is ceremony with no payoff — one extra file to open, one extra import to read, one extra mental hop.
3. When the Footer lands, we'll extract whatever actually overlaps. Not the whole nav config — just the overlap.

**The general principle:** prefer inline until a second consumer shows up. Then extract exactly what's shared, not more. Resist the urge to invent a "nice architecture" ahead of the actual need. Premature abstraction is just as expensive as premature optimization.

---

## 38. Forwarding HTML attributes on wrapper components

One of the most confusing Astro quirks: you write a custom component, pass it `data-theme="dark"` (or `id="hero"`, or `aria-labelledby="..."`), and nothing happens. No error, no warning — the attribute is just silently dropped.

This section explains why, how to fix it, and when you should *not* bother.

### The problem in one example

Say you have this wrapper component:

```astro
---
// src/components/Section.astro
interface Props {
  padding?: "sm" | "md" | "lg";
}
const { padding = "md" } = Astro.props;
---

<section class={`py-${padding === "sm" ? 8 : padding === "lg" ? 24 : 16}`}>
  <slot />
</section>
```

Now a caller writes:

```astro
<Section id="hero" data-theme="dark" aria-labelledby="heading-1">
  <h2 id="heading-1">Welcome</h2>
</Section>
```

The caller expects that `<section>` in the DOM to have `id="hero"`, `data-theme="dark"`, and `aria-labelledby="heading-1"`. None of them appear. The rendered HTML is:

```html
<section class="py-16">
  <h2 id="heading-1">Welcome</h2>
</section>
```

Three attributes: gone.

### Why Astro does this

Astro components are **opt-in passthrough**. Props come in via `Astro.props`, and the component author decides what to do with them. Anything not explicitly rendered never reaches the DOM.

Contrast with other frameworks:
- **Vue**: opt-*out*. Unknown attributes cascade to the root element unless you set `inheritAttrs: false`.
- **React**: opt-*in*, like Astro. You have to spread `{...rest}` yourself.
- **Plain HTML**: the browser always keeps attributes the author wrote.

Astro's choice makes sense for safety: a parent passing `style="color: red"` or `class="broken"` shouldn't accidentally blow up a child component's own styling. But it surprises newcomers every time — especially when debugging a theme toggle, a test harness attribute, or an aria hook that looks fine in the source but isn't in the DOM.

### The fix: extend `HTMLAttributes` and spread the rest

Two changes to your component:

```astro
---
// src/components/Section.astro
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"section"> {   // ← 1
  padding?: "sm" | "md" | "lg";
}

const {
  padding = "md",
  class: className,                                    // ← optional: handle class explicitly
  ...rest                                              // ← 2a: capture the rest
} = Astro.props;
---

<section {...rest} class:list={[className, `py-${padding === "sm" ? 8 : padding === "lg" ? 24 : 16}`]}>
  <slot />
</section>
```

**What each piece does:**

1. **`extends HTMLAttributes<"section">`** tells TypeScript that this component accepts everything a real `<section>` accepts — `id`, `class`, `style`, `data-*`, `aria-*`, event handlers, and so on. Without this, `<Section id="..." aria-labelledby="...">` would get a "property does not exist on type Props" squiggle from the editor.

2. **`...rest` in destructuring** collects every prop you didn't explicitly name. `padding` is yours; `id`, `data-theme`, `aria-labelledby` all end up in `rest`.

3. **`{...rest}` on the `<section>`** spreads those collected attributes onto the rendered element. Now every HTML attribute the caller wrote lands on the DOM.

**Why `class: className` is usually handled separately:** `class` is a reserved word in JavaScript, so you can't just `{ class }`. Rename with `class: className`, then put it in `class:list` alongside your component's own classes. If you leave it in `...rest`, Astro will put it on the element but overwrite any classes the component itself wanted.

### What about typing data-* attributes?

`HTMLAttributes` includes an index signature for `data-*` and `aria-*`, so these all type-check out of the box:

```astro
<Section data-theme="dark" data-analytics-id="hero-01" aria-labelledby="h1" />
```

No `[key: string]: any` hacks required.

### Test it yourself

Before the fix, open devtools and inspect the `<section>`. Attribute missing.

After the fix, same inspection. Attribute present. This is the entire mechanism — one type import, one `...rest` capture, one spread.

### When to add this, when not

**Add passthrough to:**
- **Layout wrappers** — `Section`, `Container`, `Grid`, `Stack`, `Flex`, anything that's basically "a styled `<div>` or `<section>`". These are exactly the places callers want to set `id` for anchor links, `data-theme` for scoped dark mode, `aria-labelledby` for landmark semantics, etc.
- **Generic cards** — `Card`, `Panel`. Same reasoning.

**Skip it on:**
- **Curated primitives** — `Button`, `Input`, icon wrappers. You've deliberately chosen which attrs are meaningful (`href`, `disabled`, `type`). Exposing *all* native attrs blurs the contract and invites callers to pass `style="..."` or `onclick="..."` where the component has its own opinion.
- **Components with their own markup contract** — `Accordion`, `Tabs`, `Nav`. They own the internal structure; forwarding an arbitrary `id` to "whichever root they render" is usually noise and can conflict with the IDs the component generates internally.
- **Tiny display components** — `Logo`, `Badge`. No call site needs arbitrary passthrough; the footprint isn't worth it.

**Rule of thumb:** if the component is "a `<div>` / `<section>` with slots and some classes," add passthrough. If it owns behavior (keyboard nav, dynamic state, curated API), keep it closed.

### A real example

When I wanted a section-scoped dark mode with `<SectionMain data-theme="dark">`, nothing happened. The `data-theme` attribute never reached the rendered `<section>`. The fix was exactly the pattern above:

```astro
---
// src/components/SectionMain.astro
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"section"> {
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  // ... other custom props ...
}

const {
  padding = "md",
  // ... other destructured props ...
  class: className,
  ...rest
} = Astro.props;
---

<section {...rest} class:list={["section-grid-outside", borderTop && "border-t border-stroke", className]}>
  <!-- ... -->
</section>
```

After that change, `<SectionMain data-theme="dark">` actually wrote `data-theme="dark"` to the DOM, the CSS vars inside the scope re-resolved to dark values, and the whole section flipped without touching any other component.

### The combined mental model

The passthrough pattern is one of three layers that together make feature-rich wrapper components:

| Layer            | What it does                                           | Where             |
|------------------|--------------------------------------------------------|-------------------|
| **Type surface** | `extends HTMLAttributes<"section">` adds native attrs  | Component frontmatter |
| **Data capture** | `...rest` collects unspecified props                   | Component frontmatter |
| **DOM landing**  | `{...rest}` on the rendered element                    | Component template |

Miss any one of them and the pattern doesn't work. Type surface without capture: TypeScript is happy but the attrs still vanish. Capture without spread: attrs sit unused in a variable. Spread without type surface: the editor underlines the caller.

Once you internalize the pattern, you'll reach for it instinctively on every new wrapper component — and stop being surprised that `id` and `data-*` "don't work" on your custom components.

---

## 39. MDX & component showcase pages

When you start building a starter with more than ~10 components, you'll want a way to *browse* them — see what's in the kit, read each one's API, and (crucially) see them rendered live. The `/components/` route in this project is built from three Astro features working together: **content collections**, **MDX**, and **dynamic routes**. Each does one job. This section walks through how they compose.

### Why this is hard without MDX

The first instinct most people have for component documentation is "I'll write a markdown file per component, plus a separate playground page." That gets you docs + live demos, but they're disconnected: the markdown describes the component, the playground renders it, and they drift over time. The example in the docs claims a prop exists; the playground uses a renamed version. Six months in, you can't tell which is current.

MDX collapses this into a single file. The doc *is* the demo — you `import` the actual component into the markdown and render it inline next to its prose description. There's no second source of truth to keep in sync.

### What MDX actually is

MDX is a file format: **Markdown body + JSX-style component tags + ES module imports at the top**. The Markdown still works exactly like a normal `.md` file — headings, paragraphs, lists, code fences, tables — but you can also write JSX-flavored markup that renders real components.

A typical entry in this project's showcase:

```mdx
---
title: AccordionMorph
description: Native <details> accordion with a bouncy spring animation.
category: pattern
order: 30
sourceFile: src/components/AccordionMorph.astro
status: stable
related: []
---

import Preview from "@components/_docs/Preview.astro";
import AccordionMorph from "@components/AccordionMorph.astro";

A native `<details>` accordion with mutually-exclusive open via shared `name`.

## Preview

<Preview label="Default">
  <AccordionMorph items={[
    { title: "Item one", description: "…" },
    { title: "Item two", description: "…" },
  ]} />
</Preview>

## Why native `<details>`

Native `<details>` gives you keyboard, focus, and screen-reader semantics for free.
```

Three regions to spot:

1. **Frontmatter** — the YAML between `---` markers. Becomes `entry.data` when you query the collection.
2. **Imports** — real ES module imports, same as in any `.astro` or `.tsx` file. The `@components/*` path alias keeps them short.
3. **The body** — mixed Markdown prose and JSX-style tags. `<Preview>` and `<AccordionMorph>` aren't escaped HTML — they're real components that mount when the page renders, with all their CSS and JS intact.

To enable MDX in an Astro project, you install the integration once:

```bash
npx astro add mdx --yes
```

That adds `@astrojs/mdx` to `package.json` and registers `mdx()` in `astro.config.mjs`. After that, any `.mdx` file in `src/content/` or `src/pages/` is recognized.

### Step 1 — Define a content collection

Content collections are Astro's "typed folder of content" feature. You declare in `src/content.config.ts` that a folder of MDX files matches a particular shape:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const components = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/components" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(["primitive", "block", "pattern", "layout", "form"]),
    order: z.number().default(100),
    sourceFile: z.string(),
    status: z.enum(["stable", "adaptable", "per-project"]).default("stable"),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { components };
```

The `loader` tells Astro where to find the files; the `schema` describes the frontmatter Zod-style. Two important consequences:

- If a file's frontmatter doesn't match the schema, the build fails with an error pointing at the offending file. Adding a typo to a category enum is caught immediately.
- The TypeScript types for `entry.data` are generated automatically — autocomplete works inside `index.astro` and `[...slug].astro`.

### Step 2 — Generate one page per entry with a dynamic route

Astro creates one HTML page per `.astro` file in `src/pages/`. Most pages are static (`pages/about.astro` → `/about`). When you want *N* pages generated from data, you use a **dynamic route** — a filename with square brackets:

```
src/pages/components/[...slug].astro
```

The `...` is the rest segment — it matches any path, including slashes. The route handler is then responsible for telling Astro which slugs exist:

```astro
---
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const all = await getCollection("components");
  return all.map((entry) => ({
    params: { slug: entry.id },     // → URL becomes /components/<slug>
    props: { entry },               // → passed to this page as Astro.props
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<Layout title={entry.data.title}>
  <h1>{entry.data.title}</h1>
  <p>{entry.data.description}</p>

  <article class="prose-doc">
    <Content />
  </article>
</Layout>
```

Two parts that do the heavy lifting:

- **`getStaticPaths`** runs at build time. Every object it returns becomes one generated page. The `params` define the URL, the `props` flow into the page as `Astro.props`.
- **`render(entry)`** turns the MDX body into a renderable Astro component called `Content`. Dropping `<Content />` in the template renders the markdown + all the embedded `<Preview>` / `<AccordionMorph>` / etc. components.

Astro evaluates `getStaticPaths` once at dev-server start. The runtime gotcha: **adding a new `.mdx` file mid-session means visiting its URL gives a 404 until you restart `npm run dev`.** Edits to existing files hot-reload fine — only the path-generation step needs the restart.

### Step 3 — The index page

The index is simpler. It reads frontmatter from every entry, groups by category, and renders a card grid. No MDX rendering involved — only `entry.data`:

```astro
---
import { getCollection } from "astro:content";

const all = await getCollection("components");
const categoryOrder = ["primitive", "block", "pattern", "layout", "form"] as const;

const groups = categoryOrder.map((cat) => ({
  category: cat,
  items: all
    .filter((c) => c.data.category === cat)
    .sort((a, b) => a.data.order - b.data.order),
})).filter((g) => g.items.length > 0);
---

{groups.map((group) => (
  <section>
    <h2>{group.category}</h2>
    <ul>
      {group.items.map((item) => (
        <li>
          <a href={`/components/${item.id}/`}>
            <h3>{item.data.title}</h3>
            <p>{item.data.description}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
))}
```

Adding a new component is just a new `.mdx` file — the index picks it up automatically because it's iterating over the whole collection.

### Step 4 — The doc-only helpers (`Preview`, `PropsTable`)

These are normal Astro components in `src/components/_docs/`. The leading underscore is a convention: it makes the folder visually distinct from the public components, and you can use it in conventions/scripts to skip the folder when listing "real" components.

`Preview.astro` wraps a slot in a labeled, framed container so live demos stand out from prose:

```astro
<figure class="not-prose my-6 border border-stroke bg-canvas">
  <figcaption>{label}</figcaption>
  <div class="p-8 flex items-center justify-center">
    <slot />
  </div>
</figure>
```

The `not-prose` class is important — it's the opt-out marker for prose styles. Inside the detail page, every `.prose-doc` selector wraps its target with `:not(:where(.not-prose, .not-prose *))` so prose rules don't bleed into live demos. Without that, an embedded `<AnnouncementBanner>` (with its dark `bg-intent` and white `text-fg-on-intent` link) would get its anchor color overridden by `.prose-doc a` and produce dark-on-dark text.

`PropsTable.astro` accepts a structured array and renders a consistent table — replacing hand-rolled markdown tables that drift in formatting:

```astro
<PropsTable props={[
  { name: "items", type: "Item[]", required: true, description: "…" },
  { name: "name", type: "string", default: "random", description: "…" },
]} />
```

Standard prop fields (`name`, `type`, `default`, `description`, `required`) keep every component's docs structurally identical.

### Step 5 — `prose-doc` styling for MDX bodies

MDX renders markdown to plain HTML — `<h2>`, `<p>`, `<table>`, etc. — without any default styling. You can either install Tailwind Typography or write your own `.prose-doc` rules. This project does the latter, in a `<style is:global>` block on `[...slug].astro`:

```css
.prose-doc :where(h2):not(:where(.not-prose, .not-prose *)) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2.5rem;
}
.prose-doc :where(p):not(:where(.not-prose, .not-prose *)) {
  margin: 0.875rem 0;
  color: var(--color-fg-muted);
  line-height: 1.65;
}
.prose-doc :where(a):not(:where(.not-prose, .not-prose *)) {
  color: var(--color-fg);
  text-decoration: underline;
}
```

The `:where()` keeps specificity at 0 so a live component's own styling always wins. The `:not(:where(.not-prose, .not-prose *))` clause is the Tailwind Typography opt-out pattern — it's what makes prose styles politely stop at the `<Preview>` boundary.

### Mobile overflow gotcha

The article wrapping `<Content />` ends up as a flex item inside SectionMain's flex content column. Flex items default to `min-width: auto`, which means they grow to fit their largest min-content child — long inline code, type signatures, wide tables. On a 375px viewport this pushes the article past the viewport edge.

The fix lives on `.prose-doc` itself:

```css
.prose-doc {
  width: 100%;
  min-width: 0;     /* let the article shrink to its parent */
  max-width: 100%;
}
.prose-doc :where(p, li) > :where(code) {
  overflow-wrap: anywhere;
  word-break: break-word;
}
```

`min-width: 0` releases the flex-item-grows-to-fit-content trap. `overflow-wrap: anywhere` lets long type strings wrap mid-word instead of forcing wider layout. Wide tables still scroll horizontally inside `PropsTable`'s `overflow-x-auto` wrapper — that's intentional, not page-level overflow.

### The whole pipeline, one diagram

```
src/content.config.ts          ← schema for components collection
        │
        ▼
src/content/components/        ← one .mdx file per component
  ├ accordion-morph.mdx
  ├ button.mdx                   each has frontmatter + live demos
  ├ modal.mdx                    in <Preview> blocks
  └ …
        │
        ├─→ getCollection("components")
        │           │
        │           ▼
        │   src/pages/components/index.astro     ← reads only frontmatter
        │                                          renders a card grid
        │
        └─→ getStaticPaths() in [...slug].astro
                    │
                    ▼  for each entry:
                    1. params.slug = entry.id        ← URL
                    2. const { Content } = await render(entry)
                    3. <Content />                   ← MDX body renders
```

### What this approach is good at

- **Single source of truth.** Frontmatter drives the index, the detail page reads `entry.data`, the demo body lives in the same file.
- **Live demos always match the component.** Change a prop's name and the doc breaks at build time (with the schema-validation error pointing at the file), instead of silently lying.
- **Adding a component = creating one file.** No central registry to update, no route definitions to maintain.
- **Components are real Astro/JS imports**, so they ship with their actual styles, scripts, and ARIA wiring — not screenshots, not iframes.

### When this approach is wrong

- **Truly interactive playgrounds** with prop controls (the Storybook "controls" panel) are out of scope. MDX renders one canonical example per `<Preview>`. If you need users to drag sliders to tweak props, build a separate playground page or use Storybook for that.
- **Hundreds of pages of API docs** auto-generated from TypeScript would benefit from a dedicated tool like Typedoc instead of hand-written MDX.
- **Visual regression testing** isn't built in. The previews are real components, but if you want screenshot diffing across PRs, you'll layer Chromatic or Playwright on top.

### Adding a new component to the showcase

The full recipe, in order:

1. Create `src/components/<MyComponent>.astro`.
2. Create `src/content/components/<my-component>.mdx`. Add the frontmatter (title, description, category, order, sourceFile, status, related). Add `import` lines for `Preview`, `PropsTable`, and your component. Write the body — start with a `<Preview>` block showing the live component.
3. Restart `npm run dev` so `getStaticPaths` picks up the new slug. Edits to the file after the restart hot-reload fine.
4. Visit `/components/<my-component>/` to verify, and `/components/` to see it appear in the right category section.

That's it. No registry update, no route file edit, no manual list to maintain. Frontmatter drives everything.

---

## 40. Components with subpieces — when and how to split

Most components in this starter are single files: one `.astro` with frontmatter, markup, scoped style, scoped script. That's the right default. But occasionally you'll write a component that genuinely benefits from being broken into pieces — and there are roughly **four shapes** of "component with subpieces," each with a different reason for splitting. The choice depends on *how the consumer uses the thing*, not just on file size.

### Shape 1 — Compound components (consumer composes the parts)

The classic shadcn / Radix pattern. The wrapper provides shared state and styling; the subpieces are the explicit slots the consumer arranges in any order:

```astro
<Card>
  <Card.Header>
    <Card.Title>Pricing</Card.Title>
    <Card.Description>Pick a plan</Card.Description>
  </Card.Header>
  <Card.Body>
    <p>…</p>
  </Card.Body>
  <Card.Footer>
    <Button>Continue</Button>
  </Card.Footer>
</Card>
```

**File layout:**
```
src/components/
  Card/
    index.astro          ← the parent <Card>
    Header.astro
    Title.astro
    Description.astro
    Body.astro
    Footer.astro
```

**Why split:** the consumer needs control over *which* parts appear and *in what order*. A monolithic `Card` with `title`, `description`, `body`, `footer` props would force a fixed structure — what if you want two titles, or a description above the title? Subpieces let consumers compose freely.

**Astro-specific catch:** Astro doesn't have first-class dot syntax for namespaced components like React's `Card.Header`. You either:
- Import each piece separately: `import { Card, CardHeader, CardTitle } from "@components/Card"` — cleaner imports but more typing.
- Skip dot syntax and have callers import each file directly. Mostly stylistic.

This pattern shines when you need **>3 visually-distinct slots** that can appear in any order. Below 3, plain named `<slot>` attributes on a single component are simpler.

### Shape 2 — Internal subdivisions (parent composes the parts)

The opposite of compound: the consumer interacts with one component, but internally it's split because some pieces have non-trivial logic worth isolating.

```astro
<Tabs id="demo" items={[…]}>
  <slot />
</Tabs>
```

```
src/components/
  Tabs.astro                ← public entry point
  Tabs/
    _TabList.astro          ← renders the tab buttons row
    _TabPanel.astro         ← renders one panel with transition logic
    _useTabsState.ts        ← controller / event wiring
```

**Why split:** the parent has too much going on (URL deep-linking, GSAP slide animations, accordion conversion on mobile) and reading 600 lines of one file is harder than 200 + 200 + 200. The underscore prefix on the inner files signals "private to `Tabs` — don't import directly."

**The honest test for whether this is worth doing:** if a teammate asks "where does the panel-slide animation live?", can they jump straight to the right file from the directory listing? If yes, the split paid off. If they have to grep across multiple files anyway, the split was bookkeeping, not clarity.

### Shape 3 — Variant pieces (sibling components sharing a prefix)

Multiple visually distinct components that are conceptually related but used independently:

```
src/components/
  Card/
    Featured.astro       ← <CardFeatured>
    Icon.astro           ← <CardIcon>
    Stat.astro           ← <CardStat>
    Pricing.astro        ← <CardPricing>
```

**Imports:**
```ts
import CardFeatured from "@components/Card/Featured.astro";
import CardIcon from "@components/Card/Icon.astro";
```

**Why split:** alphabetical grouping at the file level. `CardFeatured`, `CardIcon`, `CardStat` are all "kinds of cards" — keeping them in a folder makes the relationship visible without forcing actual code sharing between them.

This is exactly what this starter already does at the *flat* level via naming prefix: `CardFeatured.astro`, `CardIcon.astro` already group alphabetically in a flat folder. The folder version is the next step up if you grow to 5+ card variants and want them visually pulled together. Flat + naming convention is fine until then. (This is the same "how big before you fold into folders" question covered earlier in the guide — see the discussion of the `@components/*` path alias.)

### Shape 4 — Layout decomposition (pieces too coupled to be reusable)

A complex component (`Nav`, `Footer`, `Hero`) split internally only because the parent file would otherwise be unreadable, but where the pieces have no meaning outside the parent:

```
src/components/
  NavMorph.astro
  NavMorph/
    _logic.ts              ← the big morph script (300 lines)
    _MobileDrawer.astro    ← the hamburger drawer subview
```

**Why split:** the morph logic is 300 lines of pointer events, IntersectionObserver, focus traps. Inlining it in `NavMorph.astro` works but pushes the markup off-screen. Extracting it as `_logic.ts` and importing the `init` function back into `<script>` keeps the markup readable.

**The boundary test:** could `_MobileDrawer` ever be used without `NavMorph` rendering around it? If yes, it's not really a subpiece — promote it to a top-level component. If no, the underscore + folder placement keeps it tied to its only consumer.

### When *not* to split

The trap is splitting too eagerly. Three signals you've over-decomposed:

1. **Every "subpiece" file is < 30 lines.** You've turned one cohesive thing into a treasure hunt. Inline it back.
2. **The parent file is mostly imports + composition with no logic of its own.** You moved code around without reducing complexity. Sometimes the right answer is one bigger file.
3. **You can't name a subpiece without referring to the parent** ("the inner card's footer's icon"). The boundaries are arbitrary — keep it a single component until you can name independent concepts.

### A heuristic for picking shape

Ask: **who's making the layout decisions?**

- If the *consumer* arranges the parts → **compound (1)**: subpieces are public, named, importable.
- If the *parent* arranges the parts → **internal (2 or 4)**: subpieces are private, underscore-prefixed, not exported.
- If the parts are *independent siblings* → **variants (3)**: each is its own public component, folder is purely organizational.

### Concrete examples that fit this starter

If you ever decompose any of the components in this starter, here's what each shape would probably look like:

- **`FlowSteps`** could become a compound (`FlowSteps`, `FlowSteps.Step`, `FlowSteps.Panel`) — the consumer is currently tied to a fixed prop shape, and a compound API would let them write panels with arbitrary inner content using subcomponents instead of named slots. Worth doing only if you keep wanting to break out of the slot constraints.

- **`Tabs`** is already pushing 300 lines and could be type 2 — the public surface stays one component, but the GSAP timeline logic could move to `Tabs/_animate.ts` for readability.

- **`Modal`** could become type 4 if you ever add a `Drawer` variant — `Drawer.astro` and `Modal.astro` would share `_dialog.ts` for the focus-trap and Esc-to-close logic without duplicating it.

- **All `Card*` components** are currently flat with naming prefix and that's the right call. Promoting them to a `Card/` folder would only matter if you grew to ~6 variants and started feeling that the alphabetical sort wasn't enough grouping.

### The meta-rule

Most components don't need subpieces. **Split when the file has more than one meaningful concept and a future reader couldn't find them quickly.** Don't split because the file is "long" — line count alone is a poor signal. A 400-line component with one cohesive concept is easier to read than a 50-line orchestrator that imports six 50-line subcomponents from a folder.

The underscore-folder convention is your "I'd promote these later if they earned it" signal. Until then, keep things flat and reach for the split only when an actual pain point — readability, locality of related logic, or shared state across siblings — justifies it.
