// Immediate-mode UI kit drawn on the 640x360 logical canvas with the bitmap font. Everything is in
// logical pixels; the app maps the mouse into them before begin().
import { C, PALETTE, rgba } from '../data/palette';
import type { Input } from '../engine/input';
import { sprite, drawFit } from '../render/atlas';
import { drawText, textWidth, wrapText, LINE_H, FONT_H } from './font';
import type { AuditRec, AuditKind } from './audit';

export interface Rect { x: number; y: number; w: number; h: number }
export interface TipLine { text: string; color?: number }

/** wood: the machine's frame. felt: the backboard the math is chalked on. dark: overlays. */
export type PanelStyle = 'wood' | 'felt' | 'dark' | 'brass' | 'inset';

export class UI {
  ctx!: CanvasRenderingContext2D;
  input!: Input;
  w = 0;
  h = 0;
  mx = -1;
  my = -1;
  private blocks: Rect[] = [];
  private prevBlocks: Rect[] = [];
  /** mouse is over some UI element drawn last frame */
  captured = false;
  tooltip: TipLine[] | null = null;
  tipWidth = 140;
  time = 0;
  dt = 1 / 60;
  clicked = false;
  rclicked = false;
  hoverId: string | null = null;
  sfx: (id: string) => void = () => {};
  /** debug: record what each frame draws for the overlap audit (src/ui/audit.ts, npm run screens) */
  audit = false;
  /** the last complete frame's records, while audit is on */
  lastAudit: AuditRec[] = [];
  private auditLog: AuditRec[] = [];
  private auditLayer: AuditRec['layer'] = 'ui';
  private clips: Rect[] = [];

  private rec(kind: AuditKind, x: number, y: number, w: number, h: number, s?: string) {
    this.auditLog.push({ kind, x, y, w, h, s, clip: this.clips[this.clips.length - 1], layer: this.auditLayer, seq: this.auditLog.length });
  }

