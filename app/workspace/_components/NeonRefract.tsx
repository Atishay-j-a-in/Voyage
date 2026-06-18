"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ReactElement, ReactNode, CSSProperties } from "react";

/**
 * useNeonRefract
 * --------------
 * Cursor-driven neon refraction for any element. On pointer-move
 * we set three CSS variables on the element:
 *
 *   --rf-x  0..1  position of the cursor (X)
 *   --rf-y  0..1  position of the cursor (Y)
 *   --rf-p  0..1  "presence" 1 on enter, 0 on leave, eased
 *
 * The companion CSS in `globals.css` (`.glass-refract`,
 * `.liquid-glass*::before`) draws a radial neon ring at the
 * border of the element using those variables. The element's
 * own children sit above the ring (`z-index: 2`) so the glass
 * surface stays interactive.
 */
export function useNeonRefract<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  style: CSSProperties;
  onPointerMove: (e: React.PointerEvent<T>) => void;
  onPointerEnter: (e: React.PointerEvent<T>) => void;
  onPointerLeave: (e: React.PointerEvent<T>) => void;
} {
  const ref = useRef<T | null>(null);
  const raf = useRef<number | null>(null);

  const apply = useCallback((x: number, y: number, p: number) => {
    const el = ref.current;
    if (!el) return;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--rf-x", x.toFixed(3));
      el.style.setProperty("--rf-y", y.toFixed(3));
      el.style.setProperty("--rf-p", p.toFixed(3));
    });
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width);
      const y = (e.clientY - r.top) / Math.max(1, r.height);
      apply(x, y, 1);
    },
    [apply],
  );

  const onPointerEnter = useCallback(
    (_e: React.PointerEvent<T>) => {
      apply(0.5, 0.5, 1);
    },
    [apply],
  );

  const onPointerLeave = useCallback(
    (_e: React.PointerEvent<T>) => {
      apply(0.5, 0.5, 0);
    },
    [apply],
  );

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, style: {}, onPointerMove, onPointerEnter, onPointerLeave };
}

/**
 * Refract
 * -------
 * Convenience wrapper. Drop it around any element that should
 * pick up cursor-driven neon refraction:
 *
 *   <Refract className="liquid-glass-bubble p-4"> ... </Refract>
 *
 * It forwards className/style to the inner div, applies the
 * pointer handlers, and exposes the same CSS variables.
 */
export function Refract({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}): ReactElement {
  const { ref, onPointerMove, onPointerEnter, onPointerLeave } =
    useNeonRefract<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={"glass-refract " + className}
      style={style}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}

/**
 * RefractGlobal
 * -------------
 * Drives every `.glass-refract` /
 * `.liquid-glass-bubble-refract` / `.liquid-glass` /
 * `.liquid-glass-strong` element on the page. Two effects:
 *
 *  1. Cursor pass  - delegated `pointermove` listener; the
 *                    element under the cursor is lit up.
 *  2. Source pass  - every element with `[data-refract-source]`
 *                    (e.g. the floating energy orb) is polled
 *                    each animation frame; any glass surface
 *                    within a radius gets lit up, with a
 *                    proximity falloff (1.0 at zero distance, 0
 *                    at the radius). When a source moves away
 *                    the surface fades back to 0.
 *
 * Both effects write the same three CSS variables on each
 * surface: --rf-x, --rf-y, --rf-p. The CSS ring reads them.
 */
