// One marble through a World: the fixed-step integrator and collision response (DESIGN.md §1).
// The live game and the Dry Run both move marbles with stepMarble and nothing else, so the Dry
// Run's histogram is the board's real distribution, not an approximation of it.
//
// Marbles never touch each other: each one's path depends only on the board and its own release,
// so the Dry Run of one marble is exactly what every live marble faces (DECISIONS.md #10).
import { PHYSICS, RAIL_TAP } from '../../data/materials';
import type { MarbleDef } from '../../data/marbles';
import { cellCenter, BOARD } from '../../data/boards';
import { streamNext } from '../rng';
import { qpos, qvel } from './fixed';
import { CIRCLE, cupAt, type World } from './world';

export type MarbleState = 'falling' | 'landed' | 'jammed';

export interface Marble {
  id: number;
  def: MarbleDef['id'];
  /** released above this column */
  column: number;
  /** stake in cents */
  stake: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** position at the start of the current tick (the renderer interpolates from it) */
  px: number;
  py: number;
  r: number;
  restitutionMod: number;
  /** the marble's own random stream (the rail tap's direction) */
  rs: number;
  /** ticks in play */
  age: number;
  /** consecutive ticks below the rail tap's speed */
  still: number;
  /** rail taps it needed (a board that needs them has a pocket a marble can rest in) */
  taps: number;
  state: MarbleState;
  /** cup index once landed, else -1 */
  cup: number;
  /** product of the tags picked up on the way (Milestone 1: bumpers and spinners) */
  tags: number;
  /** bodies touched in the last sub-step: a new contact is one not in this list */
  touch: number[];
}

/** Called for each new contact: the body index and the marble's speed into it (px/s). */
export type ContactSink = (body: number, speed: number) => void;

const DT = 1 / (PHYSICS.tickHz * PHYSICS.subSteps);
const G_DT = PHYSICS.gravity * DT;
const VMAX2 = PHYSICS.terminalSpeed * PHYSICS.terminalSpeed;

/**
 * A marble released above `column`, jittered by up to ±1 px with `u` in [0, 1) (DESIGN.md §1:
 * skill chooses the column; luck is the pixel), never within 1/16 px of dead center. `seed`
 * starts the marble's own stream.
 */
export function spawnMarble(world: World, def: MarbleDef, id: number, column: number, u: number, seed: number, stake: number): Marble {
  // u in [0, 1) -> a jitter in ±[min, 1] px: anywhere within a pixel of center, never dead on it
  const r = u * 2 - 1, min = PHYSICS.dropJitterMin / PHYSICS.dropJitter;
  const jitter = (r < 0 ? -1 : 1) * (min + Math.abs(r) * (1 - min)) * PHYSICS.dropJitter;
  const x = qpos(cellCenter(Math.max(0, Math.min(BOARD.cols - 1, column))) + jitter);
  const y = world.releaseY;
  return {
    id, def: def.id, column, stake, x, y, vx: 0, vy: 0, px: x, py: y, r: PHYSICS.marbleRadius,
    restitutionMod: def.restitutionMod, rs: seed >>> 0, age: 0, still: 0, taps: 0, state: 'falling', cup: -1, tags: 1, touch: [],
  };
}

/** Advance one marble by one tick (4 sub-steps). Returns its state afterwards. */
export function stepMarble(world: World, m: Marble, onContact?: ContactSink): MarbleState {
  if (m.state !== 'falling') return m.state;
  m.px = m.x;
  m.py = m.y;
  const bodies = world.bodies, cells = world.cells, cols = BOARD.cols, rows = BOARD.rows, cell = BOARD.cell;
  for (let s = 0; s < PHYSICS.subSteps; s++) {
    let vx = m.vx, vy = m.vy + G_DT;
    const v2 = vx * vx + vy * vy;
    if (v2 > VMAX2) {
      const k = PHYSICS.terminalSpeed / Math.sqrt(v2);
      vx *= k;
      vy *= k;
    }
    let x = m.x + vx * DT, y = m.y + vy * DT;

    const cc = Math.max(0, Math.min(cols - 1, Math.floor(x / cell)));
    const cr = Math.max(0, Math.min(rows - 1, Math.floor(y / cell)));
    const list = cells[cr * cols + cc];
    const prevTouch = m.touch;
    let touch: number[] | null = null;
    for (let i = 0; i < list.length; i++) {
      const bi = list[i], b = bodies[bi];
      // the closest point on the body to the marble's center
      let qx = b.x0, qy = b.y0;
      if (b.kind !== CIRCLE) {
        const ex = b.x1 - b.x0, ey = b.y1 - b.y0;
        let t = ((x - b.x0) * ex + (y - b.y0) * ey) / (ex * ex + ey * ey);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        qx = b.x0 + t * ex;
        qy = b.y0 + t * ey;
      }
      const dx = x - qx, dy = y - qy;
      const R = m.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= R * R) continue;
      const d = Math.sqrt(d2);
      const nx = d > 0 ? dx / d : 0, ny = d > 0 ? dy / d : -1;
      // out of the body along the normal
      x += nx * (R - d);
      y += ny * (R - d);
      (touch ??= []).push(bi);
      const vn = vx * nx + vy * ny;
      if (vn >= 0) continue;
      // bounce: keep restitution of the normal speed, lose friction of the tangential
      const e = Math.min(1, b.restitution * m.restitutionMod);
      const vt = -vx * ny + vy * nx;
      const vn2 = -e * vn, vt2 = vt * (1 - b.friction);
      vx = vn2 * nx - vt2 * ny;
      vy = vn2 * ny + vt2 * nx;
      if (onContact && prevTouch.indexOf(bi) < 0) onContact(bi, -vn);
    }
    m.touch = touch ?? NO_TOUCH;
    m.x = qpos(x);
    m.y = qpos(y);
    m.vx = qvel(vx);
    m.vy = qvel(vy);
    if (m.y >= world.landY) {
      m.state = 'landed';
      m.cup = cupAt(world, m.x);
      return m.state;
    }
  }
  m.age++;
  if (m.vx * m.vx + m.vy * m.vy < RAIL_TAP.stillSpeed * RAIL_TAP.stillSpeed) {
    if (++m.still >= RAIL_TAP.stillTicks) {
      const [u, rs] = streamNext(m.rs);
      m.rs = rs;
      m.vx = qvel(m.vx + (u < 0.5 ? -1 : 1) * RAIL_TAP.tapSpeed);
      m.still = 0;
      m.taps++;
    }
  } else m.still = 0;
  if (m.age >= RAIL_TAP.jamTicks) m.state = 'jammed';
  return m.state;
}

const NO_TOUCH: number[] = [];
