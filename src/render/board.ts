// The board region, drawn from the sim every frame: the felt backboard, the frame and its
// shoulders, the drop rail, the pegs, the cups with their multipliers painted on, and the marbles
// interpolated with the loop's alpha. Integer positions only.
import { BOARD, cellCenter } from '../data/boards';
import { C, PALETTE } from '../data/palette';
import type { Marble } from '../sim/physics/marble';
import type { World } from '../sim/physics/world';
import { drawText, textWidth } from '../ui/font';
import { drawSprite, sprite } from './atlas';

/** Where board px (0, 0) lands on the screen: row 0 (the hopper) sits above the top edge. */
export interface BoardView { x: number; y: number }

const fill = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) => {
  ctx.fillStyle = PALETTE[c];
  ctx.fillRect(x, y, w, h);
};

export interface BoardDrawOpts {
  /** the column the next drop goes in (marked on the rail), or -1 */
  column: number;
  /** a column the mouse is over, or -1 */
  hover: number;
  /** body index -> frames left of a contact flash */
  flash?: Map<number, number>;
}

export function drawBoard(ctx: CanvasRenderingContext2D, world: World, v: BoardView, o: BoardDrawOpts) {
  const W = world.width, H = world.height, cell = BOARD.cell;
  // the frame: walnut either side, a dark lip on the inside
  fill(ctx, v.x - 8, 0, 8, 216, C.walnut);
  fill(ctx, v.x + W, 0, 8, 216, C.walnut);
  fill(ctx, v.x - 8, 0, 1, 216, C.clay);
  fill(ctx, v.x + W + 7, 0, 1, 216, C.umber);
  fill(ctx, v.x - 1, 0, 1, 216, C.umber);
  fill(ctx, v.x + W, 0, 1, 216, C.umber);
  // felt backboard, with a chalk dot at every cell corner (where parts snap)
  fill(ctx, v.x, v.y, W, H, C.feltDark);
  ctx.fillStyle = PALETTE[C.felt];
  for (let r = BOARD.railRow + 1; r < BOARD.cupRow; r++) for (let c = 1; c < BOARD.cols; c++) ctx.fillRect(v.x + c * cell, v.y + r * cell, 1, 1);

  // the rail: a brass bar with a notch per column; the drop column gets an ember arrow
  const ry = v.y + BOARD.railRow * cell;
  fill(ctx, v.x, ry, W, 3, C.copper);
  fill(ctx, v.x, ry, W, 1, C.brass);
  for (let c = 0; c < BOARD.cols; c++) fill(ctx, v.x + c * cell, ry + 1, 1, 2, C.umber);
  if (o.hover >= 0 && o.hover !== o.column) fill(ctx, v.x + o.hover * cell + 1, ry + 3, cell - 1, 2, C.sand);
  if (o.column >= 0) {
    const ax = v.x + o.column * cell;
    fill(ctx, ax + 1, ry + 3, 6, 1, C.ember);
    fill(ctx, ax + 2, ry + 4, 4, 1, C.ember);
    fill(ctx, ax + 3, ry + 5, 2, 1, C.ember);
  }

  // shoulders: a stepped wooden lip down each wall
  for (const r of world.board.shoulders) {
    const y = v.y + r * cell;
    for (let i = 0; i < cell; i++) {
      fill(ctx, v.x, y + i, i + 1, 1, C.walnut);
      fill(ctx, v.x + W - i - 1, y + i, i + 1, 1, C.walnut);
      fill(ctx, v.x + i, y + i, 1, 1, C.clay);
      fill(ctx, v.x + W - i - 1, y + i, 1, 1, C.clay);
    }
  }

  // pegs, with a one-frame brass flash where a marble just struck
  for (let i = 0; i < world.board.pegs.length; i++) {
    const p = world.board.pegs[i];
    const x = v.x + cellCenter(p.c), y = v.y + cellCenter(p.r);
    drawSprite(ctx, sprite('peg'), x, y);
    if (o.flash?.get(i)) fill(ctx, x - 1, y - 2, 2, 1, C.gold);
  }

  // cups: the sprite, then its multiplier painted on in the bitmap font (never hidden)
  const cy = v.y + BOARD.cupRow * cell;
  for (const cup of world.board.cups) {
    const x = v.x + cup.c * cell, w = cup.span * cell;
    drawSprite(ctx, sprite(cup.span >= 4 ? 'cup:4' : 'cup:2'), x, cy);
    const label = `x${cup.mult}`;
    const col = cup.mult === 0 ? C.steel : cup.mult >= 3 ? C.gold : C.chalk;
    drawText(ctx, label, x + Math.floor((w - textWidth(label)) / 2), cy + 4, PALETTE[col], 1, PALETTE[C.ink]);
  }
}

/** A marble at its interpolated position, its shine turning as it travels. */
export function drawMarble(ctx: CanvasRenderingContext2D, m: Marble, v: BoardView, alpha: number, spriteName = 'marble:steel') {
  const x = m.px + (m.x - m.px) * alpha, y = m.py + (m.y - m.py) * alpha;
  const frame = Math.floor(m.age / 5) % 4;
  drawSprite(ctx, sprite(`${spriteName}:${frame}`), Math.round(v.x + x), Math.round(v.y + y));
}
