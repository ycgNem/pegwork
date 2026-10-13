// Code-drawn placeholder sprites at their final names and sizes (STYLE.md). A sheet from the art
// pipeline (src/art/*.png) with the same name replaces each one as soon as it loads. Even as
// placeholders they keep the readability rules: each gambler type has its own silhouette and colors.
import { C } from '../data/palette';
import type { GamblerType } from '../data/gamblers';
import { defSprite } from './atlas';
import { disc, ellipse, px, rect } from './pixel';

export type Dir = 'd' | 'u' | 'l' | 'r';
export const DIRS: Dir[] = ['d', 'u', 'l', 'r'];

interface Look { skin: number; hair: number; shirt: number; trim: number; legs: number; hat?: number }
const LOOKS: Record<GamblerType, Look> = {
  tourist: { skin: C.peach, hair: C.walnut, shirt: C.pink, trim: C.cyan, legs: C.sand },
  local: { skin: C.tan, hair: C.umber, shirt: C.slate, trim: C.steel, legs: C.steelDark, hat: C.navy },
  conventioneer: { skin: C.peach, hair: C.ink, shirt: C.white, trim: C.navy, legs: C.navy },
  highRoller: { skin: C.tan, hair: C.ink, shirt: C.white, trim: C.gold, legs: C.white },
};

/** A 12x20 gambler with the feet at (6, 19). `walk` is the leg frame (0-3); `sit` hides the legs. */
function gambler(type: GamblerType, dir: Dir, walk: number, sit: boolean) {
  const L = LOOKS[type];
  return {
    w: 12, h: 20, ox: 6, oy: 19,
    draw: (ctx: CanvasRenderingContext2D) => {
      const y0 = sit ? 3 : 0;
      // legs
      if (!sit) {
        const swing = walk === 1 ? 1 : walk === 3 ? -1 : 0;
        rect(ctx, 3, 14, 6, 5, C.ink);
        rect(ctx, 4, 14, 2, 4 + (swing > 0 ? 0 : 1), L.legs);
        rect(ctx, 6, 14, 2, 4 + (swing < 0 ? 0 : 1), L.legs);
      } else {
        rect(ctx, 3, 15, 6, 2, C.ink);
        rect(ctx, 4, 15, 4, 1, L.legs);
      }
      // torso
      rect(ctx, 2, 7 + y0, 8, 8, C.ink);
      rect(ctx, 3, 8 + y0, 6, 6, L.shirt);
      if (type === 'tourist') { px(ctx, 4, 9 + y0, L.trim); px(ctx, 7, 11 + y0, L.trim); px(ctx, 5, 12 + y0, C.gold); }
      if (type === 'conventioneer' && dir !== 'u') { rect(ctx, 5, 8 + y0, 2, 5, L.trim); px(ctx, 3, 9 + y0, C.red); }
      if (type === 'highRoller' && dir !== 'u') { rect(ctx, 5, 8 + y0, 2, 4, C.ink); px(ctx, 5, 9 + y0, L.trim); px(ctx, 6, 10 + y0, L.trim); }
      if (type === 'local' && dir !== 'u') rect(ctx, 3, 13 + y0, 6, 1, L.trim);
      // arms
      rect(ctx, 1, 8 + y0, 2, 5, C.ink);
      rect(ctx, 9, 8 + y0, 2, 5, C.ink);
      px(ctx, 1, 12 + y0, L.skin);
      px(ctx, 10, 12 + y0, L.skin);
      // head
      rect(ctx, 3, 1 + y0, 6, 7, C.ink);
      rect(ctx, 4, 2 + y0, 4, 5, L.skin);
      rect(ctx, 4, 1 + y0, 4, 2, L.hair);
      if (dir === 'u') rect(ctx, 4, 2 + y0, 4, 4, L.hair);
      else if (dir === 'd') { px(ctx, 5, 4 + y0, C.ink); px(ctx, 7, 4 + y0, C.ink); }
      else { const e = dir === 'l' ? 4 : 7; px(ctx, e, 4 + y0, C.ink); rect(ctx, dir === 'l' ? 7 : 4, 2 + y0, 1, 3, L.hair); }
      if (L.hat !== undefined) { rect(ctx, 3, 0 + y0, 6, 2, L.hat); if (dir !== 'u') rect(ctx, dir === 'r' ? 6 : dir === 'l' ? 2 : 3, 2 + y0, dir === 'd' ? 6 : 4, 1, L.hat); }
      if (type === 'tourist' && dir === 'd') rect(ctx, 4, 13 + y0, 3, 2, C.ink); // the camera
    },
  };
}

