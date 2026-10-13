// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { site } from './src/data/site.ts';
import rehypeCodeFrame from './src/lib/rehype-code-frame.mjs';
import rehypeTransparentImages from './src/lib/rehype-transparent-images.mjs';

// Single source of truth for the production origin: this config derives `site`
// from src/data/site.ts rather than repeating the domain. Two copies plus a
// checklist item to keep them in sync is not a single source of truth.
//
// A placeholder origin warns, in every environment, and never fails the build.
// Previewing on a *.pages.dev URL before the client's domain is decided is
// normal and harmless — nothing is indexed or linked yet. The real gate is the
// pre-launch audit, which blocks on this at cutover, when it actually matters.
const PLACEHOLDER_ORIGIN = 'example.com';

if (site.url.includes(PLACEHOLDER_ORIGIN)) {
  console.warn(
    `\n[site] url is still the ${PLACEHOLDER_ORIGIN} placeholder.\n` +
      `       Canonical URLs, og:url and schema.org @id all resolve against it.\n` +
      `       Fine for previews — set the real domain in src/data/site.ts before launch.\n`
  );
}

// Internal / demo routes excluded from the public sitemap. A path is dropped if
// it equals one of these or sits under it. Extend per project.
const SITEMAP_EXCLUDE = ['/styleguide', '/components', '/tve-preview'];

// Demo / reference routes live in src/demos (NOT src/pages), so they are never
// auto-built. This integration injects them only in `astro dev` — or in a build
// when SHOW_DEMOS=true — so the component showcase + styleguide are available
// locally (for the client and their AI agent) but never shipped to production.
/** @returns {import('astro').AstroIntegration} */
function demoRoutes() {
  const DEMOS = [
    { pattern: '/styleguide', entrypoint: './src/demos/styleguide.astro' },
    { pattern: '/tve-preview', entrypoint: './src/demos/tve-preview.astro' },
    { pattern: '/components', entrypoint: './src/demos/components/index.astro' },
    { pattern: '/components/[...slug]', entrypoint: './src/demos/components/[...slug].astro' },
  ];
  return {
    name: 'demo-routes',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, logger }) => {
        const enabled = command === 'dev' || process.env.SHOW_DEMOS === 'true';
        if (!enabled) {
          logger.info('Demo routes excluded from this build (set SHOW_DEMOS=true to include).');
          return;
        }
        for (const route of DEMOS) injectRoute(route);
        logger.info(`Demo routes enabled (${DEMOS.length} routes).`);
      },
    },
  };
}

// Pure static site, no adapter. The @astrojs/cloudflare adapter's image
// service passes images through UNoptimized (no sharp), so we drop it and let
// Astro's default sharp service transcode/resize at build into static /_astro/*.
// The contact-form Cloudflare action is disabled for now (src/actions/
// index.ts.disabled); re-enabling a working form needs server rendering — see
// notes: use Cloudflare Pages Functions or imageService:'cloudflare' alongside
// the adapter. For now the form is a static placeholder.

// https://astro.build/config
export default defineConfig({
  // The production origin, derived from src/data/site.ts — set it there, not
  // here. Drives canonical URLs, og:url/og:image, JSON-LD @id values and the
  // sitemap.
  site: site.url,
  output: 'static',
  // Let Cloudflare quick tunnels (cloudflared tunnel --url) reach the dev
  // server for sharing previews. Dev/preview only; no effect on the build.
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  // Astro 7 defaults compressHTML to 'jsx' (JSX-style whitespace stripping).
  // Keep the v6 HTML-aware behavior so inline spacing doesn't shift.
  compressHTML: true,
  // Every internal link warms on hover. On a static site the pages are already
  // built, so this costs one cheap fetch for a link the visitor has signalled
  // intent on, and the navigation lands instantly. Independent of the client
  // router — this works without view transitions enabled.
  //
  // `viewport` would prefetch everything on screen; on a long marketing page
  // that is a lot of bandwidth spent on links nobody follows. Reconsider
  // prefetchAll on a content-heavy site with hundreds of routes.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Code colors come from the syntax roles in global.css (css-variables theme),
  // so one highlight pass serves both themes. rehypeCodeFrame adds the
  // language/copy header around each block; rehypeTransparentImages tags
  // diagrams on transparent backgrounds for their dark-mode backing.
  markdown: {
    shikiConfig: { theme: 'css-variables' },
    rehypePlugins: [rehypeCodeFrame, rehypeTransparentImages],
  },
  build: {
    // Inline page CSS into <head> instead of emitting render-blocking
    // stylesheet requests — a material FCP/LCP win for static sites.
    inlineStylesheets: 'always',
  },
  integrations: [
    icon(),
    mdx(),
    demoRoutes(),
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        return !SITEMAP_EXCLUDE.some(
          (p) => pathname === p || pathname.startsWith(p + '/')
        );
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // GSAP is only reached through a runtime `import()` inside component
    // scripts (Tabs), so Vite never sees it during its initial dependency
    // scan. The first lazy import triggers a re-optimize mid-session and the
    // in-flight request 504s with "Outdated Optimize Dep" — the animation
    // silently dies in dev. Pre-bundling it up front avoids the reload.
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger'],
    },
  }
});