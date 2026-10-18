import { useLayoutEffect, useRef, type ReactNode } from "react";
import "./mobile-diary-layer.css";

// This component must mount INSIDE the Radix Portal. DialogContent itself is
// still rendered by React while closed, so locking in that wrapper would lock
// the entire dashboard even when no diary is visible.
export function MobileDiaryLayer({ children }: { children: ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const doc = layer.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;
    const media = win.matchMedia("(max-width: 639px)");
    let release: (() => void) | undefined;
    const update = () => {
      if (media.matches && !release) release = isolateMobileDiary(layer, win);
      else if (!media.matches && release) {
        release();
        release = undefined;
      }
    };
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      release?.();
    };
  }, []);

  return <div ref={layerRef} data-diary-focus-layer="v1">{children}</div>;
}

function isKeyboardInput(node: Element | null): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  if (node instanceof HTMLTextAreaElement) return !node.readOnly && !node.disabled;
  if (node instanceof HTMLInputElement) {
    return !node.readOnly && !node.disabled &&
      !["button", "checkbox", "color", "file", "hidden", "radio", "range", "reset", "submit"].includes(node.type);
  }
  return node.isContentEditable;
}

function isolateMobileDiary(layer: HTMLElement, win: Window): () => void {
  const doc = layer.ownerDocument;
  const html = doc.documentElement;
  const root = doc.getElementById("root");
  const position = { x: win.scrollX, y: win.scrollY };
  // Preserve nested dashboard/list scroll positions as well as window scroll.
  const scrollers = root ? [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]
    .filter(node => node.scrollTop !== 0 || node.scrollLeft !== 0)
    .map(node => ({ node, top: node.scrollTop, left: node.scrollLeft })) : [];
  const previousLock = html.getAttribute("data-diary-focus-lock");
  const viewport = win.visualViewport;
  let disposed = false;
  let frame = 0;
  let timers: number[] = [];

  // Overflow:hidden alone does not stop iOS's native focus scroll. Collapse the
  // document's scrolling surface, keep the background mounted but non-painted,
  // and let ONLY the diary's internal scroll area move. CSS is scoped to mobile.
  html.setAttribute("data-diary-focus-lock", "v1");
  win.scrollTo({ left: 0, top: 0, behavior: "instant" });

  const keepDocumentAtOrigin = () => {
    if (!disposed && (win.scrollX !== 0 || win.scrollY !== 0)) {
      win.scrollTo({ left: 0, top: 0, behavior: "instant" });
    }
  };

  const ensureFieldVisible = () => {
    const field = doc.activeElement;
    const scroll = layer.querySelector<HTMLElement>('[data-testid="training-diary-scroll"]');
    if (!scroll || !(field instanceof HTMLElement) || !scroll.contains(field)) return;
    const fieldRect = field.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    if (fieldRect.bottom > scrollRect.bottom - 12) {
      scroll.scrollTop += fieldRect.bottom - scrollRect.bottom + 12;
    } else if (fieldRect.top < scrollRect.top + 12) {
      scroll.scrollTop -= scrollRect.top + 12 - fieldRect.top;
    }
    // Never call field.scrollIntoView(): that also scrolls document ancestors.
  };

  const sync = () => {
    frame = 0;
    if (disposed) return;
    keepDocumentAtOrigin();
    const layoutHeight = html.clientHeight;
    const keyboardOpen = isKeyboardInput(doc.activeElement) && !!viewport &&
      Math.abs(viewport.scale - 1) < 0.1 && layoutHeight - viewport.height > 120;

    // Resize ONLY while an actual keyboard obscures the viewport. On blur or
    // dismissal immediately return to CSS edge anchors, never retain a stale
    // visualViewport height/top after the keyboard closes.
    if (keyboardOpen && viewport) {
      layer.dataset.keyboardOpen = "true";
      layer.style.setProperty("--diary-keyboard-top", `${Math.max(0, viewport.offsetTop)}px`);
      layer.style.setProperty("--diary-keyboard-height", `${Math.max(1, viewport.height)}px`);
    } else {
      delete layer.dataset.keyboardOpen;
      layer.style.removeProperty("--diary-keyboard-top");
      layer.style.removeProperty("--diary-keyboard-height");
    }
    ensureFieldVisible();
  };
  const schedule = () => {
    if (!disposed && !frame) frame = win.requestAnimationFrame(sync);
  };
  const focusChanged = () => {
    timers.forEach(id => win.clearTimeout(id));
    schedule();
    // Cover Safari's keyboard animation, including a delayed final resize.
    timers = [80, 250, 500].map(delay => win.setTimeout(schedule, delay));
  };
  const documentScrolled = () => { keepDocumentAtOrigin(); schedule(); };
  win.addEventListener("scroll", documentScrolled);
  win.addEventListener("resize", schedule);
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  doc.addEventListener("focusin", focusChanged, true);
  doc.addEventListener("focusout", focusChanged, true);
  sync();

  return () => {
    disposed = true;
    if (frame) win.cancelAnimationFrame(frame);
    timers.forEach(id => win.clearTimeout(id));
    win.removeEventListener("scroll", documentScrolled);
    win.removeEventListener("resize", schedule);
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
    doc.removeEventListener("focusin", focusChanged, true);
    doc.removeEventListener("focusout", focusChanged, true);
    const focused = doc.activeElement;
    if (focused instanceof HTMLElement && layer.contains(focused)) focused.blur();
    delete layer.dataset.keyboardOpen;
    layer.style.removeProperty("--diary-keyboard-top");
    layer.style.removeProperty("--diary-keyboard-height");
    if (previousLock === null) html.removeAttribute("data-diary-focus-lock");
    else html.setAttribute("data-diary-focus-lock", previousLock);
    // CSS removal is synchronous; restore the exact pre-open scroll positions.
    scrollers.forEach(({ node, top, left }) => { node.scrollTop = top; node.scrollLeft = left; });
    win.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
  };
}
