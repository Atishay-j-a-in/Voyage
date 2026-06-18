import { WARP_CONFIG } from "../config";
import type { SimMode } from "../types";
export type { SimMode };

/**
 * Hyperspace velocity profile.
 *
 *   speed(t) = (base + section + click) * modeScale
 *
 * The `modeScale` is interpolated smoothly toward a target when `setMode`
 * is called. The portal target ramps from 1.0 up to ~100x over the
 * duration of the transition so the auth-success warp feels earned.
 */
export interface VelocityInputs {
  now: number;
  mountedAt: number;
  lastClickAt: number | null;
  /** Current effective speed multiplier. Owned by the sim, passed in. */
  modeScale: number;
}

export const MODE_TARGET_SCALE: Record<SimMode, number> = {
  /** Landing page: punchy but readable. */
  normal: 1.0,
  /** Auth pages: deliberately sleepy, gives the form the spotlight. */
  slow: 0.25,
  /** Post-auth loading: extreme max hyper-velocity. Pushed well past
   *  the landing baseline (1.0) so the acceleration phase reads as
   *  a true hyper-warp. ~22x gives asteroids a real streaking
   *  sensation, with per-instance variance (`asteroidVelocityVariance`)
   *  layering on top so the field feels like a stream, not a wall. */
  portal: 22.0,
};

/** Total seconds the post-auth acceleration takes. 3.5s gives the user
 *  enough time to see the asteroids visibly pick up speed before the
 *  page transitions to /workspace. */
export const PORTAL_RAMP_SECONDS = 3.5;
/** Hold at the peak briefly before resolving. */
export const PORTAL_HOLD_SECONDS = 0.3;

export function computeSpeed(inputs: VelocityInputs): number {
  const v = WARP_CONFIG.velocity;
  const age = Math.max(0, inputs.now - inputs.mountedAt);
  const section = v.sectionPulse * Math.exp(-age / v.sectionPulseHalfLife);
  let click = 0;
  if (inputs.lastClickAt !== null) {
    const dt = Math.max(0, inputs.now - inputs.lastClickAt);
    if (dt < v.clickBoostMaxAge) {
      click = v.clickBoost * Math.exp(-dt / v.clickBoostHalfLife);
    }
  }
  return (v.base + section + click) * inputs.modeScale;
}
