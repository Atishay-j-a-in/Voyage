import * as THREE from "three";
import { WARP_CONFIG } from "../config";

export interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createSceneAndCamera(): SceneBundle {
  const scene = new THREE.Scene();

  // Ambient fill so faceted geometry reads on its dark side.
  const ambient = new THREE.AmbientLight(
    WARP_CONFIG.lighting.ambient.color,
    WARP_CONFIG.lighting.ambient.intensity,
  );
  scene.add(ambient);

  // Neutral white directional light grazes the asteroids from the upper-right,
  // adding specular highlights on top of the rim emissive. The neon-cyan accent
  // is reserved for copy / nav / CTAs; asteroids now read as silver rocks.
  const dir = new THREE.DirectionalLight(
    WARP_CONFIG.lighting.directional.color,
    WARP_CONFIG.lighting.directional.intensity,
  );
  dir.position.set(...WARP_CONFIG.lighting.directional.position);
  scene.add(dir);

  const camera = new THREE.PerspectiveCamera(
    WARP_CONFIG.camera.fov,
    typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 1,
    WARP_CONFIG.camera.near,
    WARP_CONFIG.camera.far,
  );
  camera.position.set(0, 0, WARP_CONFIG.camera.z);
  camera.lookAt(0, 0, 0);
  return { scene, camera };
}
