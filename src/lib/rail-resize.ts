// Left-edge resize for the right-hand rails (listing preview, article rail):
// drag or arrow keys on the separator, double-click resets. Writes the width
// to `prop` on the panel and remembers it under one key, so both rails match.
export function initRailResize(panel: HTMLElement, handle: HTMLElement, prop: string, key = "preview-width") {
  const MIN = 320;
  const max = () => Math.max(MIN, Math.min(768, Math.round(innerWidth * 0.5)));
  const clampW = (w: number) => Math.round(Math.min(max(), Math.max(MIN, w)));
  const setWidth = (w: number | null, save = true) => {
    if (w === null) panel.style.removeProperty(prop);
    else panel.style.setProperty(prop, `${clampW(w)}px`);
    const now = Math.round(panel.getBoundingClientRect().width);
    handle.setAttribute("aria-valuemin", String(MIN));
    handle.setAttribute("aria-valuemax", String(max()));
    handle.setAttribute("aria-valuenow", String(w === null ? now : clampW(w)));
    if (!save) return;
    try {
      if (w === null) localStorage.removeItem(key);
      else localStorage.setItem(key, String(clampW(w)));
    } catch {}
  };
  try {
    const saved = Number(localStorage.getItem(key));
    if (saved) setWidth(saved, false);
  } catch {}

  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    panel.setAttribute("data-resizing", "");
    const right = panel.getBoundingClientRect().right;
    const move = (ev: PointerEvent) => setWidth(right - ev.clientX, false);
    const end = (ev: PointerEvent) => {
      handle.removeEventListener("pointermove", move);
      panel.removeAttribute("data-resizing");
      setWidth(right - ev.clientX);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end, { once: true });
    handle.addEventListener("pointercancel", end, { once: true });
  });
  handle.addEventListener("dblclick", () => setWidth(null));
  // Report the live width when a keyboard user lands on the handle.
  handle.addEventListener("focus", () => handle.setAttribute("aria-valuenow", String(Math.round(panel.getBoundingClientRect().width))));
  handle.addEventListener("keydown", (e) => {
    const current = panel.getBoundingClientRect().width;
    const step = e.shiftKey ? 64 : 16;
    const next =
      e.key === "ArrowLeft" ? current + step
      : e.key === "ArrowRight" ? current - step
      : e.key === "Home" ? MIN
      : e.key === "End" ? max()
      : null;
    if (next === null) return;
    e.preventDefault();
    panel.setAttribute("data-resizing", "");
    setWidth(next);
    requestAnimationFrame(() => panel.removeAttribute("data-resizing"));
  });
}
