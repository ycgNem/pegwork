// Bots that play a season headless (DESIGN.md §11 pace tests, the balance auditor). A policy sees
// the state each day and may give orders; nights run on their own unless the policy has a night
// hook. Pure: everything goes through commands, so a bot's season replays from its log.
import { STRIP } from '../data/strip';
import { TIME } from '../data/time';
import type { Command } from './commands';
import { Game, type GameOptions } from './Game';
import { buyoutPrice } from './season';
import type { GameState } from './state';

export interface Policy {
  name: string;
  /** orders for the day before night `g.night` (and the last day after the slice) */
  day(g: GameState): Command[];
  /** optional: orders during the night, checked every game minute */
  night?(g: GameState): Command[];
}

export interface SeasonResult {
  seed: number;
  result: GameState['result'];
  reason: string;
  /** the night the buyout happened (0 if never) */
  boughtOn: number;
  nets: number[];
  shares: number[];
  finalBank: number;
  finalCage: number;
  price: number;
  game: Game;
}

/** Keep at least this in the cage across a day's transfers. */
export const CAGE_FLOOR = 200000;

/** Buy the rival as soon as the bank (topped up from the cage above its floor) covers the price. */
export function buyIfAble(g: GameState): Command[] {
  const price = buyoutPrice(g);
  const spare = Math.max(0, g.cage - CAGE_FLOOR);
  if (g.bank + spare < price) return [];
  const need = Math.max(0, price - g.bank);
  return need > 0 ? [{ t: 'transferCash', cents: -need }, { t: 'buyout' }] : [{ t: 'buyout' }];
}

export function runSeason(seed: number, policy: Policy, opts: Partial<GameOptions> = {}): SeasonResult {
  const game = new Game({ seed, ...opts });
  const g = game.s;
  let boughtOn = 0;
  for (let guard = 0; guard < 40 && g.result === 'playing'; guard++) {
    // the day: the policy's orders, then (if the slice isn't over) open the doors
    for (const c of policy.day(g)) game.applyNow(c);
    if (g.result !== 'playing') {
      if (g.rival.bought) boughtOn = g.night - 1;
      break;
    }
    if (g.night > STRIP.sliceNights) {
      game.applyNow({ t: 'closeSeason' });
      break;
    }
    game.applyNow({ t: 'openDoors' });
    while (g.phase === 'night' && g.result === 'playing') {
      if (policy.night && (g.tick - g.nightStart) % TIME.ticksPerMinute === 0) for (const c of policy.night(g)) game.command(c);
      game.tick();
    }
  }
  game.drain();
  return {
    seed, result: g.result, reason: g.lostReason, boughtOn,
    nets: g.history.map((h) => h.net), shares: g.history.map((h) => h.share),
    finalBank: g.bank, finalCage: g.cage, price: buyoutPrice(g), game,
  };
}

/** Never touches a paytable; buys when it can. */
export const GREEDY: Policy = { name: 'greedy', day: (g) => buyIfAble(g) };

/**
 * Brings every starter bet to about 8.3% on day 1 (Hi-Lo pays 1.2:1 and 4.5:1, the one pocket
 * 21:1), then buys when it can.
 */
export const TUNER: Policy = {
  name: 'tuner',
  day(g) {
    const out: Command[] = [];
    if (g.night === 1) {
      out.push({ t: 'setPays', table: 0, bet: 0, pays10: 12 }, { t: 'setPays', table: 0, bet: 1, pays10: 12 });
      out.push({ t: 'setPays', table: 0, bet: 2, pays10: 45 }, { t: 'setPays', table: 0, bet: 3, pays10: 45 });
      out.push({ t: 'setPays', table: 1, bet: 2, pays10: 210 });
    }
    // one guard on the door, so a spotted cheat gets walked out
    const guard = g.hall.find((s) => s.role === 'security');
    if (guard && !g.staff.some((s) => s.role === 'security')) out.push({ t: 'hire', candidate: guard.id });
    const buy = buyIfAble(g);
    return [...out, ...(buy.length ? buy : keepCage(g, 400000))];
  },
};

/**
 * The cheat (DESIGN.md §11.4): the tuner's paytable, but Low pays a shade less so the sharp crowd
 * plays High, and the dice shaved heavy toward low (High's true edge 29.6%, posted 8.3%). It
 * shaves them again after every raid.
 */
export const GAFFER: Policy = {
  name: 'gaffer',
  day(g) {
    const out = TUNER.day(g).filter((c) => c.t !== 'buyout' && c.t !== 'transferCash');
    if (g.night === 1) out.push({ t: 'setPays', table: 0, bet: 1, pays10: 11 });
    if (!g.tables[0].gaff) out.push({ t: 'gaff', table: 0, gaff: { side: 'low', strength: 3 } });
    const buy = buyIfAble(g);
    return [...out, ...(buy.length ? buy : keepCage(g, 400000))];
  },
};

/** Top the cage up from the bank to `target` (a cautious owner's day). */
export function keepCage(g: GameState, target: number): Command[] {
  const need = Math.min(g.bank, target - g.cage);
  return need > 0 ? [{ t: 'transferCash', cents: need }] : [];
}
