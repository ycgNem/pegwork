// Code-drawn placeholder sprites at their final names and sizes (STYLE.md). A sheet from the art
// pipeline (src/art/*.png) with the same name replaces each one as soon as it loads. Even as
// placeholders they keep the readability rules: a bent peg is visibly off-center.
import { C } from '../data/palette';
import { defSprite } from './atlas';
import { px, rect } from './pixel';

/** Steel, 6x6, four frames of a shine sliding round the upper left (anchor at its center). */
function steelFrame(f: number) {
  return {
    w: 6, h: 6, ox: 3, oy: 3,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 1, 0, 4, 6, C.steelDark);
      rect(ctx, 0, 1, 6, 4, C.steelDark);
      rect(ctx, 1, 1, 4, 4, C.steel);
      rect(ctx, 1, 1, 3, 2, C.steelLight);
      const shine: [number, number][] = [[1, 1], [2, 1], [1, 2], [2, 2]];
      px(ctx, shine[f][0], shine[f][1], C.white);
    },
  };
}

/** A brass peg in its 8x8 cell; bent: shoved a pixel down-right and dulled. */
function peg(bent: boolean) {
  return {
    w: 8, h: 8, ox: 4, oy: 4,
    draw: (ctx: CanvasRenderingContext2D) => {
      const o = bent ? 1 : 0;
      // a 6 px disc on pixels 1..6 is centered on the cell's center line
      rect(ctx, 2 + o, 1 + o, 4, 6, C.umber);
      rect(ctx, 1 + o, 2 + o, 6, 4, C.umber);
      rect(ctx, 2 + o, 2 + o, 4, 4, bent ? C.copper : C.brass);
      px(ctx, 3 + o, 3 + o, bent ? C.sand : C.gold);
      if (bent) px(ctx, 5 + o, 5 + o, C.rust);
    },
  };
}

/** A tin cup `w` px wide and 16 tall; the multiplier is painted on at draw time (never baked in). */
function cup(w: number) {
  return {
    w, h: 16, ox: 0, oy: 0,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 0, 0, w, 16, C.ink);
      rect(ctx, 1, 0, w - 2, 15, C.steelDark);
      rect(ctx, 2, 0, w - 4, 14, C.slate);
      rect(ctx, 1, 0, 1, 15, C.steel);
      rect(ctx, 2, 13, w - 4, 1, C.navy);
    },
  };
}

export function definePlaceholders() {
  for (let f = 0; f < 4; f++) defSprite(`marble:steel:${f}`, steelFrame(f));
  defSprite('peg', peg(false));
  defSprite('peg:bent', peg(true));
  defSprite('cup:4', cup(32));
  defSprite('cup:2', cup(16));
}
