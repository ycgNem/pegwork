// The Sweat (DESIGN.md §6, DECISIONS #27): the chance the cage runs dry before 6am. It replays the
// rest of tonight `n` times with the live bet-resolution code (odds `sample` and `ret`, `settle`),
// so it busts exactly when the floor would. Milestone 0 holds tonight's seated crowd fixed: every
// gambler in a seat now keeps their bet until 6am (the arrival forecast arrives with M1).
import { TABLE_KINDS } from '../data/tables';
import { NIGHT_TICKS, TIME } from '../data/time';
import { Rng } from '../engine/rng';
import { compile, type Compiled } from './odds/odds';
import { settle, stakeFor } from './settle';
import { nightTick, type GameState } from './state';

export interface SweatResult {
  /** chance of a bust before 6am, and its standard error */
  p: number;
  se: number;
  n: number;
  /** the biggest single win any seated bet could pay right now (the hard rule, §6) */
  topWin: number;
}

interface Step {
  /** ticks from now */
  at: number;
  /** a round at this table, or -1 for a delivery */
  table: number;
  cents: number;
}

interface TablePlan {
  c: Compiled;
  bets: { bet: number; stake: number }[];
  /**
   * For enumerated outcomes, the round settled once per outcome in seat order with `settle`: the
   * cage's change, and the least cage that survives the sequence (a bust happens on some win iff
   * the cage is below it). Exactly what settling bet by bet gives, without redoing it 500 times.
   */
  delta?: Float64Array;
  need?: Float64Array;
}

/** Settle one round's bets in seat order; -1 on a bust. The live order, through `settle`. */
function settleRound(cage: number, t: TablePlan, o: number): number {
  for (const b of t.bets) {
    cage = settle(cage, b.stake, t.c.ret(b.bet, o));
    if (cage < 0) return -1;
  }
  return cage;
}

/** Tabulate a round per outcome by settling it from a cage large enough never to bust. */
function tabulate(t: TablePlan) {
  const n = t.c.outcomes, delta = new Float64Array(n), need = new Float64Array(n);
  const BIG = 2 ** 50;
  for (let o = 0; o < n; o++) {
    let cage = BIG, low = BIG;
    for (const b of t.bets) {
      cage = settle(cage, b.stake, t.c.ret(b.bet, o));
      low = Math.min(low, cage);
    }
    delta[o] = cage - BIG;
    need[o] = Math.max(0, BIG - low);
  }
  t.delta = delta;
  t.need = need;
}

/**
 * `exact` settles every bet one by one (the reference the fast path is tested against); otherwise
 * enumerated tables use their tabulated rounds. Both draw the same outcomes from the same stream.
 */
export function sweat(g: GameState, n: number, seed: number, exact = false): SweatResult {
  const left = g.phase === 'night' && !g.nightOver ? Math.max(0, NIGHT_TICKS - nightTick(g)) : 0;
  const tables: TablePlan[] = [];
  const steps: Step[] = [];
  let topWin = 0;
  for (const t of g.tables) {
    const bets: { bet: number; stake: number }[] = [];
    if (t.open && !g.busted) {
      for (const id of t.seats) {
        if (id < 0) continue;
        const a = g.agents[id];
        const stake = stakeFor(a.baseBet, a.bankroll, t.min, t.max);
        if (stake < t.min) continue;
        bets.push({ bet: a.bet, stake });
        const top = Math.max(0, ...t.game.bets[a.bet].kind === 'catch' ? (t.game.bets[a.bet] as { pays10ByHits: number[] }).pays10ByHits : [(t.game.bets[a.bet] as { pays10: number }).pays10]);
        topWin = Math.max(topWin, Math.floor((stake * top) / 10));
      }
    }
    const plan: TablePlan = { c: compile(t.game), bets };
    if (!exact && plan.c.outcomes && bets.length) tabulate(plan);
    tables.push(plan);
    if (!bets.length) continue;
    // the same accumulator the table system steps: a round each time it passes ticksPerHour
    const rph = TABLE_KINDS[t.kind].roundsPerHour;
    for (let k = 1; ; k++) {
      const at = Math.ceil((k * TIME.ticksPerHour - t.acc) / rph) - 1;
      if (at >= left) break;
      steps.push({ at, table: t.id, cents: 0 });
    }
  }
  for (const d of g.deliveries) if (d.tick - g.tick < left) steps.push({ at: Math.max(0, d.tick - g.tick), table: -1, cents: d.cents });
  // within a tick: deliveries first, then tables in index order (the cage system's order)
  steps.sort((a, b) => a.at - b.at || a.table - b.table);

  const rng = new Rng(seed);
  let busts = 0;
  for (let i = 0; i < n; i++) {
    let cage = g.cage;
    for (const s of steps) {
      if (s.table < 0) {
        cage += s.cents;
        continue;
      }
      const tb = tables[s.table];
      const o = tb.c.sample(rng);
      if (tb.delta) cage = cage < tb.need![o] ? -1 : cage + tb.delta[o];
      else cage = settleRound(cage, tb, o);
      if (cage < 0) {
        busts++;
        break;
      }
    }
  }
  const p = n ? busts / n : 0;
  return { p, se: n ? Math.sqrt((p * (1 - p)) / n) : 0, n, topWin };
}

/** The standard normal CDF (Abramowitz-Stegun 7.1.26 through erf). */
export function phi(x: number): number {
  const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * The closed form for a drifted random walk (DESIGN.md §6): the chance a walk with drift mu and
 * variance sigma2 per hour, starting at cage C, touches zero within T hours. The Sweat is checked
 * against it in a test; it isn't the readout, because whale bets are big jumps.
 */
export function ruinClosedForm(C: number, mu: number, sigma2: number, T: number): number {
  const s = Math.sqrt(sigma2 * T);
  return phi((-C - mu * T) / s) + Math.exp((-2 * mu * C) / sigma2) * phi((-C + mu * T) / s);
}
