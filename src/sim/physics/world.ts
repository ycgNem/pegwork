// A board turned into static collision bodies: pegs are circles; the frame, the ceiling, the cup
// dividers and the cup floor are segments. Bodies are bucketed into the board's 8 px cells
// (each body in every cell within reach of a marble touching it), so a marble only tests the
// bodies listed in its own cell.
import { BOARD, cellCenter, type BoardDef } from '../../data/boards';
import { MATERIALS, PHYSICS, type MaterialId } from '../../data/materials';

export const CIRCLE = 0;
export const SEGMENT = 1;

export interface Body {
  kind: typeof CIRCLE | typeof SEGMENT;
  /** circle center, or segment start */
  x0: number;
  y0: number;
  /** segment end (equal to the start for a circle) */
  x1: number;
  y1: number;
  /** circle radius (0 for a segment) */
  r: number;
  mat: MaterialId;
  restitution: number;
  friction: number;
  /** what it is on the board: a peg index, or -1 for the frame and cups */
  part: number;
}

export interface CupSpan { x0: number; x1: number; mult: number }

export interface World {
  board: BoardDef;
  width: number;
  height: number;
  bodies: Body[];
  /** body indices per cell, row-major, ascending */
  cells: number[][];
  cups: CupSpan[];
  /** a marble whose center passes this line is in a cup */
  landY: number;
  /** where marbles release */
  releaseY: number;
}

const W = BOARD.cols * BOARD.cell;
const H = BOARD.rows * BOARD.cell;
const CUP_TOP = BOARD.cupRow * BOARD.cell;

function circle(x: number, y: number, r: number, mat: MaterialId, part: number): Body {
  const m = MATERIALS[mat];
  return { kind: CIRCLE, x0: x, y0: y, x1: x, y1: y, r, mat, restitution: m.restitution, friction: m.friction, part };
}

function segment(x0: number, y0: number, x1: number, y1: number, mat: MaterialId): Body {
  const m = MATERIALS[mat];
  return { kind: SEGMENT, x0, y0, x1, y1, r: 0, mat, restitution: m.restitution, friction: m.friction, part: -1 };
}

const cache = new WeakMap<BoardDef, World>();

/** The collision world for a board (cached per board object: edit a board by making a new one). */
export function buildWorld(board: BoardDef): World {
  const hit = cache.get(board);
  if (hit) return hit;
  const bodies: Body[] = [];
  board.pegs.forEach((p, i) => bodies.push(circle(cellCenter(p.c), cellCenter(p.r), PHYSICS.pegRadius, 'peg', i)));
  // the frame: two walls and a ceiling over the hopper
  bodies.push(segment(0, 0, 0, H, 'wall'));
  bodies.push(segment(W, 0, W, H, 'wall'));
  bodies.push(segment(0, 0, W, 0, 'wall'));
  // the shoulders: a lip from each wall one cell in and one cell down
  for (const r of board.shoulders) {
    const y = r * BOARD.cell;
    bodies.push(segment(0, y, BOARD.cell, y + BOARD.cell, 'wall'));
    bodies.push(segment(W, y, W - BOARD.cell, y + BOARD.cell, 'wall'));
  }
  // the cups: a divider between each pair and a floor under them all
  for (const cup of board.cups.slice(1)) bodies.push(segment(cup.c * BOARD.cell, CUP_TOP, cup.c * BOARD.cell, H, 'cupWall'));
  bodies.push(segment(0, H, W, H, 'cupWall'));

  // bucket: a body goes in every cell its reach (its extent plus a marble and a sub-step) touches
  const reach = PHYSICS.marbleRadius + 2;
  const cells: number[][] = Array.from({ length: BOARD.cols * BOARD.rows }, () => []);
  bodies.forEach((b, i) => {
    const x0 = Math.min(b.x0, b.x1) - b.r - reach, x1 = Math.max(b.x0, b.x1) + b.r + reach;
    const y0 = Math.min(b.y0, b.y1) - b.r - reach, y1 = Math.max(b.y0, b.y1) + b.r + reach;
    const c0 = Math.max(0, Math.floor(x0 / BOARD.cell)), c1 = Math.min(BOARD.cols - 1, Math.floor(x1 / BOARD.cell));
    const r0 = Math.max(0, Math.floor(y0 / BOARD.cell)), r1 = Math.min(BOARD.rows - 1, Math.floor(y1 / BOARD.cell));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells[r * BOARD.cols + c].push(i);
  });

  const world: World = {
    board,
    width: W,
    height: H,
    bodies,
    cells,
    cups: board.cups.map((c) => ({ x0: c.c * BOARD.cell, x1: (c.c + c.span) * BOARD.cell, mult: c.mult })),
    landY: CUP_TOP + PHYSICS.marbleRadius + 1,
    releaseY: BOARD.cell / 2,
  };
  cache.set(board, world);
  return world;
}

/** The cup under board x (cups span the full width). */
export function cupAt(world: World, x: number): number {
  for (let i = 0; i < world.cups.length; i++) if (x < world.cups[i].x1) return i;
  return world.cups.length - 1;
}
