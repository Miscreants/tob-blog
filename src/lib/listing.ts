// Listing state shared by PostListing's server render and its client script:
// sort keys, the numbered page window, the status line and the classes both
// sides draw with. No astro:content imports — this ships to the browser.

export type SortKey = "type" | "title" | "location" | "author" | "date";
export type SortDir = "asc" | "desc";

export interface ListingState {
  type: string; // "all" or a post type
  key: SortKey;
  dir: SortDir;
  page: number;
}

export const sortKeys: SortKey[] = ["type", "title", "location", "author", "date"];
export const sortLabels: Record<SortKey, string> = {
  type: "type",
  title: "name",
  location: "location",
  author: "author",
  date: "published",
};
/** Dates start newest first; text columns start A–Z. */
export const defaultDir = (key: SortKey): SortDir => (key === "date" ? "desc" : "asc");
export const defaultState = (page = 1): ListingState => ({ type: "all", key: "date", dir: "desc", page });

/** Pages to show: first, last, and a window around the current one; null is a gap. */
export function pageWindow(page: number, total: number): (number | null)[] {
  const keep = [...new Set([1, page - 1, page, page + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of keep) {
    // Never hide a single page behind an ellipsis.
    if (n - prev === 2) out.push(prev + 1);
    else if (n - prev > 2) out.push(null);
    out.push(n);
    prev = n;
  }
  return out;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const pad = (n: number) => String(n).padStart(2, "0");

/** "2 folders · 21–40 of 57 posts", or "1–4 of 4 *.guide posts". */
export function statusText(o: { folders: number; total: number; page: number; perPage: number; type: string }) {
  const kind = o.type === "all" ? "post" : `*.${o.type} post`;
  const from = o.total ? (o.page - 1) * o.perPage + 1 : 0;
  const to = Math.min(o.total, o.page * o.perPage);
  const range = o.total ? `${from}–${to} of ${plural(o.total, kind)}` : `0 ${kind}s`;
  return [...(o.folders ? [plural(o.folders, "folder")] : []), range].join(" · ");
}

/** A post's location relative to the folder being listed. */
export const relativeLocation = (location: string, path?: string) =>
  path && (location === path || location.startsWith(`${path}/`))
    ? location.slice(path.length) || `/${location.split("/").pop()}`
    : `/${location}`;

export const pagerClass = {
  link: "text-mono-sm text-fg hover:text-intent px-1.5 py-1 tabular-nums transition-colors",
  current: "text-mono-sm bg-intent-soft text-intent px-1.5 py-1 tabular-nums",
  gap: "text-mono-sm text-fg-subtle px-1",
  disabled: "text-mono-sm text-fg-subtle px-1.5 py-1",
};
