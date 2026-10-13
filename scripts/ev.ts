// Print every column's Dry Run EV for the base board (or a candidate peg field passed as JSON).
// Usage: npx vite-node scripts/ev.ts ['[{"c":3,"r":6},...]' ['[3]']]
import { BASE_BOARD, type BoardDef } from '../src/data/boards';
import { MARBLES } from '../src/data/marbles';
import { dryRunAll } from '../src/sim/dryrun';

const pegs = process.argv[2] ? JSON.parse(process.argv[2]) : BASE_BOARD.pegs;
const board: BoardDef = { ...BASE_BOARD, pegs, shoulders: process.argv[3] ? JSON.parse(process.argv[3]) : BASE_BOARD.shoulders };
const t0 = performance.now();
const all = dryRunAll(board, MARBLES.steel, 300, 1);
const ms = performance.now() - t0;
for (const r of all) console.log(String(r.column).padStart(2), r.mean.toFixed(3), r.cupRates.map((x) => x.toFixed(2)).join(' '), r.jams ? `jams ${r.jams}` : '', r.taps ? `taps ${r.taps}` : '');
const evs = all.map((r) => r.mean);
console.log(`best ${Math.max(...evs).toFixed(3)} worst ${Math.min(...evs).toFixed(3)}  ${ms.toFixed(0)} ms for 6000 drops`);
