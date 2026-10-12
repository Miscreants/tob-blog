// Wraps every Shiki <pre> in the board's code frame: a header bar with the
// language and a copy button over the block. Runs at build, so the frame is
// in the HTML without JS; ArticleBody's script only wires the copy buttons.
// Hand-rolled hast walk, no dependency.

/** @param {any} node */
const isPre = (node) => node.type === "element" && node.tagName === "pre";

const copyIcon = {
  type: "element",
  tagName: "svg",
  properties: {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    ariaHidden: "true",
  },
  children: [
    { type: "element", tagName: "rect", properties: { x: 9, y: 9, width: 12, height: 12 }, children: [] },
    { type: "element", tagName: "path", properties: { d: "M5 15H3V3h12v2" }, children: [] },
  ],
};

/** @param {any} pre */
function frame(pre) {
  const lang = pre.properties?.dataLanguage;
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["code-frame"], dataCodeFrame: "" },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["code-frame__bar"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["code-frame__lang"] },
            children: [{ type: "text", value: lang && lang !== "plaintext" ? lang : "text" }],
          },
          {
            type: "element",
            tagName: "button",
            properties: { type: "button", className: ["code-frame__copy"], dataCodeCopy: "", ariaLabel: "Copy code" },
            children: [copyIcon],
          },
        ],
      },
      pre,
    ],
  };
}

export default function rehypeCodeFrame() {
  /** @param {any} tree */
  return (tree) => {
    /** @param {any} node */
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => (isPre(child) ? frame(child) : (walk(child), child)));
    };
    walk(tree);
  };
}
