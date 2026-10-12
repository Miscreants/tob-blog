<!--docs-module: checklists/seo-->
<!--nav: Part of the Astro Build Standards. Map: docs/README.md · Router: docs/workflow.md-->

### SEO (per page / template)
<!--rule: checklist.seo | tier: checklist-->
- [ ] `title` (+ `description`) passed to Layout, or set via frontmatter
- [ ] Canonical resolves correctly (absolute, no trailing-slash mismatch)
- [ ] OG + Twitter present; OG image absolute and exists
- [ ] `noindex` for drafts/internal pages
- [ ] JSON-LD from `lib/schema.ts` for the page type
- [ ] In the sitemap if public; excluded if draft/internal
