// Gaffs and Heat (DESIGN.md §8): the shaved dice move the true odds and not the posted ones; a
// sharp gambler or the inspector reads them; Heat brings the raid and the end of the license.
import { describe, expect, it } from 'vitest';
import { HEAT } from '../src/data/heat';
import { TIME } from '../src/data/time';
import { GAFFER, runSeason, TUNER } from '../src/sim/bots';
import { Game } from '../src/sim/Game';
import type { GameEvent } from '../src/sim/events';
import { addHeat } from '../src/sim/heat';
import { betOdds } from '../src/sim/odds/odds';
import { postedEdge } from '../src/sim/season';
import { makeStaff } from '../src/sim/staff';

function run(g: Game, ticks: number, until?: () => boolean): GameEvent[] {
  const ev: GameEvent[] = [];
  for (let t = 0; t < ticks && !(until && until()); t++) {
    g.tick();
    ev.push(...g.drain());
  }
  return ev;
}

/** A full Hi-Lo table of locals (sharpness 0.6) who never leave on their own. */
function fullTable(g: Game) {
  for (let i = 0; i < 6; i++) g.applyNow({ t: 'spawn', type: 'local' });
  for (const a of g.s.agents) {
    a.bankroll = a.start = 10_000_000;
    a.patience = 1e9;
    a.winGoal = 1e12;
    a.stopLoss = 1000;
  }
  g.applyNow({ t: 'closeTable', table: 1 });
  run(g, 3000, () => g.s.agents.every((a) => a.phase === 'seated'));
}

describe('shaved dice', () => {
  it('move the true odds, not the paytable the strip hears', () => {
    const g = new Game({ seed: 1, open: true });
    const posted = postedEdge(g.s);
    g.applyNow({ t: 'gaff', table: 0, gaff: { side: 'low', strength: 3 } });
    const game = g.s.tables[0].game;
    expect(postedEdge(g.s)).toBeCloseTo(posted, 12);
    expect(betOdds(game, 0, true).edge).toBeCloseTo(1 / 6, 12);
    // High 8-12 against dice that favor 1-3 at 9:6
    expect(betOdds(game, 0).edge).toBeCloseTo(0.36, 2);
    expect(betOdds(game, 1).edge).toBeCloseTo(-0.04, 2);
    g.applyNow({ t: 'gaff', table: 0, gaff: null });
    expect(betOdds(g.s.tables[0].game, 0).edge).toBeCloseTo(1 / 6, 12);
  });

  it('only dice can be shaved, and the editor can\'t rig a game behind the gaff', () => {
    const g = new Game({ seed: 2 });
    g.applyNow({ t: 'gaff', table: 1, gaff: { side: 'low', strength: 1 } });
    expect(g.drain().some((e) => e.t === 'rejected')).toBe(true);
    const t = g.s.tables[0];
    const rigged = { ...t.game, randomizer: { ...t.game.randomizer, weights: [1, 1, 1, 1, 1, 50] } };
    g.applyNow({ t: 'editGame', table: 0, game: rigged as typeof t.game });
    expect(betOdds(g.s.tables[0].game, 0).edge).toBeCloseTo(1 / 6, 12);
  });
});

