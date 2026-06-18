"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { ReactElement } from "react";

/**
 * EnergyOrb
 * ---------
 * A small (~48px) luminous energy ball drawn on a 2D canvas. The orb
 * is built from many small beads arranged on a Fibonacci-sphere
 * lattice (closest packing on a sphere, which the eye reads as a
 * honeycomb pattern). Each bead "buzzes" — its position offsets
 * from the lattice by a small per-frame noise so the cluster
 * shimmers like a swarm of bees on a comb.
 *
 * Color: same neon cyan as the rest of the dark theme. The beads
 * are drawn with `globalCompositeOperation = "lighter"` so they
 * add together into a unified glow.
 *
 * Renders into a square canvas. The parent should size the wrapper
 * (e.g. `<div className="h-12 w-12">`).
 */
export function EnergyOrb({
  size = 48,
  color = "#00f0ff",
  beadCount = 220,
  className = "",
  dispersion = 0,
  seedSalt = 0,
  dispersionRef,
}: {
  size?: number;
  color?: string;
  beadCount?: number;
  className?: string;
  /** 0..1 - when > 0 the swarm disperses outward radially. */
  dispersion?: number;
  /**
   * Ref-based dispersion for continuous animation without
   * React re-renders. The parent writes a 0..1 value to
   * dispersionRef.current on each frame; we read it
   * from inside the canvas RAF loop. If provided, this
   * overrides the dispersion prop.
   */
  dispersionRef?: MutableRefObject<number>;
  /** Per-instance random seed so multiple orbs do not share orientation. */
  seedSalt?: number;
}): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(size * dpr));
    const H = Math.max(1, Math.round(size * dpr));
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Convert the user-supplied hex to {r,g,b} for fast inner loops.
    const rgb = hexToRgb(color);

    // --- Fibonacci-sphere lattice ------------------------------------
    // Distribute `beadCount` points evenly on a unit sphere using the
    // golden-angle spiral. The result is the most uniform possible
    // distribution, which the eye reads as a hexagonal/honeycomb
    // pattern.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const baseX = new Float32Array(beadCount);
    const baseY = new Float32Array(beadCount);
    const baseZ = new Float32Array(beadCount);
    const phase = new Float32Array(beadCount);
    const seed = new Float32Array(beadCount);
    for (let i = 0; i < beadCount; i++) {
      const y = 1 - (i / (beadCount - 1)) * 2; // 1 .. -1
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i + seedSalt;
      baseX[i] = Math.cos(theta) * r;
      baseY[i] = y;
      baseZ[i] = Math.sin(theta) * r;
      phase[i] = Math.random() * Math.PI * 2;
      seed[i] = Math.random();
    }

    // Project a 3D unit-sphere point to 2D screen-space.
    // We treat the camera as fixed, looking at the origin from +Z.
    const cx = W / 2;
    const cy = H / 2;
    // `focal` is the radius of the orb on screen (in pixels).
    const focal = Math.min(W, H) * 0.42;
    const camZ = 2.2;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let rafId = 0;
    const start = performance.now();

    const draw = (): void => {
      const t = (performance.now() - start) * 0.001;

      // Slow rotation of the whole cluster (Y axis) + small wobble on X.
      const rotY = reduceMotion ? 0 : t * 0.35;
      const rotX = reduceMotion ? 0 : Math.sin(t * 0.2) * 0.18;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Clear with full transparency each frame.
      ctx.clearRect(0, 0, W, H);

      // Additive blending: each bead's color is added to the
      // framebuffer, so overlapping beads brighten the cluster.
      ctx.globalCompositeOperation = "lighter";

      // Soft outer halo — drawn first so the beads sit on top of
      // it as brighter points. The halo is a radial gradient
      // centered on the orb.
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        focal * 1.25,
      );
      halo.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.55)`);
      halo.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)`);
      halo.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, focal * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Beads.
      const disp = Math.max(0, Math.min(1, dispersionRef ? dispersionRef.current : dispersion));
      const dispOut = disp * 0.9;
      for (let i = 0; i < beadCount; i++) {
        let x = baseX[i];
        let y = baseY[i];
        let z = baseZ[i];

        // Bee-buzz: each bead jitters around its lattice position
        // with a per-bead phase + frequency. The amplitude is small
        // (~3% of the sphere radius) so beads stay near the surface
        // and read as movement on the shell, not flying off.
        if (!reduceMotion) {
          const s = seed[i];
          const amp = 0.025 + s * 0.04;
          const freq = 2.4 + s * 2.6;
          const ph = phase[i];
          const ox = Math.sin(t * freq + ph) * amp;
          const oy = Math.cos(t * freq * 1.13 + ph) * amp;
          const oz = Math.sin(t * freq * 0.87 + ph * 1.3) * amp;
          x += ox;
          y += oy;
          z += oz;
        }

        // Dispersion: pull the bead radially outward by dispOut.
        x += baseX[i] * dispOut;
        y += baseY[i] * dispOut;
        z += baseZ[i] * dispOut;

        // Rotate Y
        const xr1 = x * cosY + z * sinY;
        const zr1 = -x * sinY + z * cosY;
        // Rotate X
        const yr2 = y * cosX - zr1 * sinX;
        const zr2 = y * sinX + zr1 * cosX;

        // Perspective project.
        const persp = camZ / (camZ + zr2);
        const sx = cx + xr1 * focal * persp;
        const sy = cy - yr2 * focal * persp;

        // Beads that are behind the sphere fade out (depth cue).
        const depthFade = Math.max(0, (zr2 + 1) / 2);
        const alpha = (0.35 + depthFade * 0.65) * (1 - disp * 0.6);

        // Bead size shrinks slightly with depth.
        const radius = (1.2 + depthFade * 1.4 + disp * 0.6) * persp * dpr;

        // Each bead is a soft radial gradient (white core, neon halo).
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.85})`);
        grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [size, color, beadCount, seedSalt, dispersionRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={"block " + className}
    />
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}