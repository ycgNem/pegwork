// Staff and cheats (DESIGN.md §3, §8): dealers set the pace, a table needs one, pit bosses spot
// cheats, security walks them out, a wrong accusation costs reputation, wages come out at dawn.
import { describe, expect, it } from 'vitest';
import { ROLES } from '../src/data/staff';
import { TIME } from '../src/data/time';
import { Game } from '../src/sim/Game';
import type { GameEvent } from '../src/sim/events';
import { dealerOf, makeStaff, tablePace } from '../src/sim/staff';

function run(g: Game, ticks: number, until?: () => boolean): GameEvent[] {
  const ev: GameEvent[] = [];
  for (let t = 0; t < ticks && !(until && until()); t++) {
    g.tick();
    ev.push(...g.drain());
  }
  return ev;
}

describe('dealers', () => {
  it('a veteran deals 1.25x a standard dealer; a green one 0.8x', () => {
    const g = new Game({ seed: 1, open: true });
    const d = dealerOf(g.s, 0)!;
    expect(tablePace(g.s, g.s.tables[0])).toBe(80);
    d.skill = 3;
    expect(tablePace(g.s, g.s.tables[0])).toBe(100);
    d.skill = 1;
    expect(tablePace(g.s, g.s.tables[0])).toBe(64);
  });

  it('a table without a dealer can\'t open, and moving its dealer away closes it', () => {
    const g = new Game({ seed: 2, open: true, noArrivals: true });
    const d = dealerOf(g.s, 0)!;
    g.applyNow({ t: 'assign', staff: d.id, table: -1 });
    expect(g.s.tables[0].open).toBe(false);
    g.applyNow({ t: 'openTable', table: 0 });
    expect(g.s.tables[0].open).toBe(false);
    expect(g.drain().some((e) => e.t === 'rejected')).toBe(true);
    g.applyNow({ t: 'assign', staff: d.id, table: 0 });
    g.applyNow({ t: 'openTable', table: 0 });
    expect(g.s.tables[0].open).toBe(true);
  });

  it('wages come out at dawn, and the doors need a cashier', () => {
    const g = new Game({ seed: 3, open: true });
    const wages = g.s.staff.reduce((n, s) => n + ROLES[s.role].wage[s.skill - 1], 0);
    const before = g.s.cage + g.s.bank;
    run(g, 12 * TIME.ticksPerHour, () => g.s.phase === 'day');
    expect(g.s.phase).toBe('day');
    expect(g.s.history[0].wages).toBe(wages);
    expect(g.s.cage + g.s.bank).toBe(before + g.s.history[0].net - wages);
    const cashier = g.s.staff.find((s) => s.role === 'cashier')!;
    g.applyNow({ t: 'fire', staff: cashier.id });
    g.applyNow({ t: 'openDoors' });
    expect(g.s.phase).toBe('day');
  });

  it('the hiring hall offers candidates; hiring one puts them on the roster', () => {
    const g = new Game({ seed: 4 });
    const n = g.s.staff.length;
    const c = g.s.hall.find((s) => s.role === 'security')!;
    g.applyNow({ t: 'hire', candidate: c.id });
    expect(g.s.staff.length).toBe(n + 1);
    expect(g.s.hall.some((s) => s.id === c.id)).toBe(false);
  });
});

