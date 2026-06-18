export type ParticleKind = "primary" | "displaced";

/** Either a THREE.Vector3 or a plain {x,y,z} object (Raycaster allocates
 *  the latter to avoid pulling the Vector3 into a hot allocation path). */
export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface RaycastHit {
  which: ParticleKind;
  instanceId: number;
  point: Point3;
  distance?: number;
}

/** Runtime intensity modes for the warp sim. */
export type SimMode = "normal" | "slow" | "portal";

export interface SimOptions {
  maxPixelRatio?: number;
  alwaysRun?: boolean;
}

export interface ParticleBuffers {
  positions: Float32Array;
  velocities: Float32Array;
  rotations: Float32Array;
  rotSpeeds: Float32Array;
  scales: Float32Array;
  /** Per-instance mass (kg-like). Larger asteroids are heavier. */
  masses: Float32Array;
  /** Per-instance bounding-sphere radius (world units). */
  radii: Float32Array;
  /** Per-instance velocity multiplier, sampled once at seed time.
   *  Multiplies the Z-velocity (and indirectly the lateral radial
   *  velocity) so the field has visible variance within a single
   *  mode. Without this every asteroid would move at the same rate
   *  and the warp would feel like a treadmill, not a stream. */
  velocityScales: Float32Array;
}
