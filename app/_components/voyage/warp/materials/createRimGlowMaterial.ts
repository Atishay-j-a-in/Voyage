import * as THREE from "three/webgpu";
import {
  color,
  cameraPosition,
  positionWorld,
  normalWorld,
  float,
} from "three/tsl";

export interface RimGlowOptions {
  color?: number;
  intensity?: number;
  metalness?: number;
  roughness?: number;
}

/**
 * TSL MeshStandardNodeMaterial with a Fresnel rim emissive.
 *
 * Default color is a warm silver/white (#dbe3ec) so asteroids read as
 * space rocks against the pitch-black void, and stay visually distinct
 * from the neon-cyan accent used in copy / nav / CTAs. Pass `color` to
 * override (e.g. a subtle blue-grey for hero cohesion).
 */
export function createRimGlowMaterial(opts: RimGlowOptions = {}): THREE.MeshStandardNodeMaterial {
  const mat = new THREE.MeshStandardNodeMaterial({
    color: 0x070808,
    metalness: opts.metalness ?? 0.85,
    roughness: opts.roughness ?? 0.35,
  });

  const rimColor = color(opts.color ?? 0xdbe3ec);
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const nDotV = normalWorld.dot(viewDir).saturate();
  const rim = float(1.0).sub(nDotV).pow(2.0);
  mat.emissiveNode = rimColor.mul(rim).mul(opts.intensity ?? 1.2);

  return mat;
}