/** Sawdust floor planks, 16x16, four variants so the floor doesn't tile visibly. */
function sawdust(v: number) {
  return {
    w: 16, h: 16,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 0, 0, 16, 16, C.clay);
      for (let y = 0; y < 16; y += 4) rect(ctx, 0, y + 3, 16, 1, C.walnut);
      rect(ctx, (v * 5) % 16, 0, 1, 3, C.walnut);
      rect(ctx, (v * 9 + 7) % 16, 4, 1, 3, C.walnut);
      rect(ctx, (v * 3 + 11) % 16, 8, 1, 3, C.walnut);
      rect(ctx, (v * 7 + 2) % 16, 12, 1, 3, C.walnut);
      const specks = [[2, 1], [11, 6], [6, 10], [13, 14], [8, 2], [3, 13]];
      for (let i = 0; i < 3; i++) { const [x, y] = specks[(i * 2 + v) % specks.length]; px(ctx, x, y, C.tan); }
    },
  };
}

/** Felt with a wooden rail: the common body of the dice table and the drum's stand. */
function railTable(ctx: CanvasRenderingContext2D, w: number, h: number) {
  rect(ctx, 1, 0, w - 2, h, C.ink);
  rect(ctx, 0, 1, w, h - 2, C.ink);
  rect(ctx, 1, 1, w - 2, h - 2, C.walnut);
  rect(ctx, 2, 1, w - 4, 1, C.clay);
  rect(ctx, 3, 3, w - 6, h - 7, C.felt);
  rect(ctx, 3, 3, w - 6, 1, C.moss);
  rect(ctx, 1, h - 3, w - 2, 1, C.umber);
}

function diceTable() {
  return {
    w: 48, h: 32,
    draw: (ctx: CanvasRenderingContext2D) => {
      railTable(ctx, 48, 32);
      // chalk: the HI and LO boxes either side, the seven in the middle
      rect(ctx, 6, 6, 12, 16, C.feltDark);
      rect(ctx, 30, 6, 12, 16, C.feltDark);
      rect(ctx, 7, 7, 10, 14, C.felt);
      rect(ctx, 31, 7, 10, 14, C.felt);
      rect(ctx, 20, 12, 8, 1, C.chalk);
      rect(ctx, 23, 9, 2, 1, C.chalk);
    },
  };
}

/** A wheel of 24 pockets seen from above; frame f turns it 1/8 of a pocket pair. */
function wheel(f: number) {
  return {
    w: 32, h: 32,
    draw: (ctx: CanvasRenderingContext2D) => {
      disc(ctx, 16, 16, 15, C.ink);
      disc(ctx, 16, 16, 14, C.walnut);
      disc(ctx, 16, 16, 12, C.umber);
      for (let k = 0; k < 24; k++) {
        const a = ((k + f / 8) / 24) * Math.PI * 2;
        const col = k === 0 || k === 12 ? C.gold : (k % 2) === (k < 12 ? 1 : 0) ? C.red : C.ink;
        for (let r = 8; r <= 11; r++) px(ctx, Math.round(16 + Math.cos(a) * r), Math.round(16 + Math.sin(a) * r), col);
      }
      disc(ctx, 16, 16, 6, C.walnut);
      disc(ctx, 16, 16, 3, C.brass);
      px(ctx, 15, 15, C.gold);
    },
  };
}

