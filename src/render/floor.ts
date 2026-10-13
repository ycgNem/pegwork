// Draws the casino floor from the sim each frame (CLAUDE.md "Rendering"): the street, the walls,
// the floor tiles, then tables, fixtures and gamblers sorted by their bottom edge so a gambler
// seated behind a table is half hidden by it, then the marquee out front. Gamblers interpolate
// between ticks with the loop's alpha.
import { TILE } from '../data/floor';
import { C, PALETTE } from '../data/palette';
import { TABLE_KINDS } from '../data/tables';
import { SUB } from '../sim/floor';
import { compile } from '../sim/odds/odds';
import type { Gambler, GameState, TableState } from '../sim/state';
import { drawSprite, hasImage, sprite } from './atlas';
import { px, rect } from './pixel';
import type { Dir } from './placeholders';
import { drawText, textWidth } from '../ui/font';

export interface FloorView {
  /** screen position of tile (0, 0)'s top-left */
  ox: number;
  oy: number;
}

export interface Floater { x: number; y: number; text: string; color: number; age: number }

/** Render-side memory: which way each gambler faces, when each wheel last spun. */
export class FloorRenderState {
  facing = new Map<number, Dir>();
  spinAt = new Map<number, number>();
  floats: Floater[] = [];
  time = 0;
}

const WALL = 8;

const fixtureSprite: Record<string, string> = { cage: 'fixture:cage', bar: 'fixture:bar', entrance: 'fixture:entrance' };

function seatFacing(t: TableState, seat: number): Dir {
  const [dx, dy] = TABLE_KINDS[t.kind].seats[seat];
  const k = TABLE_KINDS[t.kind];
  if (dy < 0) return 'd';
  if (dy >= k.h) return 'u';
  return dx < 0 ? 'r' : 'l';
}

/** Pips of one die face (1-6) in a 7x7 die at (x, y). */
function die(ctx: CanvasRenderingContext2D, x: number, y: number, face: number) {
  rect(ctx, x, y + 1, 7, 5, C.ink);
  rect(ctx, x + 1, y, 5, 7, C.ink);
  rect(ctx, x + 1, y + 1, 5, 5, C.white);
  const P: Record<number, [number, number][]> = {
    1: [[3, 3]], 2: [[1, 1], [5, 5]], 3: [[1, 1], [3, 3], [5, 5]], 4: [[1, 1], [5, 1], [1, 5], [5, 5]],
    5: [[1, 1], [5, 1], [3, 3], [1, 5], [5, 5]], 6: [[1, 1], [5, 1], [1, 3], [5, 3], [1, 5], [5, 5]],
  };
  for (const [a, b] of P[face] ?? []) px(ctx, x + a, y + b, face === 1 ? C.red : C.ink);
}

function drawTable(ctx: CanvasRenderingContext2D, g: GameState, t: TableState, v: FloorView, rs: FloorRenderState) {
  const x = v.ox + t.x * TILE, y = v.oy + t.y * TILE;
  const last = t.last[t.last.length - 1];
  if (t.kind === 'wheel') {
    const since = rs.time - (rs.spinAt.get(t.id) ?? -99);
    const spinning = since < 1.2;
    const frame = spinning ? Math.floor(rs.time * 24 * (1.3 - since)) % 8 : 0;
    drawSprite(ctx, sprite(`table:wheel:${(frame + 8) % 8}`), x, y);
    if (last && !spinning) {
      const a = (last.outcome / 24) * Math.PI * 2;
      px(ctx, Math.round(x + 16 + Math.cos(a) * 10), Math.round(y + 16 + Math.sin(a) * 10), C.white);
    }
  } else {
    drawSprite(ctx, sprite(t.kind === 'dice' ? 'table:dice' : 'table:drum'), x, y);
    if (t.kind === 'dice' && last) {
      const faces = compile(t.game).label(last.outcome).split('+').map(Number);
      faces.forEach((f, i) => die(ctx, x + 16 + i * 9, y + 13, f));
    }
  }
  if (!t.open) {
    rect(ctx, x + 2, y + 2, 10, 7, C.ink);
    drawText(ctx, 'X', x + 4, y + 1, PALETTE[C.red]);
  }
}

function drawGambler(ctx: CanvasRenderingContext2D, g: GameState, a: Gambler, v: FloorView, alpha: number, rs: FloorRenderState) {
  const ix = a.px + (a.x - a.px) * alpha, iy = a.py + (a.y - a.py) * alpha;
  const sx = Math.round(v.ox + ix / SUB), sy = Math.round(v.oy + iy / SUB);
  const dx = a.x - a.px, dy = a.y - a.py;
  let dir = rs.facing.get(a.id) ?? 'd';
  if (a.phase === 'seated') dir = seatFacing(g.tables[a.table], a.seat);
  else if (dx || dy) dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u';
  rs.facing.set(a.id, dir);
  // a soft shadow under the feet
  rect(ctx, sx - 4, sy, 8, 1, C.umber);
  if (a.phase === 'seated') drawSprite(ctx, sprite(`gambler:${a.type}:sit:${dir}`), sx, sy + (dir === 'd' ? 4 : 0));
  else {
    const moving = dx !== 0 || dy !== 0;
    const f = moving ? Math.floor(rs.time * 8 + a.id) % 4 : 0;
    drawSprite(ctx, sprite(`gambler:${a.type}:${dir}:${f}`), sx, sy);
  }
}

