// The odds calculator and the one bet-resolution path (DESIGN.md §2, CLAUDE.md "Odds"). A game is
// compiled once: its outcomes are enumerated (dice, wheels) or described (the drum), every bet's
// result for every outcome is tabulated, and outcomes are sampled from whole-number weights. The
// live tables, the Sweat and the editor's readout all go through `sample` and `ret`, so the odds
// the owner reads are the odds the floor plays.
import type { BetDef, GameDef, RandomizerDef } from '../../data/games';
import type { Rng } from '../../engine/rng';
import { add, choose, mul, rat, sub, toNum, type Rat } from './rational';

/** A bet's result for one outcome: pays10 >= 0 wins (0 is a push), LOSE loses the stake. */
export const LOSE = -1;

export interface Compiled {
  game: GameDef;
  /** draw one outcome code */
  sample(rng: Rng): number;
  /** bet `b`'s result for an outcome code: pays10, or LOSE */
  ret(b: number, outcome: number): number;
  /** the outcome as the floor shows it ("4+3", "Red 7", "3 hits") */
  label(outcome: number): string;
  /** how many outcome codes there are, when they're enumerated (dice, wheels); 0 for the drum */
  outcomes: number;
}

export interface BetOdds {
  /** the house edge, exactly, and as a float */
  edgeExact: Rat;
  edge: number;
  /** SD of the return on one $1 bet */
  sigma: number;
  /** chance the bet wins something (a push is not a hit) */
  hit: number;
  /** the biggest payout, pays10 */
  top: number;
}

const cache = new WeakMap<GameDef, Compiled>();

export function compile(game: GameDef): Compiled {
  let c = cache.get(game);
  if (!c) {
    c = game.randomizer.kind === 'drum' ? compileDrum(game) : compileEnumerated(game);
    cache.set(game, c);
  }
  return c;
}

// ---------- dice and wheels: every outcome enumerated with a whole-number weight ----------

interface Enumerated {
  weights: number[];
  labels: string[];
  /** a bet's pays10 or LOSE for each outcome */
  table: Int32Array[];
}

function enumerate(r: RandomizerDef, bets: BetDef[]): Enumerated {
  const weights: number[] = [], labels: string[] = [];
  const outcomes: { sum: number; same: boolean; pocket: number }[] = [];
  if (r.kind === 'dice') {
    const n = Math.pow(r.faces, r.count);
    const fw = r.weights ?? new Array(r.faces).fill(1);
    for (let i = 0; i < n; i++) {
      let x = i, sum = 0, w = 1, first = -1, same = true;
      const faces: number[] = [];
      for (let k = 0; k < r.count; k++) {
        const f = x % r.faces;
        x = Math.floor(x / r.faces);
        faces.push(f + 1);
        sum += f + 1;
        w *= fw[f];
        if (first < 0) first = f;
        else if (f !== first) same = false;
      }
      weights.push(w);
      labels.push(faces.join('+'));
      outcomes.push({ sum, same, pocket: -1 });
    }
  } else if (r.kind === 'wheel') {
    r.pockets.forEach((color, i) => {
      weights.push(r.weights?.[i] ?? 1);
      labels.push(color === 'house' ? `House ${i}` : `${color === 'red' ? 'Red' : 'Black'} ${i}`);
      outcomes.push({ sum: 0, same: false, pocket: i });
    });
  }
  const table = bets.map((b) => {
    const t = new Int32Array(outcomes.length);
    outcomes.forEach((o, i) => {
      let win = false;
      if (b.kind === 'sum') win = b.sums.includes(o.sum);
      else if (b.kind === 'allSame') win = o.same;
      else if (b.kind === 'color' && r.kind === 'wheel') win = r.pockets[o.pocket] === b.color;
      else if (b.kind === 'pockets') win = b.pockets.includes(o.pocket);
      t[i] = win ? (b as { pays10: number }).pays10 : LOSE;
    });
    return t;
  });
  return { weights, labels, table };
}

function compileEnumerated(game: GameDef): Compiled {
  const e = enumerate(game.randomizer, game.bets);
  const cum: number[] = [];
  let total = 0;
  for (const w of e.weights) cum.push((total += w));
  return {
    game,
    sample(rng) {
      const r = Math.floor(rng.next() * total);
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] > r) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    },
    ret: (b, o) => e.table[b][o],
    label: (o) => e.labels[o],
    outcomes: e.weights.length,
  };
}

