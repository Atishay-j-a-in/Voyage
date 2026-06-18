import * as THREE from "three/webgpu";
import { WARP_CONFIG } from "../config";
import { createWebGPURenderer, hasWebGPU } from "../scene/createRenderer";
import { createSceneAndCamera } from "../scene/createScene";
import { AsteroidSystem } from "../systems/AsteroidSystem";
import { Cursor } from "../input/Cursor";
import { AsteroidRaycaster } from "../input/Raycaster";
import { CameraRig } from "./CameraRig";
import {
  computeSpeed,
  MODE_TARGET_SCALE,
  PORTAL_RAMP_SECONDS,
  type SimMode,
} from "./VelocityProfile";
import type { SimOptions, RaycastHit } from "../types";

export class WebGPUUnsupportedError extends Error {
  constructor() {
    super("WebGPU is not available in this browser.");
    this.name = "WebGPUUnsupportedError";
  }
}

export async function createSim(
  canvas: HTMLCanvasElement,
  isMounted: () => boolean,
  opts: SimOptions = {},
): Promise<Sim | null> {
  if (!(await hasWebGPU())) throw new WebGPUUnsupportedError();
  const sim = new Sim(canvas, opts);
  try {
    await sim.init();
  } catch (e) {
    sim.dispose();
    throw e;
  }
  if (!isMounted()) {
    sim.dispose();
    return null;
  }
  return sim;
}

export class Sim {
  private readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGPURenderer | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly asteroids: AsteroidSystem;
  private readonly cursor: Cursor;
  private readonly raycaster: AsteroidRaycaster;
  private readonly rig: CameraRig;
  private readonly clock: THREE.Clock;
  private readonly opts: Required<SimOptions>;

  private rafId = 0;
  private running = false;
  private initialized = false;
  private disposed = false;
  private lastClickAt: number | null = null;
  private lastFrame = 0;

  /** Target mode (drives target speed scale). */
  private mode: SimMode = "normal";
  /** Current speed scale, smoothly lerped toward the target. */
  private modeScale = 1.0;

  constructor(canvas: HTMLCanvasElement, opts: SimOptions = {}) {
    this.canvas = canvas;
    this.opts = { maxPixelRatio: 2, alwaysRun: false, ...opts };
    const { scene, camera } = createSceneAndCamera();
    this.scene = scene;
    this.camera = camera;
    this.asteroids = new AsteroidSystem(scene);
    this.cursor = new Cursor(camera);
    this.raycaster = new AsteroidRaycaster(camera, this.asteroids);
    this.rig = new CameraRig(camera);
    this.clock = new THREE.Clock();
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    const { renderer, initPromise } = createWebGPURenderer(this.canvas, {
      maxPixelRatio: this.opts.maxPixelRatio,
    });
    this.renderer = renderer;
    this.initPromise = initPromise.then(() => {
      this.initialized = true;
      this.resize();
    });
    return this.initPromise;
  }

  start(): void {
    if (this.running || this.disposed || !this.initialized) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.clock.start();
    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  setCursorFromClient(clientX: number, clientY: number): void {
    this.cursor.setFromClient(clientX, clientY, window.innerWidth, window.innerHeight);
  }

  pickAsteroid(): RaycastHit | null {
    return this.raycaster.cast(this.cursor.ndc);
  }

  /**
   * Click-to-shoot. If a raycast hits an asteroid, blast it outward
   * (toward the camera) so the collision pass propagates the impulse
   * to any nearby bodies.
   */
  triggerBlast(hit: RaycastHit): void {
    const point = new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z);
    this.asteroids.blast(hit.which, hit.instanceId, point, this.camera.position);
    this.lastClickAt = this.clock.getElapsedTime();
  }

  /**
   * Set the runtime mode. The current speed scale is lerped toward the
   * target so transitions are smooth. Portal ramps over PORTAL_RAMP_SECONDS;
   * slow ramps in ~0.6s; normal snaps to 1.0.
   */
  setMode(mode: SimMode): void {
    this.mode = mode;
  }

  resize(): void {
    if (!this.renderer || !this.initialized) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.asteroids.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  private tick(nowMs: number): void {
    if (!this.running || this.disposed || !this.renderer || !this.initialized) return;
    if (!this.opts.alwaysRun && typeof document !== "undefined" && document.visibilityState === "hidden") {
      this.lastFrame = nowMs;
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const delta = Math.min((nowMs - this.lastFrame) / 1000, 0.05);
    this.lastFrame = nowMs;
    const t = this.clock.getElapsedTime();

    // Lerp modeScale toward the target. The ramp rate is derived from
    // the size of the jump so portal can climb to 100x without
    // overshooting, but a mode change from 1.0 -> 0.25 still feels snappy.
    const target = MODE_TARGET_SCALE[this.mode];
    const rampSeconds =
      this.mode === "portal" ? PORTAL_RAMP_SECONDS : 0.6;
    const lerpFactor = 1 - Math.exp(-delta / Math.max(0.05, rampSeconds * 0.35));
    this.modeScale += (target - this.modeScale) * lerpFactor;

    const speed = computeSpeed({
      now: t,
      mountedAt: 0,
      lastClickAt: this.lastClickAt,
      modeScale: this.modeScale,
    });

    this.rig.update(this.cursor.ndc);
    this.asteroids.update(delta, speed, this.cursor.world, WARP_CONFIG.cursorGravity);
    this.asteroids.tickTime(t);

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  }
}
