// Draws the casino floor from the sim each frame (CLAUDE.md "Rendering"): the street, the walls,
// the floor tiles, then tables, fixtures and gamblers sorted by their bottom edge so a gambler
// seated behind a table is half hidden by it, then the marquee out front. Gamblers interpolate
// between ticks with the loop's alpha.
import { TILE } from '../data/floor';
import { C, PALETTE } from '../data/palette';
import { TABLE_KINDS } from '../data/tables';
import { SUB } from '../sim/floor';
import { compile } from '../sim/odds/odds';
import type { Gambler, GameState, StaffMember, TableState } from '../sim/state';
import { dealerTile } from '../sim/staff';
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
  /** the gambler the owner clicked, or -1 */
  selectedAgent = -1;
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

/** The inspector watching a table turns toward its middle. */
function watchFacing(g: GameState, ins: NonNullable<GameState['inspector']>): Dir {
  const t = g.tables[ins.table];
  if (!t) return 'd';
  const k = TABLE_KINDS[t.kind];
  const cx = (t.x + k.w / 2) * TILE * SUB, cy = (t.y + k.h / 2) * TILE * SUB;
  const dx = cx - ins.x, dy = cy - ins.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u';
}

/** Where a staff member stands tonight (floor px, feet), or null when off the floor. */
function staffSpot(g: GameState, s: StaffMember, alpha: number): { x: number; y: number; dir: Dir; moving: boolean } | null {
  const c = (t: number) => t * TILE + TILE / 2;
  if (s.role === 'dealer') {
    if (s.table < 0) return null;
    const [x, y] = dealerTile(g.tables[s.table]);
    return { x: c(x), y: c(y) + 4, dir: 'r', moving: false };
  }
  if (s.role === 'pitBoss') {
    const ts = s.watch.map((i) => g.tables[i]).filter(Boolean);
    if (!ts.length) return null;
    // between the tables it watches, a little below them
    const mx = ts.reduce((n, t) => n + t.x + TABLE_KINDS[t.kind].w / 2, 0) / ts.length;
    const my = Math.max(...ts.map((t) => t.y + TABLE_KINDS[t.kind].h)) + 1.5;
    return { x: Math.round(mx * TILE), y: Math.round(my * TILE), dir: 'u', moving: false };
  }
  if (s.role === 'cashier') {
    const cage = g.floor.fixtures.find((f) => f.kind === 'cage');
    return cage ? { x: (cage.x + cage.w / 2) * TILE, y: cage.y * TILE + 14, dir: 'd', moving: false } : null;
  }
  const ix = s.px + (s.x - s.px) * alpha, iy = s.py + (s.y - s.py) * alpha;
  const dx = s.x - s.px, dy = s.y - s.py;
  const dir: Dir = dx || dy ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u') : 'd';
  return { x: Math.round(ix / SUB), y: Math.round(iy / SUB), dir, moving: !!(dx || dy) };
}

function drawStaff(ctx: CanvasRenderingContext2D, s: StaffMember, v: FloorView, at: { x: number; y: number; dir: Dir; moving: boolean }, rs: FloorRenderState) {
  const f = at.moving ? Math.floor(rs.time * 10 + s.id) % 4 : 0;
  rect(ctx, v.ox + at.x - 4, v.oy + at.y, 8, 1, C.umber);
  drawSprite(ctx, sprite(`staff:${s.role}:${at.dir}:${f}`), v.ox + at.x, v.oy + at.y);
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
  const seatedDown = a.phase === 'seated' && dir === 'd' ? 4 : 0;
  if (a.phase === 'seated') drawSprite(ctx, sprite(`gambler:${a.type}:sit:${dir}`), sx, sy + seatedDown);
  else {
    const moving = dx !== 0 || dy !== 0;
    const f = moving ? Math.floor(rs.time * 8 + a.id) % 4 : 0;
    drawSprite(ctx, sprite(`gambler:${a.type}:${dir}:${f}`), sx, sy);
  }
  // a cheat's one tell (STYLE.md rule 1): the slider's gold pinky ring, the past-poster's spare chip in the cuff
  if (a.cheat && dir !== 'u') px(ctx, sx + (a.cheat === 'slider' ? -5 : 4), sy - 7 + seatedDown + (a.phase === 'seated' ? 3 : 0), a.cheat === 'slider' ? C.gold : C.cyan);
  // where the owner's marks go, drawn on top of everything once the floor is down
  // (a gambler seated with their back to us has the table above them: their marks go under their feet)
  if (a.spotted || rs.selectedAgent === a.id)
    marks.push({ a, x: sx, top: sy - 21 + seatedDown + (a.phase === 'seated' ? 3 : 0), feet: sy, below: a.phase === 'seated' && dir === 'u' });
}

