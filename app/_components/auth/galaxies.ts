/**
 * Cool galaxy / deep-space destination names shown during the
 * post-auth approach overlay. Picked at random per transition so
 * the user gets a different "destination" each time they sign in.
 */
export const APPROACH_GALAXIES: string[] = [
  "Andromeda Drift",
  "Cygnus Corridor",
  "Sagittarius Arm",
  "Triangulum Veil",
  "Perseus Reach",
  "Carina Sector",
  "Centaurus Hollow",
  "Orion Spur",
  "Phoenix Filament",
  "Draco Stream",
];

/** Pick a random galaxy name. Deterministic when given a `rand`. */
export function pickGalaxy(rand: () => number = Math.random): string {
  const i = Math.floor(rand() * APPROACH_GALAXIES.length);
  return APPROACH_GALAXIES[i] ?? APPROACH_GALAXIES[0];
}
