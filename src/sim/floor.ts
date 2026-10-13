// The floor grid: which tiles are walkable, where seats are, and flow fields for walking
// (DESIGN.md §1). A flow field is the step distance from every tile to one target, by
// breadth-first search; an agent steps to the neighbor one closer. Fields depend only on the floor
// (its version) and the target, so they're cached outside the state and never hashed.
import { TILE } from '../data/floor';
import { TABLE_KINDS } from '../data/tables';
import type { GameState, TableState } from './state';

/** 1/16 px per tile */
export const SUB = 16;
export const TILE_SUB = TILE * SUB;

/** The center of a tile, in 1/16 px. */
export const center = (t: number) => t * TILE_SUB + TILE_SUB / 2;
export const tileOf = (v: number) => Math.floor(v / TILE_SUB);

export function seatTile(t: TableState, seat: number): [number, number] {
  const [dx, dy] = TABLE_KINDS[t.kind].seats[seat];
  return [t.x + dx, t.y + dy];
}

/** 1 = blocked. Tables, the cage and the bar block; the entrance and seats don't. */
export function blockedGrid(g: GameState): Uint8Array {
  const { w, h } = g.floor;
  const b = new Uint8Array(w * h);
  const mark = (x: number, y: number, ww: number, hh: number) => {
    for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (i >= 0 && j >= 0 && i < w && j < h) b[j * w + i] = 1;
  };
  for (const f of g.floor.fixtures) if (f.kind !== 'entrance') mark(f.x, f.y, f.w, f.h);
  for (const t of g.tables) mark(t.x, t.y, TABLE_KINDS[t.kind].w, TABLE_KINDS[t.kind].h);
  return b;
}

interface FieldCache { version: number; grid: Uint8Array; fields: Map<number, Int16Array> }
const caches = new WeakMap<GameState['floor'], FieldCache>();

/** Step distance to (tx, ty) from every tile; -1 where unreachable. */
export function flowField(g: GameState, tx: number, ty: number): Int16Array {
  let c = caches.get(g.floor);
  if (!c || c.version !== g.floor.version) {
    c = { version: g.floor.version, grid: blockedGrid(g), fields: new Map() };
    caches.set(g.floor, c);
  }
  const key = ty * g.floor.w + tx;
  let f = c.fields.get(key);
  if (f) return f;
  const grid = c.grid;
  const { w, h } = g.floor;
  f = new Int16Array(w * h).fill(-1);
  const q = [ty * w + tx];
  f[q[0]] = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], x = i % w, y = (i - x) / w;
    // fixed neighbor order: north, west, east, south (determinism)
    for (const [nx, ny] of [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (f[n] >= 0 || grid[n]) continue;
      f[n] = f[i] + 1;
      q.push(n);
    }
  }
  c.fields.set(key, f);
  return f;
}

/** The neighbor tile one step closer to the field's target, or null when already there / stuck. */
export function nextStep(g: GameState, f: Int16Array, x: number, y: number): [number, number] | null {
  const w = g.floor.w, d = f[y * w + x];
  if (d <= 0) return null;
  for (const [nx, ny] of [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]]) {
    if (nx < 0 || ny < 0 || nx >= w || ny >= g.floor.h) continue;
    if (f[ny * w + nx] === d - 1) return [nx, ny];
  }
  return null;
}

/** Manhattan walk in tiles (for the choice formula's walk cost). */
export const walkTiles = (f: Int16Array, w: number, x: number, y: number) => f[y * w + x];

/** Anything that walks the floor: a position and a target tile, 1/16 px. */
export interface Mover { x: number; y: number; tx: number; ty: number }

const toward = (v: number, goal: number, step: number) => (v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step));

/** Move one tick along the flow field toward (tx, ty); true when standing on its center. */
export function walkTo(g: GameState, a: Mover, speed: number): boolean {
  const cx = tileOf(a.x), cy = tileOf(a.y);
  const gx = center(a.tx), gy = center(a.ty);
  if (cx === a.tx && cy === a.ty) {
    a.x = toward(a.x, gx, speed);
    a.y = toward(a.y, gy, speed);
    return a.x === gx && a.y === gy;
  }
  const f = flowField(g, a.tx, a.ty);
  const next = nextStep(g, f, cx, cy);
  if (!next) {
    // off the field (the floor changed under them): step straight there
    a.x = gx;
    a.y = gy;
    return true;
  }
  const [nx, ny] = next;
  // axis-aligned: line up on the current tile's center across the direction of travel first
  if (nx !== cx) {
    if (a.y !== center(cy)) a.y = toward(a.y, center(cy), speed);
    else a.x = toward(a.x, center(nx), speed);
  } else {
    if (a.x !== center(cx)) a.x = toward(a.x, center(cx), speed);
    else a.y = toward(a.y, center(ny), speed);
  }
  return false;
}
