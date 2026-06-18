/**
 * Typed-array vec3 helpers. All write in-place; return the same array
 * for chaining. The intent is to keep the per-frame inner loop allocation-free.
 */
export function set3(arr: Float32Array, i: number, x: number, y: number, z: number): void {
  arr[i] = x;
  arr[i + 1] = y;
  arr[i + 2] = z;
}

export function copy3(src: Float32Array, srcI: number, dst: Float32Array, dstI: number): void {
  dst[dstI] = src[srcI];
  dst[dstI + 1] = src[srcI + 1];
  dst[dstI + 2] = src[srcI + 2];
}

export function add3(arr: Float32Array, i: number, dx: number, dy: number, dz: number): void {
  arr[i] += dx;
  arr[i + 1] += dy;
  arr[i + 2] += dz;
}

export function scale3(arr: Float32Array, i: number, s: number): void {
  arr[i] *= s;
  arr[i + 1] *= s;
  arr[i + 2] *= s;
}

export function mul3(arr: Float32Array, i: number, sx: number, sy: number, sz: number): void {
  arr[i] *= sx;
  arr[i + 1] *= sy;
  arr[i + 2] *= sz;
}

export function length3(arr: Float32Array, i: number): number {
  const x = arr[i];
  const y = arr[i + 1];
  const z = arr[i + 2];
  return Math.sqrt(x * x + y * y + z * z);
}
