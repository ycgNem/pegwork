// One gambler, one full session (ROADMAP M0 exit): walk in, choose a table, walk to its seat on the
// flow field, bet every round from the paytable, get up, walk out; the cage pays every win.
import { describe, expect, it } from 'vitest';
import { TIME } from '../src/data/time';
import { Game } from '../src/sim/Game';
import { blockedGrid, tileOf } from '../src/sim/floor';
import type { GameEvent } from '../src/sim/events';

function session(seed: number) {
  const g = new Game({ seed, noArrivals: true });
  g.command({ t: 'spawn', type: 'tourist' });
  const events: GameEvent[] = [];
  const blocked = blockedGrid(g.s);
  let walkedThroughWall = false;
  for (let t = 0; t < 4 * TIME.ticksPerHour; t++) {
    g.tick();
    events.push(...g.drain());
    const a = g.s.agents[0];
    if (a && blocked[tileOf(a.y) * g.s.floor.w + tileOf(a.x)]) walkedThroughWall = true;
    if (a?.phase === 'gone') break;
  }
  return { g, a: g.s.agents[0], events, walkedThroughWall };
}

describe('one gambler, one session', () => {
  for (const seed of [1, 2, 3, 4, 5])
    it(`seed ${seed}: arrives, sits, plays, leaves; the cage moves by exactly their loss`, () => {
      const { g, a, events, walkedThroughWall } = session(seed);
      const kinds = events.map((e) => e.t);
      expect(kinds[0]).toBe('arrived');
      expect(kinds).toContain('seated');
      expect(kinds.filter((k) => k === 'round').length).toBeGreaterThan(5);
      expect(kinds).toContain('left');
      expect(a.phase).toBe('gone');
      expect(walkedThroughWall).toBe(false);
      expect(g.s.cage - 200000).toBe(a.start - a.bankroll);
      const left = events.find((e) => e.t === 'left') as Extract<GameEvent, { t: 'left' }>;
      expect(left.net).toBe(a.bankroll - a.start);
    });

  it('a gambler who cannot afford the minimum never sits', () => {
    const g = new Game({ seed: 9, noArrivals: true });
    g.command({ t: 'setLimits', table: 0, min: 2500, max: 12500 });
    g.command({ t: 'setLimits', table: 1, min: 2500, max: 12500 });
    g.command({ t: 'closeTable', table: 0 });
    g.command({ t: 'spawn', type: 'tourist' });
    g.tick();
    const a = g.s.agents[0];
    a.bankroll = a.start = 2000;
    for (let t = 0; t < 20 * TIME.ticksPerMinute; t++) g.tick();
    expect(g.s.tables.every((t) => t.rounds === 0)).toBe(true);
    expect(['leave', 'gone']).toContain(g.s.agents[0].phase);
  });

  it('a win bigger than the cage busts the house', () => {
    const g = new Game({ seed: 3, noArrivals: true, cage: 1000 });
    g.command({ t: 'spawn', type: 'highRoller' });
    const events: GameEvent[] = [];
    for (let t = 0; t < 4 * TIME.ticksPerHour && !g.s.busted; t++) {
      g.tick();
      events.push(...g.drain());
    }
    expect(g.s.busted).toBe(true);
    const bust = events.find((e) => e.t === 'bust') as Extract<GameEvent, { t: 'bust' }>;
    expect(bust.owed).toBeGreaterThan(bust.cage);
  });
});