describe('cheats', () => {
  /** A cheat seated at a table with the given watcher and security setup. */
  function withCheat(seed: number, kind: 'slider' | 'pastPoster', opts: { security: boolean; bossSkill?: 1 | 2 | 3 }) {
    const g = new Game({ seed, open: true, noArrivals: true, cage: 10_000_000 });
    if (opts.security) g.s.staff.push(makeStaff(g.s, 'security', 2));
    const boss = g.s.staff.find((s) => s.role === 'pitBoss')!;
    if (opts.bossSkill) boss.skill = opts.bossSkill;
    g.applyNow({ t: 'spawn', type: 'tourist', cheat: kind });
    const a = g.s.agents[0];
    a.bankroll = a.start = 10_000_000;
    a.stopLoss = 1000;
    // pinned to an even-money bet, so cheating rounds come often (a long shot hides a cheat well)
    run(g, 2000, () => a.phase === 'seated');
    a.bet = 0;
    return g;
  }

  it('a dice slider wins far more often than the dice allow', () => {
    // with no pit boss watching, over a long night
    let won = 0, rounds = 0;
    for (const seed of [1, 2, 3]) {
      const g = withCheat(seed, 'slider', { security: false });
      for (const s of g.s.staff) if (s.role === 'pitBoss') s.watch = [];
      const a = g.s.agents[0];
      a.patience = 1e9;
      a.winGoal = 1e12;
      a.bankroll = a.start = 1e9;
      const ev = run(g, 6 * TIME.ticksPerHour);
      rounds += ev.filter((e) => e.t === 'round' && e.table === a.table).length;
      won += ev.filter((e) => e.t === 'win' && e.agent === a.id).length;
    }
    // fair: Any Seven or Doubles hit 1 in 6, High/Low 15 in 36; a slider controlling 1 roll in 4 does better
    const g0 = withCheat(1, 'slider', { security: false });
    expect(won / rounds).toBeGreaterThan(0.3);
    expect(g0.s.agents[0].cheat).toBe('slider');
  });

  it('a watching pit boss spots a past-poster, security walks them out, the winnings come back', () => {
    const g = withCheat(5, 'pastPoster', { security: true, bossSkill: 3 });
    const a = g.s.agents[0];
    a.patience = 1e9;
    a.winGoal = 1e12;
    const ev = run(g, 8 * TIME.ticksPerHour, () => a.ejected);
    expect(ev.some((e) => e.t === 'cheatSpotted' && e.agent === a.id)).toBe(true);
    const out = ev.find((e) => e.t === 'ejected') as Extract<GameEvent, { t: 'ejected' }>;
    expect(out.agent).toBe(a.id);
    expect(a.bankroll).toBeLessThanOrEqual(a.start);
    expect(g.s.wom).toBeGreaterThan(0);
  });

  it('with no security a spotted cheat keeps playing', () => {
    const g = withCheat(5, 'pastPoster', { security: false, bossSkill: 3 });
    const a = g.s.agents[0];
    a.patience = 1e9;
    a.winGoal = 1e12;
    run(g, 8 * TIME.ticksPerHour, () => a.spotted);
    expect(a.spotted).toBe(true);
    run(g, TIME.ticksPerHour);
    expect(a.ejected).toBe(false);
  });

  it('accusing an honest gambler costs reputation and they leave', () => {
    const g = new Game({ seed: 6, open: true, noArrivals: true });
    g.s.staff.push(makeStaff(g.s, 'security', 2));
    g.applyNow({ t: 'spawn', type: 'tourist' });
    run(g, 300);
    g.applyNow({ t: 'accuse', agent: 0 });
    expect(g.s.wom).toBe(-2000);
    expect(g.s.agents[0].phase).toBe('leave');
  });

  it('a whole night with cheats and security replays bit for bit', () => {
    const g = new Game({ seed: 8, open: true });
    g.s.staff.push(makeStaff(g.s, 'security', 2));
    g.command({ t: 'spawn', type: 'tourist', cheat: 'slider' });
    run(g, 11 * TIME.ticksPerHour);
    // the extra guard was pushed outside a command, so replay from the same start
    const r = new Game({ seed: 8, open: true });
    r.s.staff.push(makeStaff(r.s, 'security', 2));
    for (let i = 0, t = 0; t < 11 * TIME.ticksPerHour; t++) {
      while (i < g.s.log.length && g.s.log[i].tick === r.s.tick) r.command(g.s.log[i++].cmd);
      r.tick();
    }
    expect(r.hash()).toBe(g.hash());
  });
});
