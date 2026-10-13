// The Sweat (DESIGN.md §6, §11.7): fast, deterministic, honest about its own noise, and in line with
// the closed form for small even bets.
import { describe, expect, it } from 'vitest';
import { TIME, NIGHT_TICKS } from '../src/data/time';
import { Game } from '../src/sim/Game';
import { betOdds } from '../src/sim/odds/odds';
import { ruinClosedForm, sweat } from '../src/sim/sweat';

/** A floor with gamblers seated at both tables; the first one's bet and bankroll pinned. */
function seated(seed: number, n: number) {
  const g = new Game({ open: true, seed, noArrivals: true });
  for (let i = 0; i < n; i++) g.command({ t: 'spawn', type: i % 3 ? 'tourist' : 'conventioneer' });
  for (let t = 0; t < 20 * TIME.ticksPerMinute; t++) g.tick();
  return g;
}

describe('the Sweat', () => {
  it('500 nights run in under 50 ms (CLAUDE.md perf budget)', () => {
    const g = seated(1, 10);
    sweat(g.s, 500, 1);
    const t0 = performance.now();
    sweat(g.s, 500, 2);
    expect(performance.now() - t0).toBeLessThan(50);
  });

  it('the same state and seed give the same answer', () => {
    const g = seated(2, 8);
    g.s.cage = 3000;
    expect(sweat(g.s, 500, 9)).toEqual(sweat(g.s, 500, 9));
  });

  it('a whale at the one-pocket bet makes the cage sweat; a thick cage does not', () => {
    const g = seated(3, 0);
    g.command({ t: 'spawn', type: 'highRoller' });
    for (let t = 0; t < 20 * TIME.ticksPerMinute; t++) g.tick();
    const whale = g.s.agents.find((a) => a.type === 'highRoller')!;
    expect(whale.phase).toBe('seated');
    const wheel = g.s.tables[1];
    // put the whale at the wheel's one-pocket bet with a $500 stake
    if (whale.table !== 1) {
      g.s.tables[whale.table].seats[whale.seat] = -1;
      whale.table = 1;
      whale.seat = wheel.seats.indexOf(-1);
      wheel.seats[whale.seat] = whale.id;
    }
    whale.bet = 2;
    whale.baseBet = 50000;
    g.s.tables[1].max = 50000;
    g.s.cage = 200000;
    const thin = sweat(g.s, 500, 4);
    g.s.cage = 5_000_000;
    const thick = sweat(g.s, 500, 4);
    expect(thin.topWin).toBe(1_000_000);
    expect(thin.p).toBeGreaterThan(0.2);
    expect(thick.p).toBeLessThan(thin.p);
  });

  it('the tabulated rounds give exactly what settling every bet one by one gives', () => {
    for (const seed of [1, 2, 3, 4]) {
      const g = seated(seed, 9);
      for (const cage of [300, 1500, 6000]) {
        g.s.cage = cage;
        expect(sweat(g.s, 300, seed)).toEqual(sweat(g.s, 300, seed, true));
      }
    }
  });

  it('500 nights land within 3 points of 5,000 (§11.7)', () => {
    const g = seated(5, 12);
    g.s.cage = 1500;
    const a = sweat(g.s, 500, 11), b = sweat(g.s, 5000, 12);
    expect(b.p).toBeGreaterThan(0.02);
    expect(Math.abs(a.p - b.p)).toBeLessThan(0.03 + 2 * a.se);
  });

  it('with one small even bet it matches the drifted-walk closed form within 2 points (§11.7)', () => {
    const g = new Game({ open: true, seed: 6, noArrivals: true });
    g.command({ t: 'closeTable', table: 0 });
    g.command({ t: 'spawn', type: 'local' });
    for (let t = 0; t < 20 * TIME.ticksPerMinute; t++) g.tick();
    const a = g.s.agents[0];
    expect(a.table).toBe(1);
    a.bet = 0; // Red, 1:1
    a.baseBet = 400;
    a.bankroll = 1e9;
    g.s.cage = 4000;
    const red = betOdds(g.s.tables[1].game, 0);
    const hours = (NIGHT_TICKS - g.s.tick) / TIME.ticksPerHour;
    const mu = 45 * 400 * red.edge, sigma2 = 45 * (400 * red.sigma) ** 2;
    // a walk of $4 steps overshoots zero by about 0.58 of a step's SD (Siegmund's correction)
    const cf = ruinClosedForm(4000 + 0.5826 * 400 * red.sigma, mu, sigma2, hours);
    const mc = sweat(g.s, 5000, 13);
    expect(Math.abs(mc.p - cf)).toBeLessThan(0.02);
  });
});
