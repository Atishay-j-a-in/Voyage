"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { EnergyOrb } from "./EnergyOrb";

/**
 * FloatingOrb
 * -----------
 * A free-drifting energy orb in the workspace.
 *
 * Architecture:
 *   - ONE long-lived RAF loop registered on mount, never re-created.
 *   - It reads `phase` and `home` from refs each tick, so React
 *     state changes never tear down the loop.
 *   - The orb re-anchors only when the parent increments
 *     `homeTick` (a monotonic counter) - never on its own drift.
 *   - `pointerenter` triggers a burst, but a 1600ms cooldown
 *     prevents a stationary cursor from causing a continuous
 *     burst+respawn loop as the orb sweeps under it.
 */

const ORB_PX = 40;
const MAX_SPEED = 640;
const WOBBLE = 0.675;
const CLIP = 8;
const BURST_COOLDOWN_MS = 1600;
const BURST_DURATION_MS = 700;
const TELEPORT_DURATION_MS = 16;

type Point = { x: number; y: number };

function pickRandomPoint(): Point {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: CLIP + Math.random() * Math.max(1, vw - ORB_PX - CLIP * 2),
    y: CLIP + Math.random() * Math.max(1, vh - ORB_PX - CLIP * 2),
  };
}

type Phase = "drift" | "burst" | "teleport";

export function FloatingOrb({
  calendarOpen: _calendarOpen,
}: {
  calendarOpen: boolean;
}): ReactElement {
  const [phase, setPhase] = useState<Phase>("drift");
  const [home, setHome] = useState<Point | null>(null);
  const [homeTick, setHomeTick] = useState(0);
  // Refs mirror state so the long-lived RAF loop always reads the
  // latest values without re-binding.
  const phaseRef = useRef<Phase>(phase);
  const homeRef = useRef<Point | null>(home);
  const homeTickRef = useRef<number>(homeTick);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // Cooldown so a stationary cursor sitting on the orb's path
  // doesn't trigger a continuous burst+respawn loop.
  const lastBurstAtRef = useRef<number>(0);
  // Continuous 0..1 dispersion value. The RAF loop writes
  // to this ref each frame; EnergyOrb reads from it
  // directly so updating dispersion does NOT re-render React.
  const dispersionRef = useRef<number>(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    homeRef.current = home;
  }, [home]);
  useEffect(() => {
    homeTickRef.current = homeTick;
  }, [homeTick]);

  // Pick the initial home point after the first mount.
  useEffect(() => {
    if (home === null) {
      const id = window.setTimeout(() => {
        setHome(pickRandomPoint());
        setHomeTick((n) => n + 1);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [home]);

  // Single, mount-once RAF loop. Drives every phase.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let x = 0;
    let y = 0;
    let last = performance.now();
    let lastHomeTick = -1; // re-anchor on the first home change
    // Phase-transition markers. The RAF loop must detect a phase
    // change so it can reset the per-phase timing variables. We
    // track this with `prevPhase` instead of resetting to 0
    // because the per-phase durations are derived from `now`,
    // not accumulated.
    let prevPhase: Phase = "drift";
    let burstEnteredAt = 0;
    let teleportEnteredAt = 0;

    const tick = (): void => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) * 0.001);
      last = now;
      const t = (now - start) * 0.001;
      const ph = phaseRef.current;
      const h = homeRef.current;
      const el = wrapRef.current;

      if (!el) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Detect phase transitions. We reset per-phase timing here
      // (rather than relying on a sentinel like 0) so every
      // burst/teleport cycle gets a clean t=0 baseline. This
      // fixes the "only first burst animates" bug where the
      // previous burst's `burstStart` was never cleared, so the
      // second burst saw a huge `t2` and snapped straight to
      // `d = 1`.
      if (ph !== prevPhase) {
        if (ph === "burst") burstEnteredAt = now;
        if (ph === "teleport") teleportEnteredAt = now;
        prevPhase = ph;
      }

      if (ph === "drift") {
        // Re-anchor only when the parent says home changed.
        if (homeTickRef.current !== lastHomeTick) {
          lastHomeTick = homeTickRef.current;
          if (h) {
            x = h.x;
            y = h.y;
          }
        }

        // Target: a Lissajous on the full viewport.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tx =
          CLIP +
          (Math.sin(t * 1.0) * 0.48 + Math.cos(t * 0.7) * 0.22 + 0.5) *
            (vw - ORB_PX - CLIP * 2);
        const ty =
          CLIP +
          (Math.cos(t * 0.9) * 0.46 + Math.sin(t * 0.65) * 0.26 + 0.5) *
            (vh - ORB_PX - CLIP * 2);

        const dx = tx - x;
        const dy = ty - y;
        const desiredHeading = Math.atan2(dy, dx);
        const wobble = Math.sin(t * 7) * 0.6 + Math.cos(t * 10.5) * 0.4;
        const heading = desiredHeading + wobble * WOBBLE;

        const step = MAX_SPEED * dt;
        x += Math.cos(heading) * step;
        y += Math.sin(heading) * step;

        if (x < CLIP) x = CLIP;
        if (y < CLIP) y = CLIP;
        if (x > vw - ORB_PX - CLIP) x = vw - ORB_PX - CLIP;
        if (y > vh - ORB_PX - CLIP) y = vh - ORB_PX - CLIP;

        el.style.left = `${x.toFixed(1)}px`;
        el.style.top = `${y.toFixed(1)}px`;
        el.style.setProperty(
          "--drift-x",
          `${(Math.sin(t * 23) * 1.2).toFixed(1)}px`,
        );
        el.style.setProperty(
          "--drift-y",
          `${(Math.cos(t * 27) * 1.2).toFixed(1)}px`,
        );
        el.style.transform = `translate3d(var(--drift-x,0px), var(--drift-y,0px), 0) rotate(${(wobble * 0.35).toFixed(2)}rad)`;
        el.style.opacity = "1";
      } else if (ph === "burst") {
        const t2 = (now - burstEnteredAt) / BURST_DURATION_MS;
        const d = Math.min(1, t2);
        const eased = 1 - Math.pow(1 - d, 3);
        dispersionRef.current = eased;
        el.style.opacity = "1";
        if (d >= 1) {
          // Burst complete: re-anchor and step into teleport.
          setHome(pickRandomPoint());
          setHomeTick((n) => n + 1);
          dispersionRef.current = 0;
          setPhase("teleport");
        }
      } else if (ph === "teleport") {
        el.style.opacity = "0";
        if (now - teleportEnteredAt > TELEPORT_DURATION_MS) {
          setPhase("drift");
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []); // mount-once

  if (!home) return <></>;

  return (
    <div
      ref={wrapRef}
      onPointerEnter={() => {
        if (phaseRef.current !== "drift") return;
        const now = performance.now();
        if (now - lastBurstAtRef.current < BURST_COOLDOWN_MS) return;
        lastBurstAtRef.current = now;
        setPhase("burst");
      }}
      aria-label="Floating energy orb (hover to disperse)"
      data-refract-source="true"
      className="pointer-events-auto fixed z-30 select-none"
      style={{
        width: `${ORB_PX}px`,
        height: `${ORB_PX}px`,
        left: 0,
        top: 0,
        opacity: 0,
        transition: "opacity 220ms ease-out",
        cursor: "pointer",
      }}
    >
      <EnergyOrb
        size={ORB_PX}
        dispersionRef={dispersionRef}
        seedSalt={Math.floor((home.x + home.y) * 0.27)}
      />
    </div>
  );
}