const marks: { a: Gambler; x: number; top: number; feet: number; below: boolean }[] = [];

/** Spotted cheats get a red '!', the gambler the owner clicked a gold chevron; both ink-outlined. */
function drawMarks(ctx: CanvasRenderingContext2D, rs: FloorRenderState) {
  for (const { a, x, top, feet, below } of marks) {
    if (below) {
      // a chevron pointing up at them, the '!' beside it
      const y = feet + 3;
      if (rs.selectedAgent === a.id) {
        rect(ctx, x - 2, y - 1, 5, 2, C.ink); rect(ctx, x - 3, y + 1, 7, 1, C.ink); rect(ctx, x - 4, y + 2, 9, 2, C.ink);
        px(ctx, x, y, C.gold); rect(ctx, x - 2, y + 1, 5, 1, C.gold); rect(ctx, x - 3, y + 2, 7, 1, C.gold);
      }
      if (a.spotted) drawText(ctx, '!', x + 6, y - 2, PALETTE[C.red], 1, PALETTE[C.ink]);
      continue;
    }
    let y = top - 1;
    if (rs.selectedAgent === a.id) {
      rect(ctx, x - 4, y - 5, 9, 2, C.ink); rect(ctx, x - 3, y - 3, 7, 1, C.ink); rect(ctx, x - 2, y - 2, 5, 2, C.ink);
      rect(ctx, x - 3, y - 4, 7, 1, C.gold); rect(ctx, x - 2, y - 3, 5, 1, C.gold); px(ctx, x, y - 2, C.gold);
      y -= 6;
    }
    if (a.spotted) drawText(ctx, '!', x - 1, y - 9, PALETTE[C.red], 1, PALETTE[C.ink]);
  }
  marks.length = 0;
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
  const ins = g.inspector;
  if (g.phase === 'night' && ins && ins.phase !== 'due' && ins.phase !== 'gone') {
    const ix = ins.px + (ins.x - ins.px) * alpha, iy = ins.py + (ins.y - ins.py) * alpha;
    const dx = ins.x - ins.px, dy = ins.y - ins.py;
    const moving = !!(dx || dy);
    // watching: face the table
    const dir: Dir = moving ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u') : ins.phase === 'watch' ? watchFacing(g, ins) : 'd';
    const at = { x: Math.round(ix / SUB), y: Math.round(iy / SUB) };
    items.push({ y: at.y, draw: () => {
      rect(ctx, v.ox + at.x - 4, v.oy + at.y, 8, 1, C.umber);
      drawSprite(ctx, sprite(`inspector:${dir}:${moving ? Math.floor(rs.time * 7) % 4 : 0}`), v.ox + at.x, v.oy + at.y);
    } });
  }
  if (g.phase === 'night') for (const s of g.staff) {
    const at = staffSpot(g, s, alpha);
    if (at) items.push({ y: at.y, draw: () => drawStaff(ctx, s, v, at, rs) });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  // wins float up from the table, in the font (STYLE.md readability rule 3)
  for (const f of rs.floats) {
    const yy = Math.round(f.y - f.age * 14);
    const tw = textWidth(f.text);
    drawText(ctx, f.text, Math.round(f.x - tw / 2), yy, PALETTE[f.color], 1, PALETTE[C.ink]);
  }
  // the owner's marks last: nothing on the floor covers a spotted cheat
  drawMarks(ctx, rs);
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
