"use client";

import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import type { SimMode } from "../../_components/voyage/warp";
import { WarpBackground } from "../../_components/auth/WarpBackground";
import { useApproachTransition } from "../../_components/auth/useApproachTransition";
import { ApproachOverlay } from "../../_components/auth/ApproachOverlay";

/**
 * Full-screen cinematic shown immediately after a successful auth.
 *
 *   - Mounts the warp sim in "slow" mode (0.25x) so the user sees
 *     the field start calm. The first few hundred milliseconds are
 *     readable.
 *   - Boots the approach transition, which flips the mode to
 *     "portal" (22x hyper-warp) and ramps it over 3.5s. The user
 *     gets a clear "speeding up" sensation.
 *   - When the ramp completes, push to /workspace (which is plain
 *     black). The workspace never sees the warp sim.
 *
 * This component owns its own screen; nothing else is rendered
 * behind it, so the workspace content and the loader can never
 * overlap.
 */
export function LoadingScreen(): ReactElement {
  const modeRef = useRef<SimMode>("slow");
  const { start: startApproach, active, galaxy, progress } =
    useApproachTransition(modeRef, "/workspace");

  useEffect(() => {
    // Kick the ramp as soon as the canvas is up. A short delay lets
    // the WebGPU init resolve so the first frame already shows
    // accelerating asteroids.
    const id = window.setTimeout(startApproach, 250);
    return () => window.clearTimeout(id);
  }, [startApproach]);

  return (
    <main className="relative min-h-[100dvh] w-full text-white bg-[var(--void)]">
      <WarpBackground modeRef={modeRef} />
      <ApproachOverlay active={active} galaxy={galaxy} progress={progress} />
    </main>
  );
}