describe('heat', () => {
  it('a sharp gambler reads heavy-shaved dice, walks out telling people, and heat goes up', () => {
    const g = new Game({ seed: 3, open: true, noArrivals: true, cage: 100_000_000 });
    fullTable(g);
    g.applyNow({ t: 'gaff', table: 0, gaff: { side: 'low', strength: 3 } });
    const ev = run(g, 4 * TIME.ticksPerHour, () => g.s.heat > 0);
    const spot = ev.find((e) => e.t === 'gaffSpotted') as Extract<GameEvent, { t: 'gaffSpotted' }>;
    expect(spot.agent).toBeGreaterThanOrEqual(0);
    expect(g.s.heat).toBe(HEAT.gamblerHeat);
    expect(g.s.wom).toBe(-HEAT.spotWom);
    expect(g.s.agents[spot.agent].phase).toBe('leave');
  });

  it('fair dice are never read', () => {
    const g = new Game({ seed: 3, open: true, noArrivals: true, cage: 100_000_000 });
    fullTable(g);
    const ev = run(g, 6 * TIME.ticksPerHour);
    expect(ev.some((e) => e.t === 'gaffSpotted')).toBe(false);
    expect(g.s.heat).toBe(0);
  });

  it('from heat 50 the inspector comes every night, and finds a gaff at the table it watches', () => {
    const g = new Game({ seed: 4, noArrivals: true, cage: 100_000_000 });
    g.s.heat = 50;
    g.applyNow({ t: 'gaff', table: 0, gaff: { side: 'high', strength: 2 } });
    g.applyNow({ t: 'openDoors' });
    expect(g.s.inspector?.phase).toBe('due');
    fullTable(g);
    // only the inspector reads the dice here (sharp locals would read them first and bring a raid)
    for (const a of g.s.agents) a.sharpness = 0;
    g.applyNow({ t: 'openTable', table: 1 });
    const ev = run(g, 9 * TIME.ticksPerHour, () => g.s.inspector?.phase === 'gone');
    expect(ev.some((e) => e.t === 'inspector' && e.what === 'arrived')).toBe(true);
    // its tour reached Hi-Lo (a seeded order of the two open tables) and read the dice there
    const found = ev.find((e) => e.t === 'gaffSpotted' && e.agent === -1);
    expect(found).toBeTruthy();
    expect(g.s.heat).toBeGreaterThanOrEqual(50 + HEAT.inspectorHeat);
  });

  it('crossing 75 is a raid: a quarter of the cage, the dice confiscated, the table shut tomorrow', () => {
    const g = new Game({ seed: 5, open: true, noArrivals: true });
    g.applyNow({ t: 'gaff', table: 0, gaff: { side: 'low', strength: 3 } });
    g.s.heat = 70;
    const cage = g.s.cage;
    addHeat(g.s, HEAT.gamblerHeat);
    expect(g.s.now.some((e) => e.t === 'raid')).toBe(true);
    expect(g.s.cage).toBe(cage - Math.floor(cage / 4));
    expect(g.s.tables[0].gaff).toBeNull();
    expect(g.s.tables[0].open).toBe(false);
    expect(betOdds(g.s.tables[0].game, 0).edge).toBeCloseTo(1 / 6, 12);
    run(g, 12 * TIME.ticksPerHour, () => g.s.phase === 'day');
    expect(g.s.history[0].fines).toBe(Math.floor(cage / 4));
    g.applyNow({ t: 'openDoors' });
    expect(g.s.tables[0].open).toBe(false);
    g.applyNow({ t: 'openTable', table: 0 });
    expect(g.s.tables[0].open).toBe(false);
  });

  it('100 pulls the license and ends the season', () => {
    const g = new Game({ seed: 6, open: true, noArrivals: true });
    g.s.heat = 90;
    addHeat(g.s, HEAT.inspectorHeat);
    expect(g.s.result).toBe('lost');
    expect(g.s.lostReason).toMatch(/license/);
  });

  it('heat cools 5 a night; a wrong accusation adds 3', () => {
    const g = new Game({ seed: 7, open: true, noArrivals: true });
    g.s.staff.push(makeStaff(g.s, 'security', 2));
    g.applyNow({ t: 'spawn', type: 'tourist' });
    run(g, 300);
    g.s.heat = 40;
    g.applyNow({ t: 'accuse', agent: 0 });
    expect(g.s.heat).toBe(43);
    run(g, 12 * TIME.ticksPerHour, () => g.s.phase === 'day');
    expect(g.s.history[0].heat).toBe(43);
    expect(g.s.heat).toBe(38);
  });

  it('a night with a gaff and the inspector replays bit for bit', () => {
    const opts = { seed: 8 };
    const g = new Game(opts);
    g.s.heat = 60;
    g.applyNow({ t: 'gaff', table: 0, gaff: { side: 'low', strength: 2 } });
    g.applyNow({ t: 'openDoors' });
    run(g, 11 * TIME.ticksPerHour);
    // the heat was set outside a command, so replay from the same start
    const r = new Game(opts);
    r.s.heat = 60;
    for (let i = 0; r.s.tick < g.s.tick; ) {
      while (i < g.s.log.length && g.s.log[i].tick === r.s.tick) r.command(g.s.log[i++].cmd);
      r.tick();
    }
    expect(r.hash()).toBe(g.hash());
    expect(r.s.history.length).toBe(1);
  });
});

describe('the crowd splits equal bets', () => {
  it('High and Low at the same pays each get players', () => {
    const g = new Game({ seed: 9, open: true, noArrivals: true, cage: 100_000_000 });
    fullTable(g);
    const bets = new Set(g.s.agents.map((a) => a.bet));
    expect(bets.has(0) && bets.has(1)).toBe(true);
  });
});

describe('pace §11.4 at slice scale: cheating is a loan', () => {
  const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
  const gaffer = SEEDS.map((s) => runSeason(s, GAFFER));
  const tuner = SEEDS.map((s) => runSeason(s, TUNER));
  const cash = (r: (typeof gaffer)[number], k: number) => r.game.s.history.slice(0, k).reduce((n, h) => n + h.net - h.wages - h.fines, 0);
  const mean = (rs: typeof gaffer, k: number) => {
    const ok = rs.filter((r) => r.game.s.history.length >= k);
    return ok.reduce((n, r) => n + cash(r, k), 0) / ok.length;
  };

  it('the gaffer is ahead after night 1, and behind after night 3', () => {
    expect(mean(gaffer, 1)).toBeGreaterThan(mean(tuner, 1));
    expect(mean(gaffer, 3)).toBeLessThan(mean(tuner, 3));
  });

  it('and is raided by night 4 on at least 70% of seeds', () => {
    const raided = gaffer.filter((r) => r.game.s.history.slice(0, 4).some((h) => h.fines > 0)).length;
    expect(raided).toBeGreaterThanOrEqual(14);
  });

  it('it wins the slice no more often than the honest tuner', () => {
    const wins = (rs: typeof gaffer) => rs.filter((r) => r.result === 'won').length;
    expect(wins(gaffer)).toBeLessThanOrEqual(wins(tuner));
  });
});
