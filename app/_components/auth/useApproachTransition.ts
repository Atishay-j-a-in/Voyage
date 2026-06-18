"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SimMode } from "../voyage/warp";
import { pickGalaxy } from "./galaxies";

/**
 * Coordinates the "approach" transition.
 *
 *   1. Caller invokes `start()` once they want the cinematic to play.
 *   2. We flip the parent's modeRef to "portal" so the warp sim
 *      accelerates to ~12x baseline over APPROACH_RAMP_MS.
 *   3. We expose a `progress` value (0..1) the overlay uses to
 *      animate the loading bar.
 *   4. If `redirectUrl` is provided, push it after
 *      APPROACH_RAMP_MS + APPROACH_HOLD_MS. If not (e.g. the
 *      workspace owning the transition), the hook simply resolves
 *      and the caller can reveal its own content.
 *
 * `start` is idempotent: a second call while a transition is in
 * flight is a no-op.
 */
export interface ApproachTransition {
  start: () => void;
  inFlight: () => boolean;
  /** True once `start()` has been called. */
  active: boolean;
  /** Galaxy name shown on the overlay. Stable for the life of the
   *  hook so a re-render mid-transition does not change the label. */
  galaxy: string;
  /** 0..1 progress through the ramp. Updated by a private RAF loop. */
  progress: number;
}

const APPROACH_RAMP_MS = 3500;
const APPROACH_HOLD_MS = 300;

export function useApproachTransition(
  modeRef: React.MutableRefObject<SimMode>,
  redirectUrl?: string,
): ApproachTransition {
  const router = useRouter();
  const flightRef = useRef(false);
  const [active, setActive] = useState(false);
  const [galaxy, setGalaxy] = useState<string>(() => pickGalaxy());
  const [progress, setProgress] = useState(0);

  const start = useCallback((): void => {
    if (flightRef.current) return;
    flightRef.current = true;
    setActive(true);
    setGalaxy(pickGalaxy());
    setProgress(0);
    modeRef.current = "portal";

    const startedAt = performance.now();
    let raf = 0;
    const tick = (): void => {
      const elapsed = performance.now() - startedAt;
      const p = Math.min(1, elapsed / APPROACH_RAMP_MS);
      setProgress(p);
      if (p < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);

    window.setTimeout(() => {
      window.cancelAnimationFrame(raf);
      if (redirectUrl) router.push(redirectUrl);
    }, APPROACH_RAMP_MS + APPROACH_HOLD_MS);
  }, [modeRef, redirectUrl, router]);

  const inFlight = useCallback((): boolean => flightRef.current, []);

  return { start, inFlight, active, galaxy, progress };
}