export function RefractGlobal({
  selector = ".glass-refract, .liquid-glass-bubble-refract, .liquid-glass, .liquid-glass-strong",
  sourceSelector = "[data-refract-source]",
  sourceRadius = 220,
  cursorStrength = 1.0,
  sourceStrength = 0.85,
}: {
  selector?: string;
  sourceSelector?: string;
  /** px - beyond this distance a source has no effect on a surface. */
  sourceRadius?: number;
  /** 0..1 - peak presence from the cursor at the element center. */
  cursorStrength?: number;
  /** 0..1 - peak presence from a source at the element center. */
  sourceStrength?: number;
}): ReactElement | null {
  useEffect(() => {
    let active: HTMLElement | null = null;
    let raf = 0;
    // Per-surface state: which sources are currently "lighting"
    // it, and their contribution. We need this to fade a surface
    // back to 0 once a source moves away (so we don't snap off).
    type SurfaceState = {
      el: HTMLElement;
      cursorP: number; // 0..1, driven by cursor
      sourceP: number; // 0..1, driven by the nearest source
      // The current x,y values being written to the CSS vars.
      x: number;
      y: number;
      // Last frame values (for smoothing).
      prevX: number;
      prevY: number;
      prevP: number;
    };
    const surfaces = new Map<HTMLElement, SurfaceState>();

    const setVars = (
      state: SurfaceState,
      x: number,
      y: number,
      p: number,
    ): void => {
      state.x = x;
      state.y = y;
      // We coalesce DOM writes into one rAF tick per frame to
      // avoid layout thrash.
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p1 = Math.max(0, Math.min(1, p));
        state.el.style.setProperty("--rf-x", x.toFixed(3));
        state.el.style.setProperty("--rf-y", y.toFixed(3));
        state.el.style.setProperty("--rf-p", p1.toFixed(3));
      });
    };

    const getOrCreateSurface = (el: HTMLElement): SurfaceState => {
      let s = surfaces.get(el);
      if (s) return s;
      s = {
        el,
        cursorP: 0,
        sourceP: 0,
        x: 0.5,
        y: 0.5,
        prevX: 0.5,
        prevY: 0.5,
        prevP: 0,
      };
      surfaces.set(el, s);
      return s;
    };

    const findAncestor = (start: EventTarget | null): HTMLElement | null => {
      let n = start as HTMLElement | null;
      while (n && n !== document.body) {
        if (n.matches && n.matches(selector)) return n;
        n = n.parentElement;
      }
      return null;
    };

    // ---- Cursor pass -------------------------------------------
    const onMove = (e: PointerEvent): void => {
      const target = findAncestor(e.target);
      if (!target) {
        if (active) {
          const s = getOrCreateSurface(active);
          s.cursorP = 0;
        }
        active = null;
        return;
      }
      if (target !== active) {
        if (active) {
          const s = getOrCreateSurface(active);
          s.cursorP = 0;
        }
        active = target;
      }
      const s = getOrCreateSurface(target);
      s.cursorP = 1;
      const r = target.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width);
      const y = (e.clientY - r.top) / Math.max(1, r.height);
      s.prevX = x;
      s.prevY = y;
    };

    const onLeave = (): void => {
      if (active) {
        const s = getOrCreateSurface(active);
        s.cursorP = 0;
      }
      active = null;
    };

    // ---- Source pass -------------------------------------------
    // Each animation frame: collect source rects, then for every
    // surface compute its distance to the nearest source. If
    // within `sourceRadius`, light it up with a falloff. Smooth
    // the per-frame values to avoid flicker as the source moves.
    let sourceRects: { cx: number; cy: number; r: number }[] = [];

    const collectSources = (): void => {
      const nodes = document.querySelectorAll(sourceSelector);
      const next: { cx: number; cy: number; r: number }[] = [];
      nodes.forEach((n) => {
        const el = n as HTMLElement;
        const rect = el.getBoundingClientRect();
        // The source is a moving div; treat its center as the
        // "pointer" position and its half-diagonal as the source
        // radius (so a bigger source affects a larger area).
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const r = Math.max(rect.width, rect.height) / 2;
        next.push({ cx, cy, r });
      });
      sourceRects = next;
    };

    const tick = (): void => {
      collectSources();

      // Update the cursor-active surface's variables (it has a
      // 1.0 presence and the cursor's last position).
      if (active) {
        const s = getOrCreateSurface(active);
        const p = s.cursorP * cursorStrength;
        if (p > 0.001 || s.prevP > 0.001) {
          // Smoothing toward target presence.
          const next = s.prevP + (p - s.prevP) * 0.35;
          setVars(s, s.prevX, s.prevY, next);
          s.prevP = next;
        }
      }

      // For every tracked surface (including the cursor one),
      // compute source proximity and write the dominant result.
      surfaces.forEach((s) => {
        if (s.el === active) return; // cursor pass owns it
        // Find the strongest source contribution.
        let bestP = 0;
        let bestX = 0.5;
        let bestY = 0.5;
        for (const src of sourceRects) {
          const sr = s.el.getBoundingClientRect();
          // Closest point on the surface rect to the source.
          const cx = Math.max(sr.left, Math.min(src.cx, sr.right));
          const cy = Math.max(sr.top, Math.min(src.cy, sr.bottom));
          const dx = src.cx - cx;
          const dy = src.cy - cy;
          const dist = Math.hypot(dx, dy);
          const reach = sourceRadius + src.r;
          if (dist >= reach) continue;
          const fall = 1 - dist / reach; // 1 at the source, 0 at reach
          const p = fall * fall * sourceStrength; // ease-in falloff
          if (p > bestP) {
            bestP = p;
            // Project the source center into the surface's
            // local 0..1 space.
            bestX = (src.cx - sr.left) / Math.max(1, sr.width);
            bestY = (src.cy - sr.top) / Math.max(1, sr.height);
          }
        }
        s.sourceP = bestP;
        const target = bestP;
        const next = s.prevP + (target - s.prevP) * 0.25;
        if (next > 0.001 || s.prevP > 0.001) {
          setVars(s, bestX, bestY, next);
        }
        s.prevX = bestX;
        s.prevY = bestY;
        s.prevP = next;
      });

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      surfaces.forEach((s) => {
        s.el.style.setProperty("--rf-p", "0");
      });
      surfaces.clear();
    };
  }, [
    selector,
    sourceSelector,
    sourceRadius,
    cursorStrength,
    sourceStrength,
  ]);

  return null;
}