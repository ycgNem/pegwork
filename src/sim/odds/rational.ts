// Exact fractions on BigInt, for the odds calculator (DESIGN.md §2): an edge is a ratio of whole
// numbers, so it is computed exactly and only turned into a float for display.

export interface Rat { n: bigint; d: bigint }

function gcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function rat(n: bigint | number, d: bigint | number = 1n): Rat {
  let N = BigInt(n), D = BigInt(d);
  if (D === 0n) throw new Error('zero denominator');
  if (D < 0n) [N, D] = [-N, -D];
  const g = gcd(N, D) || 1n;
  return { n: N / g, d: D / g };
}

export const add = (a: Rat, b: Rat) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rat, b: Rat) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rat, b: Rat) => rat(a.n * b.n, a.d * b.d);
export const eq = (a: Rat, b: Rat) => a.n === b.n && a.d === b.d;
export const toNum = (a: Rat) => Number(a.n) / Number(a.d);
export const str = (a: Rat) => `${a.n}/${a.d}`;

/** n choose k, exactly */
export function choose(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  let r = 1n;
  for (let i = 0; i < k; i++) r = (r * BigInt(n - i)) / BigInt(i + 1);
  return r;
}
