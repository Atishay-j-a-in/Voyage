import * as THREE from "three";
import { WARP_CONFIG } from "../config";

/**
 * Camera parallax rig (reference Voyage behavior).
 *
 * On every frame, lerp camera.position.{x,y} toward
 *   { pointer.x * parallaxTargetMul, pointer.y * parallaxTargetMul }
 *
 * At rest (no pointer movement), the camera slowly drifts back to (0, 0, z).
 * This is a 2D parallax, not just X.
 */
export class CameraRig {
  private readonly camera: THREE.PerspectiveCamera;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(pointerNdc: { x: number; y: number }): void {
    const targetX = pointerNdc.x * WARP_CONFIG.camera.parallaxTargetMul;
    const targetY = pointerNdc.y * WARP_CONFIG.camera.parallaxTargetMul;
    const k = WARP_CONFIG.camera.parallaxLerp;
    this.camera.position.x += (targetX - this.camera.position.x) * k;
    this.camera.position.y += (targetY - this.camera.position.y) * k;
    this.camera.lookAt(0, 0, 0);
  }
}