function drum() {
  return {
    w: 48, h: 32,
    draw: (ctx: CanvasRenderingContext2D) => {
      railTable(ctx, 48, 32);
      ellipse(ctx, 24, 14, 11, 9, C.ink);
      ellipse(ctx, 24, 14, 10, 8, C.copper);
      ellipse(ctx, 24, 14, 8, 6, C.navy);
      for (const [x, y, c] of [[20, 12, C.white], [25, 15, C.gold], [28, 11, C.white], [22, 17, C.pink]]) px(ctx, x, y, c);
    },
  };
}

function cage() {
  return {
    w: 48, h: 32,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 0, 0, 48, 32, C.ink);
      rect(ctx, 1, 1, 46, 20, C.umber);
      for (let x = 4; x < 46; x += 4) rect(ctx, x, 3, 1, 17, C.brass);
      rect(ctx, 2, 3, 44, 1, C.gold);
      rect(ctx, 18, 10, 12, 10, C.navy);
      rect(ctx, 0, 21, 48, 11, C.walnut);
      rect(ctx, 0, 21, 48, 1, C.clay);
      rect(ctx, 18, 24, 12, 4, C.brass);
      rect(ctx, 19, 25, 10, 2, C.gold);
    },
  };
}

function bar() {
  return {
    w: 80, h: 16,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 0, 0, 80, 16, C.ink);
      rect(ctx, 1, 0, 78, 6, C.umber);
      const bottles = [C.moss, C.ember, C.blue, C.crimson, C.gold];
      for (let x = 3, i = 0; x < 77; x += 5, i++) { rect(ctx, x, 1, 2, 5, bottles[i % bottles.length]); px(ctx, x, 0, C.chalk); }
      rect(ctx, 0, 7, 80, 9, C.walnut);
      rect(ctx, 0, 7, 80, 1, C.tan);
      rect(ctx, 0, 14, 80, 2, C.umber);
    },
  };
}

function entrance() {
  return {
    w: 32, h: 16,
    draw: (ctx: CanvasRenderingContext2D) => {
      rect(ctx, 1, 2, 30, 12, C.crimson);
      rect(ctx, 2, 3, 28, 10, C.red);
      rect(ctx, 3, 4, 26, 1, C.gold);
      rect(ctx, 3, 11, 26, 1, C.gold);
    },
  };
}

export function definePlaceholders() {
  for (const type of Object.keys(LOOKS) as GamblerType[])
    for (const dir of DIRS) {
      for (let f = 0; f < 4; f++) defSprite(`gambler:${type}:${dir}:${f}`, gambler(type, dir, f, false));
      defSprite(`gambler:${type}:sit:${dir}`, gambler(type, dir, 0, true));
    }
  for (let v = 0; v < 4; v++) defSprite(`floor:sawdust:${v}`, sawdust(v));
  defSprite('table:dice', diceTable());
  for (let f = 0; f < 8; f++) defSprite(`table:wheel:${f}`, wheel(f));
  defSprite('table:drum', drum());
  defSprite('fixture:cage', cage());
  defSprite('fixture:bar', bar());
  defSprite('fixture:entrance', entrance());
}

/** Every sprite name the game asks for (the data test checks each exists). */
export function spriteNames(): string[] {
  const names: string[] = [];
  for (const type of Object.keys(LOOKS)) for (const dir of DIRS) {
    for (let f = 0; f < 4; f++) names.push(`gambler:${type}:${dir}:${f}`);
    names.push(`gambler:${type}:sit:${dir}`);
  }
  for (let v = 0; v < 4; v++) names.push(`floor:sawdust:${v}`);
  for (let f = 0; f < 8; f++) names.push(`table:wheel:${f}`);
  names.push('table:dice', 'table:drum', 'fixture:cage', 'fixture:bar', 'fixture:entrance');
  return names;
}
