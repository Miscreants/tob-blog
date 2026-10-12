import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { postTypes } from "./data/directory";

// Blog posts. The file name is the slug; the URL is /<location>/<slug>/.
// `location` and `alsoIn` are folder paths from src/data/directory.ts —
// lib/blog.ts fails the build on a path that isn't in the tree.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences: row excerpt, preview summary and meta description. */
    description: z.string(),
    type: z.enum(postTypes),
    /** Primary folder, e.g. "fuzzing-testing/fuzzing". */
    location: z.string(),
    /** Cross-listings, shown as chips. */
    alsoIn: z.array(z.string()).default([]),
    authors: z.array(z.string()).min(1),
    date: z.coerce.date(),
    /** Last meaningful edit; the listing sorts on this when present. */
    updated: z.coerce.date().optional(),
    /** Pinned to the Featured strip on the blog home. */
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

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

// Component showcase docs (dev-only /components route).
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

export const collections = { posts, faq, announcements, components };
