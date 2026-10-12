---
name: Trail of Bits Blog
version: draft
summary: A research archive browsed like a filesystem — dense, mono-labelled, square, with one red accent marking where you are.
---

# Design

The brand contract for the Trail of Bits blog. Values live in `src/styles/global.css`; this file holds the decisions and why. Source: Figma file `lWtMrDwkCwgNo6dTPWqj1B`, section "Direction A - Directory" (node 13:777).

## Brand character

The blog is the lab's notebook, not a magazine: posts are files in a directory tree, so every path, date, type and count is a mono label, and navigation reads as `~/blog/fuzzing-testing/fuzzing`. Precision over decoration: surfaces are flat and separated by tone and hairlines, never shadow. Red is used sparingly, only as a location marker (the selected folder, the active row, the post type), so it always means "here".

## Decisions

| Decision | Answer for this project |
|---|---|
| **Themes** | Light and dark, both first-class. Visitor choice wins (saved), else the OS preference. `brand` mirrors dark for starter parity. |
| **Palette** | Neutrals plus Trail of Bits red. `--color-intent` is the red, the same one trailofbits.com (new-website) uses as its accent. Syntax colors are their own role set and change with the theme. |
| **Radius** | None. Square corners everywhere, matching the terminal / file-browser metaphor and trailofbits.com. The only round thing is the theme switch's indicator dot. |
| **Depth** | Tone first (canvas → panel → raised), then hairlines (default and strong). Shadows only on floating layers (search dialog, mobile tree drawer). |
| **Typefaces** | FH Lecturis for display and article headings, Geist for UI text and body, Geist Mono for every label, path, date and button. The same three self-hosted faces as trailofbits.com. |
| **Motion** | Almost none: color transitions on hover. Nothing slides, scrolls or animates on load. |
| **Density** | Compact, like a file listing: one line per post with title and excerpt, metadata in columns. |
| **Imagery** | None in the chrome. Post bodies may carry figures. |

## Project rules

- Never use red for decoration. It marks location or type only.
- Every piece of metadata (paths, dates, types, counts, buttons) is set in mono. Prose and titles never are.
- Every folder path in content must exist in `src/data/directory.ts`; the build fails otherwise. Add the folder before tagging a post into it.
- Never hand-write post counts. They are always derived from the posts collection.
- Text roles must hold AA on every surface they sit on, in both themes. That is why `fg-subtle` and dark `intent` sit slightly off the board's values.

## Deliberately not doing

- No cards with images in listings. The table is the product, and thumbnails would break its scan line.
- No rounded corners, gradients or drop shadows on in-page surfaces.
- No infinite scroll. Pages are numbered, so a location in the archive can be linked to.

## Open questions

- Indexes (`/tools ↗`, `/languages ↗`, `/programs ↗`) carry a ↗ on the board. Should they link out to trailofbits.com, or stay blog folders as built?
- Newsletter provider and endpoint (`subscribeAction` in `src/data/site.ts`).
- Production domain is assumed to be `blog.trailofbits.com`, and the URL scheme is folder-based. Redirects from the current `/YYYY/MM/DD/slug/` URLs are needed at import.
