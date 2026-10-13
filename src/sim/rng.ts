// The sim's seeded randomness. `Rng` is the engine's mulberry32; `streamNext` is the same
// generator as a pure step on a bare number, so a marble can carry its own stream as plain state
// (hashed and replayed with everything else).
export { Rng, hashStr } from '../engine/rng';

/** Advance a mulberry32 state. Returns [value in [0, 1), next state]. */
export function streamNext(state: number): [number, number] {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}