  /** Start a frame. (mx, my) is the mouse in logical pixels, or -1 when it is off the screen. */
  begin(ctx: CanvasRenderingContext2D, input: Input, mx: number, my: number, dt: number) {
    this.ctx = ctx;
    this.input = input;
    this.w = ctx.canvas.width;
    this.h = ctx.canvas.height;
    this.mx = mx;
    this.my = my;
    this.time += dt;
    this.dt = dt;
    this.tooltip = null;
    this.prevBlocks = this.blocks;
    this.blocks = [];
    this.captured = this.prevBlocks.some((b) => this.inside(b));
    this.clicked = input.mouse.pressed[0];
    this.rclicked = input.mouse.pressed[2];
    this.hoverId = null;
    if (this.audit) {
      this.lastAudit = this.auditLog;
      this.auditLog = [];
      this.clips = [];
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  inside(r: Rect) {
    return this.mx >= r.x && this.my >= r.y && this.mx < r.x + r.w && this.my < r.y + r.h;
  }

  hover(x: number, y: number, w: number, h: number) {
    return this.mx >= x && this.my >= y && this.mx < x + w && this.my < y + h;
  }

  block(x: number, y: number, w: number, h: number) {
    this.blocks.push({ x, y, w, h });
  }

  /** consume the left click (so it doesn't fall through) */
  eat() {
    this.clicked = false;
    this.input.consumeMouse(0);
  }

  fill(x: number, y: number, w: number, h: number, c: number, a = 1) {
    if (this.audit && a >= 0.85 && w > 2 && h > 2) this.rec('fill', x, y, w, h);
    this.ctx.fillStyle = a >= 1 ? PALETTE[c] : rgba(c, a);
    this.ctx.fillRect(x, y, w, h);
  }

  panel(x: number, y: number, w: number, h: number, style: PanelStyle = 'wood', blocking = true) {
    x = Math.round(x);
    y = Math.round(y);
    if (blocking) this.block(x, y, w, h);
    if (this.audit) this.rec('panel', x, y, w, h);
    const f = (xx: number, yy: number, ww: number, hh: number, c: number) => this.fill(xx, yy, ww, hh, c);
    switch (style) {
      case 'wood':
        f(x, y, w, h, C.ink);
        f(x + 1, y + 1, w - 2, h - 2, C.walnut);
        f(x + 1, y + 1, w - 2, 1, C.clay);
        f(x + 1, y + 1, 1, h - 2, C.clay);
        f(x + 2, y + h - 2, w - 3, 1, C.umber);
        break;
      case 'felt':
        f(x, y, w, h, C.ink);
        f(x + 1, y + 1, w - 2, h - 2, C.feltDark);
        f(x + 1, y + 1, w - 2, 1, C.felt);
        break;
      case 'dark':
        this.fill(x, y, w, h, C.ink, 0.9);
        f(x, y, w, 1, C.slate);
        f(x, y + h - 1, w, 1, C.slate);
        f(x, y, 1, h, C.slate);
        f(x + w - 1, y, 1, h, C.slate);
        break;
      case 'brass':
        f(x, y, w, h, C.ink);
        f(x + 1, y + 1, w - 2, h - 2, C.brass);
        f(x + 1, y + 1, w - 2, 1, C.gold);
        f(x + 1, y + h - 2, w - 2, 1, C.copper);
        break;
      case 'inset':
        f(x, y, w, h, C.ink);
        f(x + 1, y + 1, w - 2, h - 2, C.feltDark);
        break;
    }
  }

  text(s: string, x: number, y: number, c: number = C.chalk, opts: { shadow?: number; align?: 'left' | 'center' | 'right' } = {}) {
    let tx = x;
    if (opts.align === 'center') tx = x - Math.floor(textWidth(s) / 2);
    else if (opts.align === 'right') tx = x - textWidth(s);
    if (this.audit && s.trim()) this.rec('text', Math.round(tx), Math.round(y), textWidth(s), FONT_H, s);
    return drawText(this.ctx, s, Math.round(tx), Math.round(y), PALETTE[c], 1, opts.shadow !== undefined ? PALETTE[opts.shadow] : null);
  }

  /** wrapped paragraph; returns height used */
  para(s: string, x: number, y: number, w: number, c: number = C.chalk, lineH = LINE_H): number {
    const lines = wrapText(s, w);
    lines.forEach((l, i) => this.text(l, x, y + i * lineH, c));
    return lines.length * lineH;
  }

  button(id: string, x: number, y: number, w: number, h: number, label: string, opts: { disabled?: boolean; active?: boolean; tip?: TipLine[] | string } = {}): boolean {
    const hov = this.hover(x, y, w, h) && !opts.disabled;
    const down = hov && this.input.mouse.down[0];
    const base = opts.disabled ? C.slate : opts.active ? C.copper : C.clay;
    const hi = opts.disabled ? C.steelDark : opts.active ? C.sand : C.tan;
    if (this.audit) this.rec('button', x, y, w, h);
    this.block(x, y, w, h);
    this.fill(x, y, w, h, C.ink);
    this.fill(x + 1, y + 1, w - 2, h - 2, hov ? hi : base);
    if (!down) {
      this.fill(x + 1, y + 1, w - 2, 1, hov ? C.chalk : hi);
      this.fill(x + 1, y + h - 2, w - 2, 1, C.walnut);
    }
    if (label) {
      const col = opts.disabled ? C.steelDark : C.chalk;
      this.text(label, x + w / 2, y + Math.floor((h - 7) / 2) + (down ? 1 : 0), col, { align: 'center', shadow: opts.disabled ? undefined : C.umber });
    }
    if (hov) {
      this.hoverId = id;
      if (opts.tip) this.tip(typeof opts.tip === 'string' ? [{ text: opts.tip }] : opts.tip);
    }
    if (hov && this.clicked) {
      this.eat();
      this.sfx('click');
      return true;
    }
    return false;
  }

  tip(lines: TipLine[], width = 140) {
    this.tooltip = lines;
    this.tipWidth = width;
  }

  /** Draw a named sprite fitted in a size x size box at a whole-number scale. */
  spriteIcon(name: string, x: number, y: number, size: number) {
    drawFit(this.ctx, sprite(name), x, y, size, size);
  }

  bar(x: number, y: number, w: number, h: number, frac: number, col: number, bg: number = C.ink) {
    this.fill(x, y, w, h, bg);
    this.fill(x + 1, y + 1, Math.round((w - 2) * Math.max(0, Math.min(1, frac))), h - 2, col);
  }

  clip(x: number, y: number, w: number, h: number) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.clip();
    if (this.audit) this.clips.push({ x, y, w, h });
  }
  unclip() {
    this.ctx.restore();
    if (this.audit) this.clips.pop();
  }

  end() {
    // the tooltip floats above the UI on purpose
    this.auditLayer = 'tip';
    if (this.tooltip && this.tooltip.length) this.drawTip(this.tooltip);
    this.auditLayer = 'ui';
  }

  private drawTip(lines: TipLine[]) {
    const maxW = this.tipWidth;
    const wrapped: { text: string; color: number }[] = [];
    for (const l of lines) for (const t of wrapText(l.text, maxW)) wrapped.push({ text: t, color: l.color ?? C.chalk });
    let w = 0;
    for (const l of wrapped) w = Math.max(w, textWidth(l.text));
    w += 8;
    const h = wrapped.length * LINE_H + 5;
    let x = this.mx + 8, y = this.my + 8;
    if (x + w > this.w) x = this.mx - w - 2;
    if (y + h > this.h) y = this.h - h - 1;
    x = Math.max(1, x);
    y = Math.max(1, y);
    this.fill(x, y, w, h, C.ink);
    this.fill(x + 1, y + 1, w - 2, h - 2, C.navy);
    wrapped.forEach((l, i) => this.text(l.text, x + 4, y + 3 + i * LINE_H, l.color));
  }
}
