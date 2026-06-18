/**
 * Mulberry32: a small, fast, seedable PRNG.
 * Use this anywhere we need determinism (replay, tests, layout seeding).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive-exclusive uniform random in [min, max). */
export function uniform(min: number, max: number, rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

/** Symmetric uniform in [-amp, +amp). */
export function symmetric(amp: number, rand: () => number = Math.random): number {
  return (rand() * 2 - 1) * amp;
}
