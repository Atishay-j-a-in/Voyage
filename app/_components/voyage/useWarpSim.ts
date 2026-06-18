"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createSim,
  Sim,
  WebGPUUnsupportedError,
  type RaycastHit,
  type SimMode,
} from "./warp";

export interface UseWarpSimResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: Error | null;
  /** Switch runtime mode. Returns a stable callback. */
  setMode: (mode: SimMode) => void;
}

/**
 * Mounts the WebGPU Warp Sim onto a canvas ref.
 *
 * Lifecycle:
 *   1. createSim(canvas, isMounted) -> Promise<Sim>  (sync construct, async init)
 *   2. After init resolves, if isMounted is still true, start the loop
 *   3. Otherwise, dispose immediately (Strict Mode safety)
 *
 * `prefers-reduced-motion` skips `sim.start()` and the loop never begins.
 */
export function useWarpSim(): UseWarpSimResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Ref keeps the sim instance out of React's render cycle so callers
  // can fire-and-forget `setMode` without re-renders.
  const simRef = useRef<Sim | null>(null);

  const setMode = useCallback((mode: SimMode) => {
    simRef.current?.setMode(mode);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let isMounted = true;
    let sim: Sim | null = null;

    const handlePointerMove = (e: PointerEvent): void => {
      if (!sim) return;
      sim.setCursorFromClient(e.clientX, e.clientY);
    };

    const handlePointerDown = (e: PointerEvent): void => {
      if (!sim) return;
      if (e.button !== 0) return;
      sim.setCursorFromClient(e.clientX, e.clientY);
      const hit: RaycastHit | null = sim.pickAsteroid();
      if (hit) sim.triggerBlast(hit);
    };

    const handleResize = (): void => {
      sim?.resize();
    };

    createSim(canvas, () => isMounted)
      .then((s: Sim | null) => {
        if (!s) return; // createSim disposed it because we unmounted mid-init.
        if (!isMounted) {
          s.dispose();
          return;
        }
        sim = s;
        simRef.current = s;
        if (!reduceMotion) s.start();
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("resize", handleResize);
      })
      .catch((e: unknown) => {
        if (isMounted) setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      isMounted = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
      simRef.current = null;
      sim?.dispose();
      sim = null;
    };
  }, []);

  // Reference the class so the import is not tree-shaken; the error
  // type is also exported for downstream `instanceof` checks.
  void WebGPUUnsupportedError;

  return { canvasRef, error, setMode };
}
