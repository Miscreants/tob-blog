// Search index for SearchDialog: posts, folders and authors, fetched on the
// dialog's first open. `text` is the lowercased haystack the client matches.
import type { APIRoute } from "astro";
import { authorHref, folderCounts, folderHref, folders, getPosts, postHref } from "../lib/blog";

const plural = (n: number) => `${n} post${n === 1 ? "" : "s"}`;

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const counts = folderCounts(posts);
  const authors = [...new Set(posts.flatMap((p) => p.data.authors))];

  const entries = [
    ...posts.map((p) => ({
      kind: "post",
      title: p.data.title,
      href: postHref(p),
      meta: `/${p.data.location} · ${p.data.authors.join(", ")}`,
      text: [p.data.title, p.data.description, p.data.location, ...p.data.alsoIn, ...p.data.authors, p.data.type]
        .join(" ")
        .toLowerCase(),
    })),
    ...[...folders.values()].map((f) => ({
      kind: "folder",
      title: `/${f.path}`,
      href: folderHref(f.path),
      meta: `${plural(counts[f.path])}${f.blurb ? ` · ${f.blurb}` : ""}`,
      text: [f.path, f.title, f.blurb ?? ""].join(" ").toLowerCase(),
    })),
    ...authors.map((a) => ({
      kind: "author",
      title: a,
      href: authorHref(a),
      meta: plural(posts.filter((p) => p.data.authors.includes(a)).length),
      text: a.toLowerCase(),
    })),
  ];

  return new Response(JSON.stringify(entries), { headers: { "Content-Type": "application/json" } });
};
