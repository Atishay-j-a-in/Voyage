"use client";

import { useMemo } from "react";
import type { CSSProperties, ReactElement } from "react";

/**
 * Pure-DOM twinkling star field.
 *
 * - 220 stars placed at deterministic (LCG-seeded) positions.
 * - Per-star size (3 to 10 px), opacity, twinkle period and phase
 *   so the field never breathes in sync.
 * - No canvas, no listeners, no interactivity.
 */

interface Star {
  top: number;
  left: number;
  size: number;
  baseOpacity: number;
  delayMs: number;
  durationMs: number;
}

const STAR_COUNT = 140;

function makeStars(): Star[] {
  let seed = 0x1f2c3b4a;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const top = 0.5 + rand() * 99;     // 0.5..99.5 vh
    const left = 0.5 + rand() * 99;    // 0.5..99.5 vw
    // Size ramp. The dots themselves are 1-2px (the actual star),
    // not the glow \u2014 a heavy blur on a small dot reads as a giant
    // orb, which the user flagged as distracting. The visible size
    // comes from the dot itself; the glow is a small halo that
    // softens the edge.
    // 1px (70%) -> 1.5px (22%) -> 2px (8%).
    const sizeRoll = rand();
    const size = sizeRoll < 0.7 ? 1 : sizeRoll < 0.92 ? 1.5 : 2;
    // Most stars are very faint (background), a handful are brighter.
    // Lower ceiling than before so the field reads as distant.
    const baseOpacity = 0.12 + Math.pow(rand(), 2.4) * 0.5;
    const durationMs = 2400 + Math.floor(rand() * 4400);
    const delayMs = Math.floor(rand() * 6000);
    stars.push({ top, left, size, baseOpacity, delayMs, durationMs });
  }
  return stars;
}

export function StarField(): ReactElement {
  const stars = useMemo<Star[]>(makeStars, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {stars.map((s, i) => {
        // Tiny halo. The radius and alpha are deliberately modest
        // so the field reads as distant specks of light rather than
        // glowing orbs. A 1px star has a 1.5px halo at 0.18 alpha; a
        // 2px star has a 2.5px halo at 0.22 alpha.
        const glow = s.size * 1.4;
        const glowAlpha = 0.14 + s.size * 0.05;
        const style: CSSProperties = {
          top: `${s.top}vh`,
          left: `${s.left}vw`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          opacity: s.baseOpacity,
          animationDuration: `${s.durationMs}ms`,
          animationDelay: `${s.delayMs}ms`,
          boxShadow: `0 0 ${glow}px ${glow}px rgba(255, 255, 255, ${glowAlpha})`,
        };
        return <span key={i} className="star-twinkle absolute rounded-full bg-white" style={style} />;
      })}
    </div>
  );
}