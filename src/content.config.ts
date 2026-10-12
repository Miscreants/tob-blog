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

const announcements = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/announcements" }),
  schema: z.object({
    href: z.string().optional(),
    dismissible: z.boolean().default(true),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    enabled: z.boolean().default(true),
    priority: z.number().default(0),
  }),
});

// Components showcase — each MDX file documents one component, frontmatter
// drives the index page and routing. The body is rendered as the detail page
// content (props tables, mechanism, gotchas). MDX (vs plain MD) is what lets
// docs `import` and render live previews of the component itself.
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

export const collections = { faq, announcements, components };
