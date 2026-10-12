<!--docs-module: rules/component-templates-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Component author templates
<!--rule: templates | tier: reference-->

Three templates, because most components are not interactive and shouldn't be born with a script, a style block and a lifecycle they never use. **Start with the static template.** The starter ships `ComponentTemplateStatic.astro`, `ComponentTemplateInteractive.astro` and `ComponentTemplatePolymorphic.astro` — keep them in sync with this section.

### Static component (the default)
<!--rule: templates.static | tier: reference-->

Props, slots, semantic markup, tokens. No script. No style block unless a utility genuinely can't express it.

```astro
---
/**
 * <ComponentName>
 * One line on what it's for.
 *
 * @prop label   - Visible text / accessible name.
 * @prop variant - Visual style. Default "primary".
 */
interface Props {
  /** Accessible name / visible label. */
  label: string;
  variant?: "primary" | "secondary";
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  class?: string;
}

const { label, variant = "primary", hideLabel = false, class: className } = Astro.props;

const styles = {
  primary: "bg-intent text-fg-on-intent",
  secondary: "bg-panel text-fg border border-stroke",
}[variant];
---

<div class:list={["inline-flex items-center gap-2 px-4 py-2", styles, className]}>
  {Astro.slots.has("icon") && (
    <span aria-hidden="true"><slot name="icon" /></span>
  )}
  <span class:list={[hideLabel && "sr-only"]}>
    <slot>{label}</slot>
  </span>
</div>
```

### Interactive component
<!--rule: templates.interactive | tier: reference-->

Adds state, ARIA, keyboard, a scoped style block only if needed, and the [components.scripting] lifecycle. Pass an `id` in rather than generating a random one — generated ids churn build output and can't be targeted by the caller.

```astro
---
interface Props {
  /** Stable id; required when another element must reference this one. */
  id?: string;
  label: string;
  class?: string;
}
const { id = "disclosure", label, class: className } = Astro.props;
const panelId = `${id}-panel`;
---

<div class:list={["relative", className]} data-disclosure>
  <button
    type="button"
    class="… focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    aria-expanded="false"
    aria-controls={panelId}
    data-disclosure-trigger
  >
    {label}
  </button>
  <div id={panelId} hidden data-disclosure-panel>
    <slot />
  </div>
</div>

<style>
  /* Only when a utility can't express it. Tokens via var() — [tokens.scoped-styles]. */
  [data-disclosure-panel] { border-top: 1px solid var(--color-stroke); }
  @media (prefers-reduced-motion: reduce) {
    [data-disclosure-panel] { transition: none; }
  }
</style>

<script>
  const initialized = new WeakSet<HTMLElement>();

  function initDisclosure() {
    document.querySelectorAll<HTMLElement>("[data-disclosure]").forEach((root) => {
      if (initialized.has(root)) return;
      initialized.add(root);

      const trigger = root.querySelector<HTMLButtonElement>("[data-disclosure-trigger]");
      const panel = root.querySelector<HTMLElement>("[data-disclosure-panel]");
      if (!trigger || !panel) return;

      const controller = new AbortController();
      const { signal } = controller;

      trigger.addEventListener("click", () => {
        const open = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", String(!open));
        panel.hidden = open;
      }, { signal });

      // Teardown when the root leaves the DOM.
      root.addEventListener("disclosure:destroy", () => controller.abort(), { signal });
    });
  }

  initDisclosure();
  document.addEventListener("astro:page-load", initDisclosure); // no-op without the client router
</script>
```

### Native / polymorphic control
<!--rule: templates.polymorphic | tier: reference-->

Attribute passthrough plus the few props of the alternate element ([components.props]).

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"button"> {
  variant?: "primary" | "secondary";
  /** Render as an <a> pointing here instead of a <button>. */
  href?: string;
  /** Anchor-only; forwarded when `href` is set. */
  target?: string;
  /** Anchor-only; defaults to "noopener noreferrer" when target="_blank". */
  rel?: string;
}

const {
  variant = "primary",
  href,
  type = "button",
  target,
  rel,
  disabled = false,
  class: className,
  ...rest
} = Astro.props;

const Tag = href && !disabled ? "a" : "button";
const anchorRel = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
---

<Tag
  {...rest}
  {...(Tag === "a" ? { href, target, rel: anchorRel } : { type, disabled })}
  class:list={["… focus-visible:ring-2 focus-visible:ring-focus", className]}
>
  <slot />
</Tag>
```

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[components.props]: ./components.md#props-typing
[components.scripting]: ./components.md#client-side-scripting
<!-- /rule-links -->
