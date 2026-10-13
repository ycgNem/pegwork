// How a free gambler picks a table and a bet (DESIGN.md §5): every open table with a free seat is
// scored by the gambler's favorite bet there, then one is drawn by a seeded softmax.
import { CHOICE } from '../data/gamblers';
import { CHEATS } from '../data/cheats';
import { betOdds } from './odds/odds';
import { flowField, seatTile, tileOf, walkTiles } from './floor';
import type { Gambler, GameState } from './state';

export interface Pick { table: number; seat: number; bet: number }

/** The score of bet `b` at table `t` for gambler `a` (without the walk). */
export function betScore(g: GameState, a: Gambler, t: number, b: number): number {
  const table = g.tables[t];
  // the gamblers judge the paytable as it looks, not the gaff's true odds
  const o = betOdds(table.game, b, true);
  const thrill = a.thrill / 1000, sharp = a.sharpness / 1000;
  const perceived = o.edge + a.noise / 1000;
  const filled = table.seats.filter((s) => s >= 0).length / table.seats.length;
  return CHOICE.hit * o.hit + CHOICE.top * thrill * Math.log2(1 + o.top / 10) + CHOICE.buzz * filled - CHOICE.edge * sharp * perceived;
}

export function chooseTable(g: GameState, a: Gambler): Pick | null {
  const ax = tileOf(a.x), ay = tileOf(a.y);
  const options: { pick: Pick; score: number }[] = [];
  for (const table of g.tables) {
    if (!table.open || a.bankroll < table.min) continue;
    if (a.cheat && !CHEATS[a.cheat].tables.includes(table.kind)) continue;
    const seat = table.seats.indexOf(-1);
    if (seat < 0) continue;
    const [sx, sy] = seatTile(table, seat);
    const walk = walkTiles(flowField(g, sx, sy), g.floor.w, ax, ay);
    if (walk < 0) continue;
    // the favorite bet; equal bets (High and Low at the same pays) split the crowd by gambler
    let bestScore = -Infinity;
    const scores = table.game.bets.map((_, b) => betScore(g, a, table.id, b));
    for (const s of scores) bestScore = Math.max(bestScore, s);
    const tied = scores.flatMap((s, b) => (bestScore - s < 1e-9 ? [b] : []));
    const best = tied[a.id % tied.length];
    options.push({ pick: { table: table.id, seat, bet: best }, score: bestScore - CHOICE.walk * walk });
  }
  if (!options.length) return null;
  const top = Math.max(...options.map((o) => o.score));
  const weights = options.map((o) => Math.exp((o.score - top) / CHOICE.temperature));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = g.crowdRng.next() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i].pick;
  }
  return options[options.length - 1].pick;
}

/** Seat a gambler at their pick: claim the seat and walk to it. */
export function claim(g: GameState, a: Gambler, p: Pick) {
  const table = g.tables[p.table];
  table.seats[p.seat] = a.id;
  a.table = p.table;
  a.seat = p.seat;
  a.bet = p.bet;
  [a.tx, a.ty] = seatTile(table, p.seat);
  a.phase = 'walk';
}

/** Stand a gambler up (their seat frees at once). */
export function standUp(g: GameState, a: Gambler) {
  if (a.table >= 0) {
    const t = g.tables[a.table];
    if (t.seats[a.seat] === a.id) t.seats[a.seat] = -1;
  }
  a.table = -1;
  a.seat = -1;
}

/** Close a table: its seated gamblers get up and look for another. */
export function closeTable(g: GameState, id: number) {
  const t = g.tables[id];
  t.open = false;
  for (const aid of t.seats) {
    if (aid < 0) continue;
    const a = g.agents[aid];
    standUp(g, a);
    a.phase = 'choose';
  }
}
