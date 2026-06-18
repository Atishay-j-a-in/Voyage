"use client";

import { useEffect, useRef } from "react";
import { createSim, Sim, WebGPUUnsupportedError, type SimMode } from "../voyage/warp";

/**
 * Mounts the warp sim and sets its mode to `slow` on mount. The parent
 * can call `setMode("portal")` via the `modeRef` argument to ramp the
 * speed up to 100x for the auth-success portal effect.
 *
 * The canvas is fixed full-bleed and behind everything. We attach
 * pointer/raycast listeners to `window` so taps anywhere in the page
 * reach the sim, while letting the right-column form retain focus.
 */
export interface WarpBackgroundProps {
  modeRef: React.MutableRefObject<SimMode>;
}

export function WarpBackground({ modeRef }: WarpBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      const hit = sim.pickAsteroid();
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
        s.setMode(modeRef.current);
        s.start();
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("resize", handleResize);
      })
      .catch((e: unknown) => {
        // Render a quiet error; the rest of the page still works.
        // eslint-disable-next-line no-console
        if (!(e instanceof WebGPUUnsupportedError)) console.error(e);
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
    // modeRef is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply mode changes triggered by the parent.
  useEffect(() => {
    const id = window.setInterval(() => {
      simRef.current?.setMode(modeRef.current);
    }, 80);
    return () => window.clearInterval(id);
  }, [modeRef]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "var(--void)" }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}