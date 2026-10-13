// Determinism (DESIGN.md §8.6): a recorded drop replayed from its command log is bit-identical.
import { describe, expect, it } from 'vitest';
import { Game } from '../src/sim/Game';
import { SYSTEMS } from '../src/sim/Game';

function record(seed: number) {
  const g = new Game({ seed });
  const hashes: number[] = [];
  // three marbles a round for five rounds, columns from a fixed script, stakes changing between
  const script = [3, 9, 15, 0, 19, 10, 11, 4, 7, 12, 1, 18, 9, 9, 9];
  for (let t = 0; t < 1500; t++) {
    if (t % 90 === 0 && script.length) {
      g.command({ t: 'setStake', cents: 200 + (t % 7) * 300 });
      for (let k = 0; k < 3 && script.length; k++) g.command({ t: 'drop', column: script.shift()! });
    }
    g.tick();
    hashes.push(g.hash());
  }
  return { g, hashes };
}

describe('determinism', () => {
  it('runs the systems in the order CLAUDE.md fixes', () => {
    expect(SYSTEMS.map(([n]) => n)).toEqual(['duel', 'commands', 'physics', 'payouts', 'wear', 'bankroll', 'rival', 'skills', 'stats']);
  });

  it('the same seed and commands give the same state hash every tick', () => {
    const a = record(77), b = record(77);
    expect(a.hashes).toEqual(b.hashes);
    expect(a.g.s.stats.landed).toBe(15);
  });

  it('a recorded duel replayed from its command log is bit-identical', () => {
    const { g, hashes } = record(2026);
    const r = Game.replay({ seed: 2026 }, g.s.log, g.s.tick);
    expect(r.hash()).toBe(hashes[hashes.length - 1]);
    expect(r.s.bankroll).toBe(g.s.bankroll);
    expect(r.s.stats).toEqual(g.s.stats);
  });

  it('a different seed plays differently', () => {
    expect(record(1).hashes.at(-1)).not.toBe(record(2).hashes.at(-1));
  });

  it('stakes leave at the drop and payouts arrive at the landing', () => {
    const { g } = record(5);
    expect(g.s.bankroll).toBe(20000 - g.s.stats.staked + g.s.stats.paid);
  });
});
