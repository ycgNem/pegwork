// Gaffs and Heat helpers (DESIGN.md §8): shaving a table's dice, the raid, the license, and where
// the inspector stands. Pure; the heat system and the commands call these.
import { HEAT, SHAVE, type Gaff } from '../data/heat';
import { TABLE_KINDS } from '../data/tables';
import type { GameDef } from '../data/games';
import { closeTable } from './choice';
import { blockedGrid, seatTile } from './floor';
import type { GameState, TableState } from './state';

/** A die's face weights for a shave (or undefined: fair). */
export function shavedWeights(faces: number, gaff: Gaff | null): number[] | undefined {
  if (!gaff) return undefined;
  const half = Math.floor(faces / 2);
  return Array.from({ length: faces }, (_, i) => SHAVE.base + ((gaff.side === 'low' ? i < half : i >= faces - half) ? gaff.strength : 0));
}

/** The table's game with its dice shaved (or made fair again); a new GameDef, so caches refresh. */
export function withGaff(game: GameDef, gaff: Gaff | null): GameDef {
  const r = game.randomizer;
  if (r.kind !== 'dice') return game;
  return { ...game, randomizer: { ...r, weights: shavedWeights(r.faces, gaff) } };
}

export function setGaff(t: TableState, gaff: Gaff | null) {
  t.gaff = gaff;
  t.game = withGaff(t.game, gaff);
}

/**
 * Heat goes up (DESIGN.md §8). Crossing 75 brings the raid at once: a fine of a quarter of the
 * cage, every gaff confiscated, the gaffed tables shut for the rest of tonight and tomorrow
 * night. 100 ends the run.
 */
export function addHeat(g: GameState, n: number) {
  const before = g.heat;
  g.heat = Math.min(HEAT.licenseAt, g.heat + n);
  if (g.heat >= HEAT.licenseAt) {
    if (g.result === 'playing') {
      g.result = 'lost';
      g.lostReason = 'The Gaming Commission pulled the license.';
      g.now.push({ t: 'seasonOver', result: 'lost', reason: g.lostReason });
    }
    return;
  }
  if (before < HEAT.raidAt && g.heat >= HEAT.raidAt) raid(g);
}

function raid(g: GameState) {
  const fine = Math.floor((Math.max(0, g.cage) * HEAT.raidFine) / 1000);
  g.cage -= fine;
  g.fines += fine;
  const shut: number[] = [];
  for (const t of g.tables) {
    if (!t.gaff) continue;
    setGaff(t, null);
    // shut now, and tomorrow night
    t.shutNight = g.night + 1;
    if (g.phase === 'night') closeTable(g, t.id);
    shut.push(t.id);
  }
  g.now.push({ t: 'raid', fine, tables: shut });
}

/** Is the table shut by a raid on this night? */
export const isShut = (g: GameState, t: TableState) => t.shutNight >= g.night;

/** A walkable tile beside a table, not a seat: where the inspector stands to watch it. */
export function watchTile(g: GameState, t: TableState): [number, number] {
  const k = TABLE_KINDS[t.kind];
  const grid = blockedGrid(g);
  const seats = new Set(k.seats.map((_, i) => seatTile(t, i).join(',')));
  const ring: [number, number][] = [];
  for (let x = t.x - 1; x <= t.x + k.w; x++) ring.push([x, t.y + k.h + 1], [x, t.y + k.h]);
  for (let y = t.y + k.h; y >= t.y - 1; y--) ring.push([t.x + k.w, y], [t.x - 1, y]);
  for (const [x, y] of ring) {
    if (x < 0 || y < 0 || x >= g.floor.w || y >= g.floor.h) continue;
    if (grid[y * g.floor.w + x] || seats.has(`${x},${y}`)) continue;
    return [x, y];
  }
  return [...g.floor.door];
}
