// Data validation (CLAUDE.md): every number in src/data carries a derivation naming a DESIGN.md
// section that exists, and every sprite the data names exists.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as boards from '../src/data/boards';
import * as economy from '../src/data/economy';
import * as marbles from '../src/data/marbles';
import * as materials from '../src/data/materials';
import { hasSprite } from '../src/render/atlas';
import { definePlaceholders } from '../src/render/placeholders';

const design = fs.readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8');
const SECTIONS = new Set([...design.matchAll(/^## (\d+)\./gm)].map((m) => m[1]));

/** Walk a data value: every object holding a number must carry (or inherit) a derivation. */
function check(path: string, v: unknown, derivation: string | null, problems: string[]) {
  if (v === null || typeof v !== 'object') return;
  const own = (v as any).derivation;
  const d = typeof own === 'string' ? own : derivation;
  if (typeof own === 'string') {
    const refs = [...own.matchAll(/DESIGN\.md §(\d+)/g)].map((m) => m[1]);
    if (!refs.length) problems.push(`${path}: derivation names no DESIGN.md section: "${own}"`);
    for (const r of refs) if (!SECTIONS.has(r)) problems.push(`${path}: DESIGN.md §${r} does not exist`);
  }
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'number' && !d) problems.push(`${path}.${k}: a number with no derivation`);
    check(`${path}.${k}`, x, d, problems);
  }
}

describe('data', () => {
  it('every number has a derivation naming a DESIGN.md section', () => {
    const problems: string[] = [];
    for (const [file, mod] of Object.entries({ boards, economy, marbles, materials }))
      for (const [name, v] of Object.entries(mod)) if (typeof v === 'object') check(`${file}.${name}`, v, null, problems);
    expect(problems).toEqual([]);
  });

  it('the base board is valid: 24 pegs on the board, apart, clear of the rail, the walls and the cups', () => {
    const b = boards.BASE_BOARD, B = boards.BOARD;
    expect(b.pegs.length).toBe(24);
    const seen = new Set<string>();
    for (const p of b.pegs) {
      expect(p.c).toBeGreaterThanOrEqual(1); // never in a wall column: no corner a marble can rest in
      expect(p.c).toBeLessThanOrEqual(B.cols - 2);
      expect(p.r).toBeGreaterThan(B.railRow);
      expect(p.r).toBeLessThan(B.cupRow - 1);
      expect(seen.has(`${p.c},${p.r}`)).toBe(false);
      seen.add(`${p.c},${p.r}`);
    }
    // two pegs a cell apart would leave a gap a marble could sit in: at least two cells, either way
    for (const a of b.pegs) for (const c of b.pegs) if (a !== c) expect(Math.max(Math.abs(a.c - c.c), Math.abs(a.r - c.r))).toBeGreaterThanOrEqual(2);
    // a peg near a shoulder's tip makes a V a marble can rest in: two cells clear of every shoulder
    for (const p of b.pegs) for (const r of b.shoulders) for (const c of [0, B.cols - 1]) expect(Math.max(Math.abs(p.c - c), Math.abs(p.r - r))).toBeGreaterThanOrEqual(2);
    // cups tile the bottom row
    let col = 0;
    for (const cup of b.cups) {
      expect(cup.c).toBe(col);
      col += cup.span;
    }
    expect(col).toBe(B.cols);
    expect(b.cups.map((c) => c.mult)).toEqual([0, 1, 3, 1, 0]);
  });

  it('every sprite the data names exists', () => {
    definePlaceholders();
    for (const m of Object.values(marbles.MARBLES)) for (let f = 0; f < 4; f++) expect(hasSprite(`${m.sprite}:${f}`)).toBe(true);
    for (const n of ['peg', 'peg:bent', 'cup:4', 'cup:2']) expect(hasSprite(n)).toBe(true);
  });
});
