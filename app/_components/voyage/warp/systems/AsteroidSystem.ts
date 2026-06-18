import * as THREE from "three/webgpu";
import { WARP_CONFIG } from "../config";
import { uniform, symmetric } from "../utils/rand";
import { set3 } from "../utils/vec3";
import { createRimGlowMaterial } from "../materials/createRimGlowMaterial";
import type { ParticleBuffers, ParticleKind } from "../types";

export interface AsteroidSystemOptions {
  rand?: () => number;
}

export class AsteroidSystem {
  readonly primary: THREE.InstancedMesh;
  readonly displaced: THREE.InstancedMesh;
  readonly primaryCount: number;
  readonly displacedCount: number;
  readonly total: number;

  private readonly buffers: ParticleBuffers;
  private readonly dummy = new THREE.Object3D();
  private readonly scene: THREE.Scene;
  private readonly rand: () => number;
  private readonly primaryMat: THREE.MeshStandardNodeMaterial;
  private readonly displacedMat: THREE.MeshStandardNodeMaterial;
  private readonly primaryGeom: THREE.IcosahedronGeometry;
  private readonly displacedGeom: THREE.IcosahedronGeometry;

  constructor(scene: THREE.Scene, opts: AsteroidSystemOptions = {}) {
    this.scene = scene;
    this.rand = opts.rand ?? Math.random;
    this.total = WARP_CONFIG.asteroidCount;
    this.primaryCount = Math.floor(this.total * (1 - WARP_CONFIG.displacedRatio));
    this.displacedCount = this.total - this.primaryCount;

    this.primaryGeom = new THREE.IcosahedronGeometry(1.0, 0);
    this.displacedGeom = new THREE.IcosahedronGeometry(1.0, 1);

    this.primaryMat = createRimGlowMaterial();
    this.displacedMat = createRimGlowMaterial();

    this.primary = new THREE.InstancedMesh(this.primaryGeom, this.primaryMat, this.primaryCount);
    this.displaced = new THREE.InstancedMesh(
      this.displacedGeom,
      this.displacedMat,
      this.displacedCount,
    );
    for (const m of [this.primary, this.displaced]) {
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    scene.add(this.primary);
    scene.add(this.displaced);

    this.buffers = {
      positions: new Float32Array(this.total * 3),
      velocities: new Float32Array(this.total * 3),
      rotations: new Float32Array(this.total * 3),
      rotSpeeds: new Float32Array(this.total * 3),
      scales: new Float32Array(this.total),
      masses: new Float32Array(this.total),
      radii: new Float32Array(this.total),
      velocityScales: new Float32Array(this.total),
    };

    for (let i = 0; i < this.primaryCount; i++) this.seedOne(i, "primary", true);
    for (let i = 0; i < this.displacedCount; i++) {
      this.seedOne(this.primaryCount + i, "displaced", true);
    }
    this.primary.instanceMatrix.needsUpdate = true;
    this.displaced.instanceMatrix.needsUpdate = true;
  }

  private seedOne(globalIndex: number, kind: ParticleKind, isInitial: boolean): void {
    const { positions, velocities, rotations, rotSpeeds, scales, masses, radii, velocityScales } = this.buffers;
    const scaleRange =
      kind === "primary" ? WARP_CONFIG.primaryScale : WARP_CONFIG.displacedScale;

    const x = symmetric(WARP_CONFIG.asteroidSpreadX, this.rand);
    const y = symmetric(WARP_CONFIG.asteroidSpreadY, this.rand);
    const z = isInitial
      ? uniform(WARP_CONFIG.farZ + 20, 20, this.rand)
      : WARP_CONFIG.recycleZ;

    set3(positions, globalIndex * 3, x, y, z);

    set3(velocities, globalIndex * 3,
      positions[globalIndex * 3]     * WARP_CONFIG.asteroidRadialGain,
      positions[globalIndex * 3 + 1] * WARP_CONFIG.asteroidRadialGain,
      uniform(WARP_CONFIG.asteroidVelZ.min, WARP_CONFIG.asteroidVelZ.max, this.rand),
    );

    const rotX = this.rand() * Math.PI;
    const rotY = this.rand() * Math.PI;
    const rotZ = this.rand() * Math.PI;
    set3(rotations, globalIndex * 3, rotX, rotY, rotZ);
    set3(rotSpeeds, globalIndex * 3,
      symmetric(0.025, this.rand),
      symmetric(0.025, this.rand),
      symmetric(0.025, this.rand),
    );
    const scale = uniform(scaleRange.min, scaleRange.max, this.rand);
    scales[globalIndex] = scale;
    // Bounding-sphere radius scales with the visual scale (icosahedron
    // base radius is 1). Mass ~ volume, so scale^3 with a small floor.
    radii[globalIndex] = Math.max(0.25, scale * (kind === "primary" ? 0.7 : 1.0));
    masses[globalIndex] = Math.max(0.2, Math.pow(scale, 3) * 0.6);
    // Per-instance velocity multiplier. Sampled once and held for the
    // lifetime of the asteroid (including through recycles, so the
    // field stays visually consistent on respawn).
    velocityScales[globalIndex] = uniform(
      WARP_CONFIG.asteroidVelocityVariance.min,
      WARP_CONFIG.asteroidVelocityVariance.max,
      this.rand,
    );
    this.writeMatrix(globalIndex);
  }

  private writeMatrix(globalIndex: number): void {
    const { positions, rotations, scales } = this.buffers;
    const kind: ParticleKind = globalIndex < this.primaryCount ? "primary" : "displaced";
    const mesh = kind === "primary" ? this.primary : this.displaced;
    const localIndex = kind === "primary" ? globalIndex : globalIndex - this.primaryCount;

    this.dummy.position.set(
      positions[globalIndex * 3],
      positions[globalIndex * 3 + 1],
      positions[globalIndex * 3 + 2],
    );
    this.dummy.rotation.set(
      rotations[globalIndex * 3],
      rotations[globalIndex * 3 + 1],
      rotations[globalIndex * 3 + 2],
    );
    this.dummy.scale.setScalar(scales[globalIndex]);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(localIndex, this.dummy.matrix);
  }

  /**
   * Resolve elastic collisions between every pair of asteroids using
   * bounding-sphere overlap. With 250 bodies the O(N^2) pass is ~31k
   * pair checks per frame, well within budget for 60 fps.
   *
   * For overlapping pair (a, b):
   *   - normal n  = (b - a) / |b - a|
   *   - relative velocity along n: vRel = (vB - vA) . n
   *   - if vRel >= 0 the bodies are separating; skip.
   *   - impulse j = -(1 + e) * vRel / (1/mA + 1/mB)
   *   - vA -= j * n / mA; vB += j * n / mB
   *   - positional correction: push them apart by half the overlap each
   */
  private resolveCollisions(): void {
    if (!WARP_CONFIG.enableCollisions) return;
    const { positions, velocities, masses, radii } = this.buffers;
    const e = WARP_CONFIG.collisionRestitution;
    const jMax = WARP_CONFIG.maxCollisionImpulse;
    const N = this.total;

    for (let i = 0; i < N; i++) {
      const ia = i * 3;
      const ax = positions[ia], ay = positions[ia + 1], az = positions[ia + 2];
      const ra = radii[i];
      const ma = masses[i];
      const invMa = 1 / ma;

      for (let k = i + 1; k < N; k++) {
        const ib = k * 3;
        const dx = positions[ib]     - ax;
        const dy = positions[ib + 1] - ay;
        const dz = positions[ib + 2] - az;
        const distSq = dx * dx + dy * dy + dz * dz;
        const rSum = ra + radii[k];
        if (distSq >= rSum * rSum) continue;

        const dist = Math.sqrt(distSq) || 1e-6;
        const nx = dx / dist, ny = dy / dist, nz = dz / dist;
        const overlap = rSum - dist;

        // Positional correction: push apart proportional to inverse mass.
        const mb = masses[k];
        const invMb = 1 / mb;
        const totalInv = invMa + invMb;
        const corrA = overlap * (invMa / totalInv);
        const corrB = overlap * (invMb / totalInv);
        positions[ia]     -= nx * corrA;
        positions[ia + 1] -= ny * corrA;
        positions[ia + 2] -= nz * corrA;
        positions[ib]     += nx * corrB;
        positions[ib + 1] += ny * corrB;
        positions[ib + 2] += nz * corrB;

        // Velocity exchange only if approaching.
        const rvx = velocities[ib]     - velocities[ia];
        const rvy = velocities[ib + 1] - velocities[ia + 1];
        const rvz = velocities[ib + 2] - velocities[ia + 2];
        const vRel = rvx * nx + rvy * ny + rvz * nz;
        if (vRel >= 0) continue;

        let j = -(1 + e) * vRel / totalInv;
        if (j > jMax) j = jMax;
        // Exchange momentum along the normal.
        velocities[ia]     -= j * nx * invMa;
        velocities[ia + 1] -= j * ny * invMa;
        velocities[ia + 2] -= j * nz * invMa;
        velocities[ib]     += j * nx * invMb;
        velocities[ib + 1] += j * ny * invMb;
        velocities[ib + 2] += j * nz * invMb;

        // A tiny rotational kick makes the impact visually alive.
        const kick = 0.5;
        this.buffers.rotSpeeds[ia]     += (this.rand() - 0.5) * kick;
        this.buffers.rotSpeeds[ia + 1] += (this.rand() - 0.5) * kick;
        this.buffers.rotSpeeds[ia + 2] += (this.rand() - 0.5) * kick;
        this.buffers.rotSpeeds[ib]     += (this.rand() - 0.5) * kick;
        this.buffers.rotSpeeds[ib + 1] += (this.rand() - 0.5) * kick;
        this.buffers.rotSpeeds[ib + 2] += (this.rand() - 0.5) * kick;
      }
    }
  }

  update(delta: number, speed: number, _cursorWorld: THREE.Vector3 | null, _cursorGravity: number): void {
    const dt = delta;
    const { positions, velocities, rotations, rotSpeeds, velocityScales } = this.buffers;

    for (let i = 0; i < this.total; i++) {
      const base = i * 3;
      // Per-instance velocity multiplier. This is what makes the field
      // feel like a stream instead of a treadmill — some asteroids
      // sprint past the camera, others drift. The multiplier is held
      // through recycles, so the visual signature of each body is
      // stable across the field.
      const vScale = velocityScales[i];

      positions[base]     += velocities[base]     * dt * vScale;
      positions[base + 1] += velocities[base + 1] * dt * vScale;
      positions[base + 2] += velocities[base + 2] * dt * speed * vScale;

      if (
        positions[base + 2] > WARP_CONFIG.killZ ||
        positions[base + 2] < WARP_CONFIG.farZ ||
        Math.abs(positions[base]) > WARP_CONFIG.outOfBoundsX
      ) {
        this.seedOne(i, i < this.primaryCount ? "primary" : "displaced", false);
        continue;
      }

      rotations[base]     += rotSpeeds[base]     * dt;
      rotations[base + 1] += rotSpeeds[base + 1] * dt;
      rotations[base + 2] += rotSpeeds[base + 2] * dt;
    }

    // Resolve asteroid-asteroid elastic collisions once per frame.
    this.resolveCollisions();

    for (let i = 0; i < this.total; i++) this.writeMatrix(i);

    this.primary.instanceMatrix.needsUpdate = true;
    this.displaced.instanceMatrix.needsUpdate = true;
  }

  /**
   * Click-to-shoot: blast the picked asteroid outward with high linear
   * velocity. The collision pass on subsequent frames will transfer some
   * of that momentum to whatever it hits, producing visible chain
   * reactions.
   */
  blast(kind: ParticleKind, instanceId: number, hitWorld: THREE.Vector3, cameraPos: THREE.Vector3): void {
    const { velocities, rotSpeeds } = this.buffers;
    const globalIndex = kind === "primary" ? instanceId : this.primaryCount + instanceId;
    const base = globalIndex * 3;

    const dx = hitWorld.x - cameraPos.x;
    const dy = hitWorld.y - cameraPos.y;
    const dz = hitWorld.z - cameraPos.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const power = WARP_CONFIG.blastSpeed;
    const scatter = WARP_CONFIG.blastScatter;
    set3(velocities, base,
      (dx / len) * power + (this.rand() - 0.5) * scatter,
      (dy / len) * power + (this.rand() - 0.5) * scatter,
      (dz / len) * power + (this.rand() - 0.5) * (scatter * 0.5),
    );
    rotSpeeds[base]     *= WARP_CONFIG.blastRotMul;
    rotSpeeds[base + 1] *= WARP_CONFIG.blastRotMul;
    rotSpeeds[base + 2] *= WARP_CONFIG.blastRotMul;
  }

  /** Advance material time uniforms. TSL materials don't need per-frame
   *  uTime updates for the rim emissive, but this is here for future
   *  shader-driven effects. */
  tickTime(_time: number): void {
    // No-op for the current TSL MeshStandardNodeMaterial; the rim uses
    // cameraPosition and normalWorld which are updated per frame.
  }

  dispose(): void {
    this.scene.remove(this.primary);
    this.scene.remove(this.displaced);
    this.primaryGeom.dispose();
    this.displacedGeom.dispose();
    this.primaryMat.dispose();
    this.displacedMat.dispose();
  }
}
