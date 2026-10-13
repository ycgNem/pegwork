// The season (DESIGN.md §7, PLAN "The run"): the strip's crowd split among the houses, opening the
// doors, the count at dawn, the rival's night and its move, the buyout. Pure; called from the
// command and clock systems.
import { ECONOMY } from '../data/economy';
import { BUYOUT, STRIP, UNDERCUTTER } from '../data/strip';
import { TABLE_KINDS } from '../data/tables';
import { betOdds } from './odds/odds';
import type { GameState } from './state';

/** Gamblers on the strip on a night. */
export const population = (night: number) => Math.round(STRIP.population * Math.pow(1 + STRIP.growth / 1000, night - 1));

/**
 * The edge your house posts (what the strip hears): the mean over open tables of each table's
 * mean bet edge, as the paytable looks (a gaff doesn't change what the strip hears). No open
 * table: nobody comes.
 */
export function postedEdge(g: GameState): number {
  const open = g.tables.filter((t) => t.open);
  if (!open.length) return 1;
  let sum = 0;
  for (const t of open) {
    let e = 0;
    for (let b = 0; b < t.game.bets.length; b++) e += betOdds(t.game, b, true).edge;
    sum += e / t.game.bets.length;
  }
  return sum / open.length;
}

export interface Shares { you: number; rival: number; rest: number; uYou: number; uRival: number }

/** The strip's split tonight (DESIGN.md §7): a softmax over the houses' pull. */
export function shares(g: GameState): Shares {
  const r = g.rival;
  const uYou = (STRIP.repWeight * g.reputation) / 1000 - STRIP.edgeWeight * postedEdge(g);
  const uRival = r.bought ? -Infinity : (STRIP.repWeight * r.reputation) / 1000 - STRIP.edgeWeight * r.edge + (r.buffet ? UNDERCUTTER.buffetU : 0);
  const ey = Math.exp(uYou), er = Math.exp(uRival), es = Math.exp(STRIP.restOfStripU);
  const t = ey + er + es;
  return { you: ey / t, rival: er / t, rest: es / t, uYou, uRival };
}

/** The rival's night: its crowd spends by its edge, its overhead comes out (DESIGN.md §7). */
export function rivalProfit(g: GameState, night: number, share: number): number {
  const crowd = Math.round(population(night) * share);
  return Math.round(crowd * UNDERCUTTER.spendPerEdge * g.rival.edge) - UNDERCUTTER.overhead;
}

/** What it costs to buy the rival out right now. */
export function buyoutPrice(g: GameState): number {
  const p = g.rival.profits.slice(-BUYOUT.window);
  const avg = p.length ? p.reduce((a, b) => a + b, 0) / p.length : 0;
  return Math.max(UNDERCUTTER.buildingValue, UNDERCUTTER.buildingValue + Math.round(BUYOUT.nightsOfProfit * avg));
}

/** Open the doors: tonight's crowd is set by the split as the strip sees the house now. */
export function beginNight(g: GameState) {
  const s = shares(g);
  g.share = Math.round(s.you * 1000);
  g.rival.share = Math.round(s.rival * 1000);
  g.arrivals = Math.round(population(g.night) * s.you);
  g.phase = 'night';
  g.nightStart = g.tick;
  g.nightOver = false;
  g.agents = [];
  g.nextAgent = 0;
  g.deliveries = [];
  g.settle = [];
  g.wom = 0;
  g.stats = { arrived: 0, left: 0, leftUp: 0, leftBroke: 0, rounds: 0, handle: 0, net: 0 };
  for (const t of g.tables) {
    t.acc = 0;
    t.seats = TABLE_KINDS[t.kind].seats.map(() => -1);
    t.last = [];
    t.rounds = 0;
    t.handle = 0;
    t.net = 0;
  }
  g.now.push({ t: 'doorsOpen', night: g.night, arrivals: g.arrivals, share: g.share });
}

/** The count at dawn: wages, the book, reputation, the rival's night and its next move. */
export function endNight(g: GameState) {
  const wages = g.tables.filter((t) => t.open || t.rounds > 0).length * ECONOMY.dealerWage;
  // wages come out of the bank, then the cage; a payroll the house can't meet finishes it
  const fromBank = Math.min(Math.max(0, g.bank), wages);
  g.bank -= fromBank;
  g.cage -= wages - fromBank;
  g.history.push({ night: g.night, net: g.stats.net, arrivals: g.stats.arrived, share: g.share, wom: g.wom, wages });
  g.reputation = Math.round((g.reputation * STRIP.repKeep) / 1000) + g.wom;
  const r = g.rival;
  if (!r.bought) {
    const profit = rivalProfit(g, g.night, r.share / 1000);
    r.profits.push(profit);
    r.cash += profit;
    r.buffet = false;
  }
  g.phase = 'day';
  g.night++;
  if (g.cage < 0) {
    g.result = 'lost';
    g.lostReason = 'The payroll bounced.';
  }
  if (!r.bought && g.result === 'playing') rivalMove(g);
  g.now.push({ t: 'dayBegins', night: g.night });
}

/** The rival's move for the coming night, from its deck (DESIGN.md §7). */
function rivalMove(g: GameState) {
  const r = g.rival;
  const move = r.rng.pick(UNDERCUTTER.moves);
  r.lastMove = move;
  if (move === 'undercut') r.edge = Math.max(UNDERCUTTER.edgeFloor, Math.round((r.edge - 0.005) * 10000) / 10000);
  else if (move === 'billboard') r.reputation += 2000;
  else r.buffet = true;
  g.now.push({ t: 'rivalMove', move });
}

/** The night the rival starts from: its profit history seeded with what it makes against a new joint. */
export function seedRival(g: GameState) {
  const s = shares(g);
  const p = rivalProfit(g, 1, s.rival);
  g.rival.profits = [p, p, p];
  g.rival.share = Math.round(s.rival * 1000);
}
