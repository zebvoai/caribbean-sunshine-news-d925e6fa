// Route code prefetching: lazy route chunks + idle/intent-based preloading.
import { lazy, ComponentType } from "react";
import { prefetchArticle } from "@/lib/articleCache";

type Loader = () => Promise<{ default: ComponentType<any> }>;

interface Entry { test: (path: string) => boolean; load: Loader; priority: number }

const registry: Entry[] = [];
const done = new Set<Loader>();

export function lazyRoute<T extends ComponentType<any>>(
  test: (path: string) => boolean,
  loader: () => Promise<{ default: T }>,
  priority = 1,
) {
  let p: Promise<{ default: T }> | null = null;
  const load = () => (p ??= loader().catch((e) => { p = null; throw e; }));
  registry.push({ test, load, priority });
  return lazy(load);
}

/** Lazy named export helper */
export function lazyNamed<T extends ComponentType<any>>(
  test: (path: string) => boolean,
  loader: () => Promise<Record<string, any>>,
  name: string,
) {
  return lazyRoute(test, () => loader().then((m) => ({ default: m[name] as T })), 2);
}

export function prefetchRoute(path: string) {
  const m = /^\/news\/([^/?#]+)/.exec(path);
  if (m) prefetchArticle(decodeURIComponent(m[1]));
  for (const e of registry) {
    if (e.test(path) && !done.has(e.load)) {
      done.add(e.load);
      e.load().catch(() => done.delete(e.load));
    }
  }
}

export function isSlowConnection() {
  const c = (navigator as any).connection;
  if (!c) return false;
  return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || "");
}

const idle = (cb: () => void) =>
  ((window as any).requestIdleCallback
    ? (window as any).requestIdleCallback(cb, { timeout: 3000 })
    : setTimeout(cb, 1200));

/** Preload all public route chunks during idle time (skipped on slow/data-saver). */
export function prefetchAllRoutesWhenIdle() {
  if (isSlowConnection()) return;
  const queue = [...registry].sort((a, b) => a.priority - b.priority);
  const step = () => {
    const e = queue.shift();
    if (!e) return;
    if (!done.has(e.load)) { done.add(e.load); e.load().catch(() => done.delete(e.load)); }
    idle(step);
  };
  idle(step);
}

/** Global intent listener: prefetch on hover/touch/focus and when links scroll into view. */
export function installLinkPrefetch() {
  const handle = (ev: Event) => {
    const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (a && a.origin === location.origin) prefetchRoute(a.pathname);
  };
  document.addEventListener("pointerover", handle, { passive: true });
  document.addEventListener("touchstart", handle, { passive: true });
  document.addEventListener("focusin", handle);

  if (isSlowConnection() || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const a = en.target as HTMLAnchorElement;
      io.unobserve(a);
      if (a.origin === location.origin) idle(() => prefetchRoute(a.pathname));
    }
  }, { rootMargin: "200px" });
  const seen = new WeakSet<Element>();
  const scan = () => document.querySelectorAll("a[href^='/']").forEach((a) => {
    if (!seen.has(a)) { seen.add(a); io.observe(a); }
  });
  new MutationObserver(() => idle(scan)).observe(document.body, { childList: true, subtree: true });
  idle(scan);
}
