import * as THREE from "three";
import type { AsteroidSystem } from "../systems/AsteroidSystem";
import type { RaycastHit } from "../types";

export class AsteroidRaycaster {
  private readonly camera: THREE.Camera;
  private readonly asteroids: AsteroidSystem;
  private readonly ray = new THREE.Raycaster();
  private readonly tmpVec = new THREE.Vector3();

  constructor(camera: THREE.Camera, asteroids: AsteroidSystem) {
    this.camera = camera;
    this.asteroids = asteroids;
  }

  /** Cast a ray and return the nearest asteroid hit, or null. */
  cast(ndc: THREE.Vector2): RaycastHit | null {
    this.ray.setFromCamera(ndc, this.camera);
    const hits = this.ray.intersectObjects(
      [this.asteroids.primary, this.asteroids.displaced],
      false,
    );
    if (hits.length === 0) return null;
    const first = hits[0];
    if (first.instanceId === undefined) return null;
    const which = first.object === this.asteroids.primary ? "primary" : "displaced";
    return {
      which,
      instanceId: first.instanceId,
      point: {
        x: first.point.x,
        y: first.point.y,
        z: first.point.z,
      },
      distance: first.distance,
    };
  }

  /** Convenience: convert a world hit point to a Vector3 (allocates). */
  toVector3(hit: RaycastHit): THREE.Vector3 {
    return this.tmpVec.set(hit.point.x, hit.point.y, hit.point.z);
  }
}