/** The street and the marquee out front: the neon sign over the door. */
function drawStreet(ctx: CanvasRenderingContext2D, g: GameState, v: FloorView, w: number, h: number, rs: FloorRenderState) {
  rect(ctx, 0, 0, w, h, C.ink);
  // a dark street with a sidewalk under the front wall
  const fy = v.oy + g.floor.h * TILE + WALL;
  rect(ctx, v.ox - WALL - 24, fy, g.floor.w * TILE + 2 * WALL + 48, 34, C.navy);
  for (let x = v.ox - WALL - 24; x < v.ox + g.floor.w * TILE + WALL + 24; x += 16) rect(ctx, x, fy, 1, 34, C.slate);
  neonSign(ctx, 'CARPET JOINT', v.ox + (g.floor.w * TILE) / 2, fy + 9, rs.time);
}

/**
 * Neon: a 1 px tube in the core color with a darker same-hue halo, lit by a slow flicker (STYLE.md:
 * no alpha blending). Uses the pixel-art-studio letters (`neon:<char>`) once their sheet loads,
 * the bitmap font at x2 until then.
 */
export function neonSign(ctx: CanvasRenderingContext2D, s: string, cx: number, y: number, time: number) {
  const flicker = Math.sin(time * 37) > 0.97;
  const core = flicker ? C.magenta : C.pink, halo = C.plum;
  if (hasImage('neon:C')) {
    const step = 13, wSign = s.length * step - 1;
    let x = Math.round(cx - wSign / 2);
    for (const ch of s) {
      if (ch !== ' ') drawSprite(ctx, sprite(`neon:${ch}${flicker ? ':dim' : ''}`), x, y);
      x += step;
    }
    return;
  }
  const tw = textWidth(s) * 2, x = Math.round(cx - tw / 2);
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(ctx, s, x + ox, y + oy, PALETTE[halo], 2);
  drawText(ctx, s, x, y, PALETTE[core], 2);
}

export function drawFloor(ctx: CanvasRenderingContext2D, g: GameState, v: FloorView, alpha: number, rs: FloorRenderState, screen: { w: number; h: number }) {
  const W = g.floor.w * TILE, H = g.floor.h * TILE;
  drawStreet(ctx, g, v, screen.w, screen.h, rs);
  // walls: dark wood paneling with a brass trim line, the door a gap in the front wall
  rect(ctx, v.ox - WALL, v.oy - WALL, W + 2 * WALL, H + 2 * WALL, C.umber);
  rect(ctx, v.ox - WALL, v.oy - WALL, W + 2 * WALL, 2, C.walnut);
  rect(ctx, v.ox - 2, v.oy - 2, W + 4, 1, C.copper);
  for (let j = 0; j < g.floor.h; j++)
    for (let i = 0; i < g.floor.w; i++) drawSprite(ctx, sprite(`floor:sawdust:${(i * 7 + j * 3 + ((i * j) % 5)) % 4}`), v.ox + i * TILE, v.oy + j * TILE);
  const [dx] = g.floor.door;
  rect(ctx, v.ox + dx * TILE, v.oy + H, 2 * TILE, WALL, C.clay);

  // y-sorted: tables and fixtures by bottom edge, gamblers by their feet
  const items: { y: number; draw: () => void }[] = [];
  for (const f of g.floor.fixtures) {
    const name = fixtureSprite[f.kind];
    items.push({ y: (f.kind === 'entrance' ? -1 : f.y + f.h) * TILE, draw: () => drawSprite(ctx, sprite(name), v.ox + f.x * TILE, v.oy + f.y * TILE) });
  }
  for (const t of g.tables) items.push({ y: (t.y + TABLE_KINDS[t.kind].h) * TILE - 1, draw: () => drawTable(ctx, g, t, v, rs) });
  for (const a of g.agents) {
    if (a.phase === 'gone') continue;
    items.push({ y: a.y / SUB, draw: () => drawGambler(ctx, g, a, v, alpha, rs) });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  // wins float up from the table, in the font (STYLE.md readability rule 3)
  for (const f of rs.floats) {
    const yy = Math.round(f.y - f.age * 14);
    const tw = textWidth(f.text);
    drawText(ctx, f.text, Math.round(f.x - tw / 2), yy, PALETTE[f.color], 1, PALETTE[C.ink]);
  }
}

/** Screen rect of a table (for clicks and outlines). */
export function tableRect(t: TableState, v: FloorView) {
  const k = TABLE_KINDS[t.kind];
  return { x: v.ox + t.x * TILE, y: v.oy + t.y * TILE, w: k.w * TILE, h: k.h * TILE };
}

export function outlineRect(ctx: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, c: number) {
  rect(ctx, r.x - 2, r.y - 2, r.w + 4, 1, c);
  rect(ctx, r.x - 2, r.y + r.h + 1, r.w + 4, 1, c);
  rect(ctx, r.x - 2, r.y - 2, 1, r.h + 4, c);
  rect(ctx, r.x + r.w + 1, r.y - 2, 1, r.h + 4, c);
}
