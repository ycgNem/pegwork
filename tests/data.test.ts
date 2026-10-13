// Data validation (CLAUDE.md): every number in src/data carries a derivation naming a DESIGN.md
// section that exists; the starter games match the table DESIGN.md prints; the floor is sound.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as economy from '../src/data/economy';
import * as floor from '../src/data/floor';
import * as gamblers from '../src/data/gamblers';
import * as games from '../src/data/games';
import * as tables from '../src/data/tables';
import * as time from '../src/data/time';
import { Game } from '../src/sim/Game';
import { blockedGrid, flowField, seatTile } from '../src/sim/floor';
import { betOdds } from '../src/sim/odds/odds';
import { WOM } from '../src/sim/systems/reputation';
import { hasSprite } from '../src/render/atlas';
import { definePlaceholders, spriteNames } from '../src/render/placeholders';

const design = fs.readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8');
const SECTIONS = new Set([...design.matchAll(/^## (\d+)\./gm)].map((m) => m[1]));

/** Walk a data value: every object holding a number must carry (or inherit) a derivation. */
function check(path: string, v: unknown, derivation: string | null, problems: string[]) {
  if (v === null || typeof v !== 'object') return;
  const own = (v as any).derivation;
  const d = typeof own === 'string' ? own : derivation;
  if (typeof own === 'string') {
    const refs = [...own.matchAll(/§(\d+)/g)].map((m) => m[1]);
    if (!own.includes('DESIGN.md') || !refs.length) problems.push(`${path}: derivation names no DESIGN.md section: "${own}"`);
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
    const mods = { economy, floor, gamblers, games, tables, time, reputation: { WOM } };
    for (const [file, mod] of Object.entries(mods))
      for (const [name, v] of Object.entries(mod)) if (typeof v === 'object') check(`${file}.${name}`, v, null, problems);
    expect(problems).toEqual([]);
  });

  it('DESIGN.md §2 prints the starter games\' real edges', () => {
    const pct = (g: games.GameDef, id: string) => (betOdds(g, g.bets.findIndex((b) => b.id === id)).edge * 100).toFixed(1) + '%';
    const { hiLo, redWheel, luckyDrum } = games.STARTER_GAMES;
    for (const [g, id] of [[hiLo, 'high'], [hiLo, 'seven'], [hiLo, 'doubles'], [redWheel, 'red'], [redWheel, 'pocket'], [luckyDrum, 'pick1'], [luckyDrum, 'pick3']] as const) {
      const row = design.split(/\r?\n/).find((l) => l.startsWith(`| ${g.name} |`) && l.includes(` ${pct(g, id)} `));
      expect(row, `${g.name} ${id} at ${pct(g, id)}`).toBeTruthy();
    }
  });

  it('every table kind has as many seat tiles as seats, all outside its footprint', () => {
    for (const k of Object.values(tables.TABLE_KINDS)) {
      const keys = new Set(k.seats.map(([x, y]) => `${x},${y}`));
      expect(keys.size).toBe(k.seats.length);
      for (const [x, y] of k.seats) expect(x >= 0 && x < k.w && y >= 0 && y < k.h).toBe(false);
    }
  });

  it('the sawdust joint: every seat is walkable and reachable from the door', () => {
    const g = new Game({ seed: 1 }).s;
    const blocked = blockedGrid(g);
    const f = flowField(g, g.floor.door[0], g.floor.door[1]);
    for (const t of g.tables)
      t.seats.forEach((_, i) => {
        const [x, y] = seatTile(t, i);
        expect(x >= 0 && y >= 0 && x < g.floor.w && y < g.floor.h).toBe(true);
        expect(blocked[y * g.floor.w + x]).toBe(0);
        expect(f[y * g.floor.w + x]).toBeGreaterThan(0);
      });
  });

  it('every sprite name the game asks for exists (a placeholder until the art pass, STYLE.md)', () => {
    definePlaceholders();
    const art = fs.readdirSync(new URL('../src/art/', import.meta.url)).filter((f) => f.endsWith('.json'));
    const fromSheets = new Set(art.flatMap((f) => JSON.parse(fs.readFileSync(new URL(`../src/art/${f}`, import.meta.url), 'utf8')).frames.map((fr: { filename: string }) => fr.filename)));
    for (const n of spriteNames()) expect(hasSprite(n) || fromSheets.has(n), n).toBe(true);
    for (const ch of 'CARPETJOIN') expect(fromSheets.has(`neon:${ch}`) && fromSheets.has(`neon:${ch}:dim`), ch).toBe(true);
  });
});
