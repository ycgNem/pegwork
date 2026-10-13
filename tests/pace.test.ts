// Pace tests: the lessons DESIGN.md §8 says the numbers must teach. Milestone 0 has the ones the
// physics alone decides: §8.1 (the base board loses money, everywhere, on purpose) and §8.6
// (determinism, in tests/determinism.test.ts and tests/dryrun.test.ts). §8.2–§8.5 and §8.7 need
// the duel and arrive with Milestone 1.
import { describe, expect, it } from 'vitest';
import { BASE_BOARD } from '../src/data/boards';
import { MARBLES } from '../src/data/marbles';
import { dryRunAll } from '../src/sim/dryrun';

/**
 * §8.1 is measured at 3,000 drops a column: at the Dry Run's 300 a column's EV carries about ±0.06
 * of noise and the noisiest of 20 columns sits about ±0.12 off its true value, wider than the band
 * itself (DECISIONS.md #12). The player's Dry Run still runs 300 and shows the ±.
 */
const DROPS = 3000;

describe('pace: §8.1 base board EV', () => {
  const runs = dryRunAll(BASE_BOARD, MARBLES.steel, DROPS, 1);
  const evs = runs.map((r) => r.mean);

  it('every column is in 0.70–0.95 and the best column in 0.85–0.95', () => {
    for (const [c, ev] of evs.entries()) {
      expect(ev, `column ${c + 1}`).toBeGreaterThanOrEqual(0.7);
      expect(ev, `column ${c + 1}`).toBeLessThanOrEqual(0.95);
    }
    const best = Math.max(...evs);
    expect(best).toBeGreaterThanOrEqual(0.85);
    expect(best).toBeLessThanOrEqual(0.95);
  });

  it('no column needs a rail tap or jams: the field has no pocket a marble can rest in', () => {
    expect(runs.reduce((n, r) => n + r.taps, 0)).toBe(0);
    expect(runs.reduce((n, r) => n + r.jams, 0)).toBe(0);
  });
});
