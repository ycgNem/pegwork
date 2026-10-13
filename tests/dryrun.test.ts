// The Dry Run (DESIGN.md §6, §8.6): fast, repeatable, and the same physics as a live drop.
import { describe, expect, it } from 'vitest';
import { BASE_BOARD } from '../src/data/boards';
import { MARBLES } from '../src/data/marbles';
import { dryRun } from '../src/sim/dryrun';
import { Game } from '../src/sim/Game';

describe('dry run', () => {
  it('300 drops finish in under 50 ms', () => {
    dryRun(BASE_BOARD, MARBLES.steel, 9, 300, 1); // warm the JIT and the world cache
    let best = Infinity;
    for (let k = 0; k < 5; k++) {
      const t0 = performance.now();
      dryRun(BASE_BOARD, MARBLES.steel, k * 4, 300, 100 + k);
      best = Math.min(best, performance.now() - t0);
    }
    expect(best).toBeLessThan(50);
  });

  it('two Dry Runs with the same seed are identical', () => {
    const a = dryRun(BASE_BOARD, MARBLES.steel, 6, 300, 31);
    const b = dryRun(BASE_BOARD, MARBLES.steel, 6, 300, 31);
    expect(a).toEqual(b);
    expect(a.jams).toBe(0);
    expect(a.histogram.reduce((s, h) => s + h.count, 0)).toBe(300);
    expect(a.cupRates.reduce((s, r) => s + r, 0)).toBeCloseTo(1, 9);
  });

  it('reports exactly what live drops do with the same draws', () => {
    // a game seeded like the Dry Run draws the same jitter for its drops, so they land the same
    const seed = 4040, n = 40, col = 12;
    const d = dryRun(BASE_BOARD, MARBLES.steel, col, n, seed);
    const g = new Game({ seed, bankroll: 1e9 });
    g.command({ t: 'setStake', cents: 200 });
    const cups = new Array(BASE_BOARD.cups.length).fill(0);
    for (let i = 0; i < n; i++) {
      g.command({ t: 'drop', column: col });
      do g.tick(); while (g.s.marbles.length);
      for (const e of g.drain()) if (e.t === 'landed') cups[e.cup]++;
    }
    expect(cups.map((c) => c / n)).toEqual(d.cupRates);
  });
});
