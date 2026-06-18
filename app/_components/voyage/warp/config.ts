import type { ParticleKind } from "./types";

/**
 * All Warp sim tunables live here. Frozen so consumers cannot mutate
 * at runtime; a future v2 can swap this for a per-section preset.
 */
export const WARP_CONFIG = Object.freeze({
  /** Total number of asteroids. */
  asteroidCount: 250,
  /** Fraction of asteroids that use the displaced (larger, subdivided) mesh. */
  displacedRatio: 0.4,


 

  /** Spawn Z for warp particles (deep into the scene). */
  spawnZ: -600,
  /** Recycle Z when a particle flies past the camera. */
  recycleZ: -600,
  /** Kill Z (particle is recycled when its Z exceeds this). */
  killZ: 15,
  /** Far Z (out-of-bounds recycle). */
  farZ: -800,
  /** Out-of-bounds lateral kill. */
  outOfBoundsX: 200,

  /** Lateral spread for asteroid X. */
  asteroidSpreadX: 30,
  /** Lateral spread for asteroid Y. */
  asteroidSpreadY: 30,

  /** Radial gain: vx = posX * radialGain, vy = posY * radialGain. */
  asteroidRadialGain: 0.015,

  /** Z velocity range for asteroids. The mode-based speed multiplier
   *  on top of this gives the slow vs portal feel. We deliberately
   *  push the ceiling up so the portal (12x) phase has headroom to
   *  read as a true hyper-warp. */
  asteroidVelZ: { min: 8, max: 18 },
  /** Per-instance velocity multiplier. Each asteroid gets a random
   *  scale in [min, max) at seed time, so even within a single mode
   *  the field has visible variance: some bodies stream past quickly,
   *  others drift. Multiplied on top of `asteroidVelZ` and the
   *  mode-based speed scale. */
  asteroidVelocityVariance: { min: 0.55, max: 1.6 },

  /** Scale range for primary asteroids. */
  primaryScale: { min: 0.2, max: 1.0 },
  /** Scale range for displaced asteroids. */
  displacedScale: { min: 0.9, max: 1.8 },

  /** Click blast linear speed (shoot outward). Tuned to match the
   *  top end of the landing-page asteroid Z range so taps feel
   *  snappy even when the field is running in slow mode. */
  blastSpeed: 120,
  /** Click blast lateral scatter. */
  blastScatter: 6,
  /** Click blast rotation multiplier. */
  blastRotMul: 10,
  /** Coefficient of restitution for asteroid-asteroid elastic collisions. */
  collisionRestitution: 0.85,
  /** Maximum impulse per frame from collisions, prevents tunneling. */
  maxCollisionImpulse: 8,
  /** When true, the update loop runs the O(N^2) collision pass. */
  enableCollisions: true,

  /** Hyperspace velocity profile. */
  velocity: Object.freeze({
    base: 1.0,
    sectionPulse: 0.8,
    sectionPulseHalfLife: 0.8,
    clickBoost: 1.0,
    clickBoostHalfLife: 0.6,
    clickBoostMaxAge: 2.0,
  }),

  /** Camera parallax. */
  camera: Object.freeze({
    fov: 60,
    near: 0.1,
    far: 4000,
    z: 10,
    parallaxTargetMul: 2.0,
    parallaxLerp: 0.05,
  }),

  /** Cursor gravity is OFF by default. */
  cursorGravity: 0.0,
  cursorProjectionDistance: 6,

  /** Lighting. */
  lighting: Object.freeze({
    ambient: { color: 0xffffff, intensity: 0.18 },
    directional: { color: 0xffffff, intensity: 1.1, position: [5, 5, 5] as const },
  }),
});

export function randRange(min: number, max: number, rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

export function oppositeKind(kind: ParticleKind): ParticleKind {
  return kind === "primary" ? "displaced" : "primary";
}


