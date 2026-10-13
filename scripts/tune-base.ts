// Search the base board's 24-peg field (DESIGN.md §2 / §8.1): every column's true EV (3,000 drops
// a column) in 0.70–0.95 and the best column in 0.85–0.95. Pegs live on a staggered lattice (every other row, every other
// column, alternate rows offset by a cell), so any choice of 24 sites still reads as a staggered
// field; a hill climb moves one peg at a time. The chosen field is copied into
// src/data/boards.ts by hand and recorded in DECISIONS.md.
// Usage: npx vite-node scripts/tune-base.ts [restarts] [iterations] [seed] [drops] [start field JSON]
import { BASE_BOARD, type BoardDef, type PegDef } from '../src/data/boards';
import { MARBLES } from '../src/data/marbles';
import { dryRunAll } from '../src/sim/dryrun';
import { Rng } from '../src/engine/rng';

const RESTARTS = Number(process.argv[2] ?? 4), ITERS = Number(process.argv[3] ?? 600);
const rng = new Rng(Number(process.argv[4] ?? 1));
const N = 24, DROPS = Number(process.argv[5] ?? 1000);
const START: PegDef[] | null = process.argv[6] ? JSON.parse(process.argv[6]) : null;

const SHOULDERS = [3];
const SITES: PegDef[] = [];
for (let r = 4; r <= 22; r += 2)
  for (let c = 1; c <= 18; c++) {
    // two cells clear of the shoulders (a peg by a shoulder's tip makes a pocket)
    const nearShoulder = SHOULDERS.some((sr) => Math.abs(r - sr) < 2 && (c < 2 || c > 17));
    if (c % 2 === (r / 2) % 2 && !nearShoulder) SITES.push({ c, r });
  }

/** each column's EV; a rail tap anywhere counts as a full point of badness (a pocket) */
function evs(pegs: PegDef[], shoulders: number[], drops = DROPS, seed = 1) {
  const board: BoardDef = { ...BASE_BOARD, pegs, shoulders };
  const runs = dryRunAll(board, MARBLES.steel, drops, seed);
  const e = runs.map((r) => r.mean) as number[] & { taps?: number };
  e.taps = runs.reduce((n, r) => n + r.taps + r.jams, 0);
  return e;
}

function score(e: number[] & { taps?: number }) {
  const best = Math.max(...e), worst = Math.min(...e);
  let bad = 0;
  for (const v of e) bad += Math.max(0, 0.72 - v) + Math.max(0, v - 0.93);
  bad += 2 * (Math.max(0, 0.87 - best) + Math.max(0, best - 0.93));
  return bad + 0.05 * Math.abs(worst - 0.76) + (e.taps ?? 0);
}

let global = { bad: Infinity, pegs: [] as PegDef[], shoulders: [] as number[] };
for (let k = 0; k < RESTARTS; k++) {
  let picks = rng.shuffle([...SITES.keys()]).slice(0, N);
  if (START && k === 0) {
    // the start field, with any peg no longer on a site moved to a free one
    const want = START.map((p) => SITES.findIndex((q) => q.c === p.c && q.r === p.r));
    const free = rng.shuffle([...SITES.keys()].filter((i) => !want.includes(i)));
    picks = want.map((i) => (i >= 0 ? i : free.pop()!));
  }
  let shoulders = SHOULDERS;
  const pegsOf = (p: number[]) => p.map((i) => SITES[i]).sort((a, b) => a.r - b.r || a.c - b.c);
  let bad = score(evs(pegsOf(picks), shoulders));
  for (let it = 0; it < ITERS && bad > 0; it++) {
    const next = [...picks];
    let nextSh = shoulders;
    {
      const free = [...SITES.keys()].filter((i) => !next.includes(i));
      const j = rng.int(0, N - 1), from = SITES[next[j]];
      // mostly a step to a neighboring site, sometimes a jump anywhere
      const near = free.filter((i) => Math.abs(SITES[i].c - from.c) <= 2 && Math.abs(SITES[i].r - from.r) <= 2);
      next[j] = near.length && rng.chance(0.7) ? rng.pick(near) : rng.pick(free);
    }
    const b = score(evs(pegsOf(next), nextSh));
    if (b <= bad) { picks = next; shoulders = nextSh; bad = b; }
    if (it % 25 === 0) console.log(`  it ${it} bad ${bad.toFixed(3)} ${JSON.stringify(pegsOf(picks))}`);
  }
  const pegs = pegsOf(picks);
  const check = evs(pegs, shoulders, 3000, 2);
  console.log(`restart ${k}: climb ${bad.toFixed(3)}, at 3000 drops seed 2: ${score(check).toFixed(3)} best ${Math.max(...check).toFixed(3)} worst ${Math.min(...check).toFixed(3)} shoulders ${shoulders}`);
  if (score(check) < global.bad) global = { bad: score(check), pegs, shoulders };
}
console.log('BEST', global.bad.toFixed(3), 'shoulders', JSON.stringify(global.shoulders));
console.log(JSON.stringify(global.pegs));
