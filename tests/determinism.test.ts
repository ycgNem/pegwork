// Determinism (CLAUDE.md): a recorded night replayed from its command log is bit-identical.
import { describe, expect, it } from 'vitest';
import { NIGHT_TICKS, TIME } from '../src/data/time';
import { Game, SYSTEMS } from '../src/sim/Game';

/** A whole night with the owner fiddling: paytable edits, limits, a closed table, a whale, a car. */
function record(seed: number) {
  const g = new Game({ open: true, seed });
  const hashes: number[] = [];
  const script: Record<number, () => void> = {
    [TIME.ticksPerHour]: () => g.command({ t: 'setPays', table: 0, bet: 0, pays10: 12 }),
    [2 * TIME.ticksPerHour]: () => g.command({ t: 'setLimits', table: 1, min: 500, max: 10000 }),
    [3 * TIME.ticksPerHour]: () => g.command({ t: 'spawn', type: 'highRoller' }),
    [4 * TIME.ticksPerHour]: () => g.command({ t: 'callArmoredCar', cents: 100000 }),
    [5 * TIME.ticksPerHour]: () => g.command({ t: 'closeTable', table: 1 }),
    [6 * TIME.ticksPerHour]: () => g.command({ t: 'openTable', table: 1 }),
  };
  for (let t = 0; t < NIGHT_TICKS + 600; t++) {
    script[t]?.();
    g.tick();
    if (t % 10 === 0) hashes.push(g.hash());
  }
  return { g, hashes };
}

describe('determinism', () => {
  it('runs the systems in the order CLAUDE.md fixes', () => {
    expect(SYSTEMS.map(([n]) => n)).toEqual([
      'clock', 'commands', 'arrivals', 'agents', 'tables', 'cheats', 'cage', 'staff', 'heat', 'rivals', 'events', 'reputation', 'progression', 'stats',
    ]);
  });

  const a = record(77);

  it('the same seed and commands give the same state hash all night', () => {
    const b = record(77);
    expect(b.hashes).toEqual(a.hashes);
    expect(a.g.s.stats.arrived).toBeGreaterThan(40);
    expect(a.g.s.stats.rounds).toBeGreaterThan(300);
  });

  it('a recorded night replayed from its command log is bit-identical', () => {
    const r = Game.replay({ open: true, seed: 77 }, a.g.s.log, a.g.s.tick);
    expect(r.hash()).toBe(a.g.hash());
    expect(r.s.cage).toBe(a.g.s.cage);
    expect(r.s.stats).toEqual(a.g.s.stats);
  });

  it('a different seed plays differently', () => {
    expect(record(78).hashes.at(-1)).not.toBe(a.hashes.at(-1));
  });

  it('money is conserved: the cage and bank move exactly by the house net, the car and its fee', () => {
    const s = a.g.s;
    const lost = s.agents.reduce((n, x) => n + (x.start - x.bankroll), 0);
    const wages = s.history.reduce((n, h) => n + h.wages, 0);
    if (!s.busted) expect(s.cage + s.bank).toBe(200000 + 400000 + lost - 5000 - wages);
    expect(s.stats.net).toBe(lost);
  });

  it('by 6am the night is over and everyone has gone', () => {
    expect(a.g.s.nightOver).toBe(true);
    expect(a.g.s.agents.every((x) => x.phase === 'gone')).toBe(true);
  });
});
