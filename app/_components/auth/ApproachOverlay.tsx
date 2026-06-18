"use client";

import { useEffect, useState } from "react";

interface ApproachOverlayProps {
  active: boolean;
  galaxy: string;
  /** 0..1 progress through the ramp. */
  progress: number;
}

/** Fade-out duration when `active` flips to false after the ramp. */
const FADE_OUT_MS = 600;

/**
 * Cinematic full-screen overlay shown during the post-auth approach.
 * The progress bar fills from 0 -> 100% across the ramp, and the
 * status line cycles through "Drift, sign in, continue." -> a numeric
 * "distance" that counts down.
 */
export function ApproachOverlay({
  active,
  galaxy,
  progress,
}: ApproachOverlayProps): React.ReactElement | null {
  // Distance counts down from 100.0 to 0.0 ly as progress climbs.
  const distance = (100 * (1 - progress)).toFixed(1);
  // Status cycles through three phases so the user has a sense of motion.
  const [phase, setPhase] = useState<"aligning" | "approaching" | "final">(
    "aligning",
  );

  useEffect(() => {
    if (!active) return;
    if (progress < 0.33) setPhase("aligning");
    else if (progress < 0.85) setPhase("approaching");
    else setPhase("final");
  }, [active, progress]);

  if (!active && progress <= 0) return null;
  // Once the ramp resolves (`active` flips to false) keep the overlay
  // mounted for a brief fade-out so the transition into the workspace
  // content is smooth instead of a hard pop.
  const opacity = active ? 1 : 0;
  const pointerEvents = active ? "auto" : "none";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity ease-out"
      style={{
        opacity,
        pointerEvents,
        transitionDuration: `${FADE_OUT_MS}ms`,
        // Soft radial vignette darkens the center where the text lives
        // so the asteroids do not bleed through the copy. Outer ring
        // stays nearly transparent so the warp stream is fully visible.
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0) 70%)",
      }}
    >
      {/* Text panel: a soft glow + drop shadow keeps every line
          legible even when a bright asteroid streaks behind it. */}
      <div
        className="flex flex-col items-center gap-7 text-center px-6"
        style={{
          textShadow:
            "0 0 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.9)",
        }}
      >
        {/* Top eyebrow */}
        <span className="font-mono text-[11px] tracking-[0.32em] uppercase text-[var(--accent-neon)]">
          Auth Junction
        </span>

        {/* Animated dot row */}
        <div className="flex items-center gap-2 text-[var(--accent-neon)]" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-neon)] shadow-[0_0_10px_var(--accent-neon)] animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-[var(--accent-neon)]/70 animate-pulse [animation-delay:120ms]" />
          <span className="h-1 w-1 rounded-full bg-[var(--accent-neon)]/50 animate-pulse [animation-delay:240ms]" />
        </div>

        {/* Main copy */}
        <div className="space-y-2">
          <p className="font-mono text-[10.5px] tracking-[0.32em] uppercase text-white/80">
            Approaching
          </p>
          <h2 className="font-semibold tracking-[-0.035em] leading-[1.05] text-white text-[clamp(2rem,5vw,3.5rem)] text-balance">
            <span className="text-[var(--accent-neon)]">{galaxy}</span>
          </h2>
        </div>

        {/* Status line */}
        <p className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-white/80">
          {phase === "aligning" && "Aligning drift..."}
          {phase === "approaching" && "Matching local velocity..."}
          {phase === "final" && "Course locked."}
        </p>

        {/* Progress bar */}
        <div className="w-[min(420px,80vw)]">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-neon)] transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10.5px] tracking-[0.18em] uppercase text-white/70">
            <span>{distance} ly</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
