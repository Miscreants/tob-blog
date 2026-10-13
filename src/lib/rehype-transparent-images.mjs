// Tags local article images that have transparent pixels with the class
// `img-transparent` (Astro's image step keeps only class), so dark mode can
// put a light backing behind diagrams drawn in black on transparent. Opaque
// photos and screenshots are untouched.
// sharp comes with Astro; if it can't load, images just go untagged.
import { dirname, resolve } from "node:path";

/** @type {Map<string, boolean>} */
const cache = new Map();

/** @param {string} file */
async function isTransparent(file) {
  if (cache.has(file)) return cache.get(file);
  let result = false;
  try {
    const sharp = (await import("sharp")).default;
    result = !(await sharp(file).stats()).isOpaque;
  } catch {}
  cache.set(file, result);
  return result;
}

export default function rehypeTransparentImages() {
  /** @param {any} tree @param {any} file */
  return async (tree, file) => {
    if (!file.path) return;
    /** @type {any[]} */
    const imgs = [];
    /** @param {any} node */
    const walk = (node) => {
      if (node.type === "element" && node.tagName === "img") imgs.push(node);
      node.children?.forEach(walk);
    };
    walk(tree);
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.properties?.src;
        if (typeof src !== "string" || /^(https?:|data:|\/)/.test(src)) return;
        if (await isTransparent(resolve(dirname(file.path), decodeURI(src)))) img.properties.className = [...(img.properties.className ?? []), "img-transparent"];
      }),
    );
  };
}
