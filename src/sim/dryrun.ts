// The Dry Run (DESIGN.md §6): the same physics, headless, many times. It is the game's honesty:
// whatever it reports is what the board does, because it runs stepMarble exactly as a live drop.
import type { BoardDef } from '../data/boards';
import { BOARD } from '../data/boards';
import type { MarbleDef } from '../data/marbles';
import { Rng } from './rng';
import { buildWorld } from './physics/world';
import { spawnMarble, stepMarble } from './physics/marble';

export interface DryRunResult {
  column: number;
  n: number;
  /** mean payout per unit staked: the column's expected value */
  mean: number;
  /** the mean's standard error: the honest ± on a Dry Run of n drops */
  se: number;
  /** payout per stake -> drops, ascending by payout */
  histogram: { payout: number; count: number }[];
  /** share of drops landing in each cup */
  cupRates: number[];
  /** drops that jammed (should be none) */
  jams: number;
  /** rail taps over the run (a base board should need none) */
  taps: number;
  /** contacts per board body over the run (the wear heatmap's raw data) */
  contacts: number[];
}

/** The k-th drop of a Dry Run: its release jitter and its stream seed, from the run's seed. */
export function dropDraw(rng: Rng): [u: number, seed: number] {
  return [rng.next(), rng.int(0, 0x7fffffff)];
}

/** Run `n` drops of `marble` above `column` on `board`. Same arguments, same result, always. */
export function dryRun(board: BoardDef, marble: MarbleDef, column: number, n: number, seed: number): DryRunResult {
  const world = buildWorld(board);
  const rng = new Rng(seed);
  const hits = new Array(world.cups.length).fill(0);
  const contacts = new Array(world.bodies.length).fill(0);
  const byPayout = new Map<number, number>();
  const onContact = (b: number) => contacts[b]++;
  let sum = 0, sum2 = 0, jams = 0, taps = 0;
  for (let i = 0; i < n; i++) {
    const [u, s] = dropDraw(rng);
    const m = spawnMarble(world, marble, i, column, u, s, 1);
    while (stepMarble(world, m, onContact) === 'falling');
    taps += m.taps;
    let payout = 0;
    if (m.state === 'landed') {
      hits[m.cup]++;
      payout = Math.round(world.cups[m.cup].mult * m.tags * 100) / 100;
    } else jams++;
    sum += payout;
    sum2 += payout * payout;
    byPayout.set(payout, (byPayout.get(payout) ?? 0) + 1);
  }
  return {
    column,
    n,
    mean: n ? sum / n : 0,
    se: n > 1 ? Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2) / (n - 1)) : 0,
    histogram: [...byPayout].map(([payout, count]) => ({ payout, count })).sort((a, b) => a.payout - b.payout),
    cupRates: hits.map((h) => (n ? h / n : 0)),
    jams,
    taps,
    contacts,
  };
}

/** Every column's Dry Run (300 drops each by default). */
export function dryRunAll(board: BoardDef, marble: MarbleDef, n = 300, seed = 1): DryRunResult[] {
  return Array.from({ length: BOARD.cols }, (_, c) => dryRun(board, marble, c, n, seed));
}
