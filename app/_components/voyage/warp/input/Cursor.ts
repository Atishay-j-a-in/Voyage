import * as THREE from "three";
import { WARP_CONFIG } from "../config";

/**
 * Tracks pointer state in NDC + projects a 3D point along the cursor ray
 * for use as a gravity well. All math is allocation-free after construction.
 */
export class Cursor {
  readonly ndc = new THREE.Vector2(0, 0);
  readonly world = new THREE.Vector3(0, 0, 0);

  private readonly camera: THREE.Camera;
  private readonly tmp = new THREE.Vector3();

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /** Update from raw client (CSS pixel) coordinates. */
  setFromClient(clientX: number, clientY: number, viewportW: number, viewportH: number): void {
    const x = (clientX / viewportW) * 2 - 1;
    const y = -((clientY / viewportH) * 2 - 1);
    this.setNdc(x, y);
  }

  /** Update from already-normalized device coordinates. */
  setNdc(x: number, y: number): void {
    this.ndc.set(x, y);
    this.tmp.set(x, y, 0.5).unproject(this.camera);
    this.tmp.sub(this.camera.position).normalize();
    this.world
      .copy(this.camera.position)
      .add(this.tmp.multiplyScalar(WARP_CONFIG.cursorProjectionDistance));
  }
}
