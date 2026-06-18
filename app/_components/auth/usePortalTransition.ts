"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SimMode } from "../voyage/warp";

/**
 * Coordinates the "portal" transition after a successful auth.
 *
 *   1. Caller invokes `start()` once auth is complete.
 *   2. We flip the parent's modeRef to "portal" so the warp sim ramps
 *      to ~100x baseline over PORTAL_RAMP_SECONDS.
 *   3. We then wait PORTAL_HOLD_SECONDS and push the redirect URL.
 *
 * `start` is idempotent: a second call while a transition is in flight
 * is a no-op.
 */
export interface PortalTransition {
  start: () => void;
  /** True while the portal animation + redirect are in flight. */
  inFlight: () => boolean;
}

const RAMP_MS = 1200;
const HOLD_MS = 200;

export function usePortalTransition(
  modeRef: React.MutableRefObject<SimMode>,
  redirectUrl: string,
): PortalTransition {
  const router = useRouter();
  const flightRef = useRef(false);

  const start = useCallback((): void => {
    if (flightRef.current) return;
    flightRef.current = true;
    modeRef.current = "portal";
    window.setTimeout(() => {
      router.push(redirectUrl);
    }, RAMP_MS + HOLD_MS);
  }, [modeRef, redirectUrl, router]);

  const inFlight = useCallback((): boolean => flightRef.current, []);

  return { start, inFlight };
}
