<!--docs-module: rules/performance-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

## Performance & build optimization
<!--rule: perf | tier: reference-->

### Images — use `astro:assets`
<!--rule: perf.images | tier: required-->
- **Import from `src/images/` and render with `<Image>`/`<Picture>`.** Don't reference raw `/public` paths for content images.
- Put only un-optimized assets (favicons, OG/social images) in `public/`.
- Always set `width`/`height` (or let `<Image>` infer) to prevent CLS. `loading="lazy" decoding="async"` below the fold.
- **Don't lazy-load the LCP image.** The hero gets `loading="eager"` + `fetchpriority="high"`.

### Fonts — self-hosted
<!--rule: perf.fonts | tier: default-->
**Self-host WOFF2.** A third-party font host costs a DNS lookup, a TLS handshake and a connection that can't be warmed from your own origin — on a text-first marketing page that lands squarely on LCP.

**Strong default, not a gate.** Some licenses forbid self-hosting outright (Adobe Fonts, parts of the Monotype catalog), and sometimes a client can only produce a CDN embed before launch. Ship it and record the deviation in the project's notes — don't block on it.

**The part that is not negotiable:** every family named in `--font-heading/-sans/-mono` must have an `@font-face` behind it, or be a real system-stack keyword. A stack naming a font that was never loaded renders correctly on the designer's machine, where it's installed locally, and silently falls through to a system font for everyone else. That's a rendering bug, not a preference.

- **Prefer variable fonts** when the family and browser support allow — one file per family covering all weights.
- **`@fontsource-variable/*` is the default source** when licensing and availability permit. Client-licensed, modified or proprietary faces are self-hosted directly — that is expected agency work, not a deviation.
- Subset to the character sets the site actually uses.
- Set `font-display` deliberately (`swap` for body, `optional` where a swap would be disruptive).
- Preload only the face(s) in the LCP element.

#### Converting what the client sends

What arrives is rarely WOFF2 — usually OTF or TTF. **Check the license covers webfont embedding first:** a desktop license frequently doesn't, and that is a contract problem no tool solves.

`pyftsubset` (from `fonttools`) converts and subsets in one pass, which is the route worth learning — subsetting is where the size actually goes:

```sh
pip install "fonttools[woff]"
pyftsubset Font.otf --flavor=woff2 --output-file=font.woff2 \
  --unicodes=U+0000-00FF,U+2000-206F,U+2212 \
  --layout-features='kern,liga,calt'
```

Measured on a 1.0MB TTF: straight conversion gives 424KB, the Latin subset above gives 48KB.

Keep the axes on a variable source — `pyftsubset` will happily instance it down to a single weight and quietly cost you the whole reason for shipping variable. For a Node-only box, `wawoff2` is pure wasm with no native build (`compress(buffer)`), but it converts without subsetting.

### CSS inlining
<!--rule: perf.css | tier: default-->
The starter sets `build: { inlineStylesheets: 'always' }` — page CSS is inlined into `<head>` instead of emitting a render-blocking request. That's a material FCP/LCP win on small static sites.

**It is a trade, not a free win:** the shared stylesheet is duplicated into every HTML document and cannot be cached across navigations. **Re-measure and consider `'auto'`** when a site passes roughly 20 routes, or the shared CSS passes roughly 15KB gzipped. Record the decision in the project's notes.

### Navigation prefetch
<!--rule: perf.prefetch | tier: default-->
**Astro's built-in `prefetch` is on, hover-strategy, for every internal link:**

```js
prefetch: {
  prefetchAll: true,
  defaultStrategy: 'hover',
}
```

On a static site the pages are already built, so this costs one cheap fetch for a link the visitor has signalled intent on, and the navigation lands instantly. It works **without** the client router — prefetch and view transitions are independent features.

**Don't reach for `viewport`.** It prefetches everything on screen, which on a long marketing page spends real bandwidth on links nobody follows. Reserve it for a short, high-intent set if a project ever needs it.

**Reconsider `prefetchAll`** on a content-heavy site with hundreds of routes, where a listing page can put dozens of prefetchable links under the cursor. Opt individual links in with `data-astro-prefetch` instead.

### Third-party scripts
<!--rule: perf.third-party | tier: default-->
- **Gate tracking behind cookie consent** before launch in regulated regions.
- Analytics IDs come from env vars; the tag is injected only when the var is set.
- **Partytown is preferred for third-party scripts that survive it** — after testing consent flow, page navigation, and conversion/goal events end to end. Several vendors need forwarding configuration or don't work in a worker at all; for those, a deferred main-thread integration is correct. Test per vendor, don't assume.
- **Heavy embeds use a facade** — YouTube, maps, chat: render a lightweight placeholder and load the real iframe/SDK on interaction or when scrolled into view.

### Animated canvases & heavy client JS
<!--rule: perf.canvas | tier: required-->

An animated `<canvas>` driven by a `requestAnimationFrame` loop is the most common cause of a poor mobile score on an otherwise fast static site. The signature is a low mobile Performance score with **green LCP and CLS** — the cost is TBT/INP from a perpetual loop plus a one-time shader/compile task in the load window. Lighthouse often rasterizes WebGL in software, so "GPU" effects land on the main thread.

**Required for any animated canvas or long-lived rAF loop:**
- Respect `prefers-reduced-motion` — draw a single static frame, never start the loop.
- Pause when offscreen (`IntersectionObserver`) and when the tab is hidden (`visibilitychange`).
- Provide a static fallback frame that looks finished, not broken.
- Never initialize a non-critical visual effect during the LCP window — defer setup/compile to idle.
- Tear the loop down on teardown ([components.scripting]); never leave an unbounded loop running.

**Defaults (deviate with a stated reason and a measurement):**
- **Static single frame at ≤768px.** The breakpoint is a starter default and may be tuned per project.
- **Cap the frame rate** (~24–30fps) on desktop, advancing by *real elapsed time* so visual speed stays fps-independent.
- **Trim shaders** to what's used; smaller source compiles faster.
- **Guard and rAF-batch `ResizeObserver`** so layout settling doesn't thrash buffer reallocation.
- Consider device pixel ratio, `prefers-reduced-data` and battery cost when sizing the effect.

**Measure, don't assume:** set a frame-time budget per effect and profile on a representative mid-range device before shipping it.

### Budgets & targets
<!--rule: perf.budgets | tier: required-->

Lighthouse scores are noisy and environment-dependent. Gate on **budgets**, and use the composite score as a smoke test.

| Metric | Budget |
|---|---|
| LCP (mobile, throttled) | ≤ 2.5s |
| INP | ≤ 200ms |
| CLS | ≤ 0.1 |
| Longest main-thread task in the load window | ≤ 200ms |
| First-party JS (initial route, gzipped) | ≤ 50KB |
| Third-party JS (initial route, gzipped) | ≤ 50KB |
| Above-the-fold image weight | ≤ 300KB |
| Font files / bytes (initial route) | ≤ 3 files, ≤ 150KB |
| HTML + CSS per document (gzipped) | ≤ 60KB |

Lighthouse smoke targets on key templates (home, a content detail page, a listing page): Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO = 100.

`npm run check` passes clean — zero errors, zero warnings.

**Don't strip core interactive components to chase a number.** They're commonly used; optimize around them.

<!-- rule-links: generated by scripts/build-doc-links.mjs — do not edit -->
[components.scripting]: ./components.md#client-side-scripting
<!-- /rule-links -->
