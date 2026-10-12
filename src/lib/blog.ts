// Read model for the blog: posts, the folder tree with live counts, and the
// URL scheme. Every page and section goes through here instead of calling
// getCollection directly, so sorting, draft filtering and path validation
// happen once.
//
// URLs mirror the tree: a folder is /<path>/, a post is /<location>/<slug>/,
// listing pages beyond the first are /<path>/page/<n>/ (or /page/<n>/ at root).

import { getCollection, type CollectionEntry } from "astro:content";
import { directory, type Folder, type FolderGroup } from "../data/directory";

export type Post = CollectionEntry<"posts">;

export const PAGE_SIZE = 20;

export interface FolderNode {
  path: string;
  slug: string;
  title: string;
  blurb?: string;
  kind: FolderGroup["kind"];
  depth: number;
  parent?: string;
  children: string[];
}

/** Flat map of every folder path in the tree. */
export const folders: Map<string, FolderNode> = (() => {
  const map = new Map<string, FolderNode>();
  const add = (f: Folder, kind: FolderGroup["kind"], parent?: FolderNode) => {
    const path = parent ? `${parent.path}/${f.slug}` : f.slug;
    const node: FolderNode = {
      path,
      slug: f.slug,
      title: f.title ?? f.slug,
      blurb: f.blurb,
      kind,
      depth: parent ? parent.depth + 1 : 0,
      parent: parent?.path,
      children: [],
    };
    map.set(path, node);
    parent?.children.push(path);
    f.children?.forEach((c) => add(c, kind, node));
  };
  directory.forEach((g) => g.folders.forEach((f) => add(f, g.kind)));
  return map;
})();

/** True when `path` is `folder` or sits under it. */
const within = (path: string, folder: string) => path === folder || path.startsWith(`${folder}/`);

export const sortKey = (p: Post) => (p.data.updated ?? p.data.date).getTime();

/** Published posts, newest first. Unknown folder paths fail the build. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", (p) => import.meta.env.DEV || !p.data.draft);
  for (const p of posts) {
    for (const path of [p.data.location, ...p.data.alsoIn]) {
      if (!folders.has(path)) {
        throw new Error(`posts/${p.id}: folder "${path}" is not in src/data/directory.ts`);
      }
    }
  }
  return posts.sort((a, b) => sortKey(b) - sortKey(a));
}

/** Posts located in, or cross-listed under, a folder or any of its subfolders. */
export function postsIn(posts: Post[], folder: string): Post[] {
  return posts.filter((p) => [p.data.location, ...p.data.alsoIn].some((path) => within(path, folder)));
}

/** Post count for every folder path, rolled up through the tree. */
export function folderCounts(posts: Post[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const path of folders.keys()) counts[path] = postsIn(posts, path).length;
  return counts;
}

/** Ancestors of a path, root first, including the path itself. */
export function lineage(path: string): FolderNode[] {
  const out: FolderNode[] = [];
  let node = folders.get(path);
  while (node) {
    out.unshift(node);
    node = node.parent ? folders.get(node.parent) : undefined;
  }
  return out;
}

export const folderHref = (path?: string) => (path ? `/${path}/` : "/");
export const postHref = (p: Post) => `/${p.data.location}/${p.id}/`;
export const pageHref = (path: string | undefined, page: number) =>
  page <= 1 ? folderHref(path) : `${path ? `/${path}` : ""}/page/${page}/`;

/** The board's file-style name for a post: "<slug>.<type>". */
export const fileName = (p: Post) => `${p.id}.${p.data.type}`;

export const authorSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const authorHref = (name: string) => `/authors/${authorSlug(name)}/`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** ISO calendar date, as the board prints it. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function paginate<T>(items: T[], page: number) {
  const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, total };
}

/** The serializable shape a listing row and the preview panel need. */
export interface PostSummary {
  id: string;
  href: string;
  file: string;
  title: string;
  description: string;
  type: string;
  location: string;
  alsoIn: string[];
  authors: string[];
  date: string;
}

export const summarize = (p: Post): PostSummary => ({
  id: p.id,
  href: postHref(p),
  file: fileName(p),
  title: p.data.title,
  description: p.data.description,
  type: p.data.type,
  location: p.data.location,
  alsoIn: p.data.alsoIn,
  authors: p.data.authors,
  date: isoDate(p.data.updated ?? p.data.date),
});