// ---------- the drum: `drawn` of `balls` balls; a catch bet covers balls 0..picks-1 ----------
// (every set of picks has the same odds, so the bet's numbers are fixed.) The outcome code is the
// drawn set as a bitmask split in two 20-bit halves: lo + hi * 2^20.

const HALF = 1 << 20;

function popcount(x: number) {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

function compileDrum(game: GameDef): Compiled {
  const r = game.randomizer as Extract<RandomizerDef, { kind: 'drum' }>;
  if (r.balls > 40) throw new Error('drum: at most 40 balls');
  const balls = Array.from({ length: r.balls }, (_, i) => i);
  return {
    game,
    sample(rng) {
      const a = balls.slice();
      let lo = 0, hi = 0;
      for (let k = 0; k < r.drawn; k++) {
        const j = k + Math.floor(rng.next() * (a.length - k));
        [a[k], a[j]] = [a[j], a[k]];
        if (a[k] < 20) lo |= 1 << a[k];
        else hi |= 1 << (a[k] - 20);
      }
      return lo + hi * HALF;
    },
    ret(b, o) {
      const bet = game.bets[b];
      if (bet.kind !== 'catch') return LOSE;
      const lo = o % HALF;
      const hits = popcount(lo & ((1 << Math.min(bet.picks, 20)) - 1));
      return bet.pays10ByHits[hits] ?? LOSE;
    },
    label(o) {
      return `${popcount(o % HALF) + popcount(Math.floor(o / HALF))} balls`;
    },
    outcomes: 0,
  };
}

// ---------- exact odds ----------

/** Each distinct result of a bet with its exact probability. */
function distribution(game: GameDef, b: number, fair: boolean): { p: Rat; pays10: number }[] {
  const r = game.randomizer, bet = game.bets[b];
  if (r.kind === 'drum') {
    if (bet.kind !== 'catch') return [{ p: rat(1), pays10: LOSE }];
    const all = choose(r.balls, r.drawn);
    const out: { p: Rat; pays10: number }[] = [];
    for (let k = 0; k <= bet.picks; k++) {
      const ways = choose(bet.picks, k) * choose(r.balls - bet.picks, r.drawn - k);
      if (ways) out.push({ p: rat(ways, all), pays10: bet.pays10ByHits[k] ?? LOSE });
    }
    return out;
  }
  const def = fair ? { ...r, weights: undefined } : r;
  const e = enumerate(def as RandomizerDef, [bet]);
  const total = e.weights.reduce((s, w) => s + w, 0);
  const byPays = new Map<number, bigint>();
  e.weights.forEach((w, i) => byPays.set(e.table[0][i], (byPays.get(e.table[0][i]) ?? 0n) + BigInt(w)));
  return [...byPays].map(([pays10, w]) => ({ p: rat(w, total), pays10 }));
}

/**
 * The exact odds of bet `b`: edge, volatility, hit rate. `fair` ignores a gaff's weights: what
 * the gamblers think the odds are (the editor shows both, PLAN "Gaffs").
 */
export function betOdds(game: GameDef, b: number, fair = false): BetOdds {
  let m = oddsCache.get(game);
  if (!m) oddsCache.set(game, (m = new Map()));
  const key = fair ? -1 - b : b;
  let o = m.get(key);
  if (!o) m.set(key, (o = computeOdds(game, b, fair)));
  return o;
}

const oddsCache = new WeakMap<GameDef, Map<number, BetOdds>>();

function computeOdds(game: GameDef, b: number, fair: boolean): BetOdds {
  let R = rat(0), R2 = rat(0), hit = rat(0), top = 0;
  for (const { p, pays10 } of distribution(game, b, fair)) {
    if (pays10 === LOSE) continue;
    const back = rat(10 + pays10, 10);
    R = add(R, mul(p, back));
    R2 = add(R2, mul(p, mul(back, back)));
    if (pays10 > 0) hit = add(hit, p);
    top = Math.max(top, pays10);
  }
  const edgeExact = sub(rat(1), R);
  return { edgeExact, edge: toNum(edgeExact), sigma: Math.sqrt(toNum(sub(R2, mul(R, R)))), hit: toNum(hit), top };
}

/** Is any of the game's randomizer weights a gaff (not all equal)? */
export function isGaffed(game: GameDef): boolean {
  const w = game.randomizer.kind === 'drum' ? undefined : game.randomizer.weights;
  return !!w && w.some((x) => x !== w[0]);
}
