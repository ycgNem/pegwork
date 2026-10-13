// The Milestone 0 debug screen: the base board at the left, a click on a column drops a marble,
// and the Dry Run is chalked on the felt beside it (STYLE.md readability rule 5: you never leave
// the machine to read the math).
import { BOARD } from '../data/boards';
import { MARBLES } from '../data/marbles';
import { C } from '../data/palette';
import type { Input } from '../engine/input';
import { Game } from '../sim/Game';
import { dryRun, type DryRunResult } from '../sim/dryrun';
import { buildWorld, type World } from '../sim/physics/world';
import { drawBoard, drawMarble, type BoardView } from '../render/board';
import type { UI } from '../ui/ui';
import { textWidth } from '../ui/font';

/** drops per column in the Dry Run (DESIGN.md §6) */
export const DRY_DROPS = 300;
const DRY_SEED = 1;

/** the board's place on the screen: row 1 (the rail) at the top edge */
export const VIEW: BoardView = { x: 12, y: -BOARD.cell };
const FELT = { x: 186, y: 3, w: 195, h: 210 };

const money = (cents: number) => `${cents < 0 ? '-' : ''}$${(Math.abs(cents) / 100).toFixed(2)}`;
const pct = (f: number) => `${Math.round(f * 100)}%`;

export class DebugScreen {
  game: Game;
  world: World;
  /** the column the next drop goes in */
  column = 9;
  hover = -1;
  /** the Dry Run per column, filled one column a frame */
  dry: (DryRunResult | null)[] = new Array(BOARD.cols).fill(null);
  private flash = new Map<number, number>();
  recent: string[] = [];
  sfx: (id: string, v?: number, pitch?: number) => void = () => {};

  constructor(seed = 12345) {
    this.game = new Game({ seed });
    this.world = buildWorld(this.game.s.board);
  }

  /** Run the next column's Dry Run if any is missing (one per frame keeps frames short). */
  private fillDry() {
    const c = this.dry.findIndex((d) => !d);
    if (c >= 0) this.dry[c] = dryRun(this.game.s.board, MARBLES[this.game.s.marble], c, DRY_DROPS, DRY_SEED);
  }

  get dryReady() {
    return this.dry.every((d) => d);
  }

  drop(column = this.column) {
    this.column = column;
    this.game.command({ t: 'drop', column });
  }

  /** One sim tick, and the sounds and flashes its events ask for. */
  tick() {
    this.game.tick();
    for (const [k, n] of this.flash) n > 1 ? this.flash.set(k, n - 1) : this.flash.delete(k);
    for (const e of this.game.drain()) {
      if (e.t === 'contact') {
        if (e.part >= 0) this.flash.set(e.part, 4);
        const v = Math.min(1, e.speed / 200);
        this.sfx(e.mat === 'peg' ? 'peg' : 'wall', v, 0.9 + (e.body % 5) * 0.05);
      } else if (e.t === 'landed') {
        this.sfx('cup', 1, 1 + e.mult * 0.15);
        this.recent.unshift(`col ${this.columnOf(e.marble)} -> x${e.mult}  ${e.payout ? '+' + money(e.payout) : 'nothing'}`);
        this.recent.length = Math.min(this.recent.length, 3);
      } else if (e.t === 'dropped') {
        this.dropColumns.set(e.marble, e.column);
      }
    }
  }

  private dropColumns = new Map<number, number>();
  private columnOf(id: number) {
    const c = this.dropColumns.get(id) ?? -1;
    this.dropColumns.delete(id);
    return c + 1;
  }

  /** Input, then the frame. */
  frame(ctx: CanvasRenderingContext2D, ui: UI, input: Input, alpha: number) {
    this.fillDry();
    // the column under the mouse, anywhere over the board
    const bx = ui.mx - VIEW.x, by = ui.my;
    this.hover = bx >= 0 && bx < this.world.width && by >= 0 && by < 216 ? Math.floor(bx / BOARD.cell) : -1;
    if (input.wasPressed('left')) this.column = Math.max(0, this.column - 1);
    if (input.wasPressed('right')) this.column = Math.min(BOARD.cols - 1, this.column + 1);
    if (input.wasPressed('drop')) this.drop();

    ctx.fillStyle = '#181425';
    ctx.fillRect(0, 0, 384, 216);
    drawBoard(ctx, this.world, VIEW, { column: this.column, hover: this.hover, flash: this.flash });
    for (const m of this.game.s.marbles) drawMarble(ctx, m, VIEW, alpha, MARBLES[m.def].sprite);
    if (this.hover >= 0) {
      ui.block(VIEW.x, 0, this.world.width, 216);
      if (ui.clicked) {
        ui.eat();
        this.drop(this.hover);
      }
    }
    this.drawFelt(ui);
  }

  private drawFelt(ui: UI) {
    const { x, y, w, h } = FELT;
    ui.panel(x, y, w, h, 'felt');
    const col = this.hover >= 0 ? this.hover : this.column;
    const d = this.dry[col];
    const L = x + 6;
    ui.text('DRY RUN', L, y + 5, C.gold);
    ui.text(`Steel  col ${col + 1}  ${DRY_DROPS} drops`, x + w - 6, y + 5, C.steelLight, { align: 'right' });
    if (!d) {
      ui.text('running...', L, y + 18, C.chalk);
      return;
    }
    const ev = `EV ${d.mean.toFixed(2)} ±${d.se.toFixed(2)}`;
    // green only when the board clearly wins: the mean clears 1.0 by two standard errors
    ui.text(ev, L, y + 18, d.mean - 2 * d.se > 1 ? C.leaf : C.chalk);
    ui.text('per $1 staked', L + textWidth(ev) + 5, y + 18, C.steel);

    // payout per stake: ink bars on the felt, the mean an ember line (STYLE.md: three colors)
    const hx = L, hy = y + 31, hw = w - 12, hh = 40;
    ui.fill(hx, hy, hw, hh, C.ink);
    const maxPay = Math.max(3, ...d.histogram.map((b) => b.payout));
    const px = (p: number) => hx + 6 + Math.round((p / maxPay) * (hw - 16));
    const top = Math.max(...d.histogram.map((b) => b.count));
    for (const b of d.histogram) {
      const bh = Math.max(1, Math.round((b.count / top) * (hh - 6)));
      ui.fill(px(b.payout) - 2, hy + hh - 2 - bh, 5, bh, C.felt);
    }
    ui.fill(px(d.mean), hy + 2, 1, hh - 4, C.ember);
    for (const b of d.histogram) ui.text(`x${b.payout}`, px(b.payout), hy + hh + 2, C.chalk, { align: 'center' });

    // cup hit rates, in board order
    const cy = hy + hh + 14;
    const cw = Math.floor(hw / d.cupRates.length);
    d.cupRates.forEach((r, i) => {
      const cx = L + i * cw;
      ui.text(`x${this.world.cups[i].mult}`, cx, cy, C.steel);
      ui.text(pct(r), cx + cw - 8, cy, C.chalk, { align: 'right' });
    });

    // EV by column, one bar per column; the break-even line in chalk
    const ey = cy + 14;
    const evs = this.dry.map((r) => (r ? r.mean : 0));
    const best = evs.indexOf(Math.max(...evs)), worst = evs.indexOf(Math.min(...evs));
    ui.text(`by column  best ${best + 1}: ${evs[best].toFixed(2)}  worst ${worst + 1}: ${evs[worst].toFixed(2)}`, L, ey, C.steel);
    const gy = ey + 11, gh = 30, gw = BOARD.cols * 8;
    ui.fill(L, gy, gw, gh, C.ink);
    const yOf = (ev: number) => gy + gh - 1 - Math.round((Math.min(ev, 1.5) / 1.5) * (gh - 2));
    for (let c = 0; c < BOARD.cols; c++) {
      const top = yOf(evs[c]);
      ui.fill(L + c * 8 + 1, top, 6, gy + gh - 1 - top, c === col ? C.ember : C.felt);
    }
    for (let i = 0; i < gw; i += 2) ui.fill(L + i, yOf(1), 1, 1, C.chalk);
    ui.text('1.0', L + gw + 4, yOf(1) - 4, C.chalk);

    // the bankroll and the last few drops
    const s = this.game.s;
    const by = gy + gh + 6;
    ui.text(`Bankroll ${money(s.bankroll)}`, L, by, C.gold);
    ui.text(`stake ${money(s.stake)}`, x + w - 6, by, C.chalk, { align: 'right' });
    this.recent.forEach((r, i) => ui.text(r, L, by + 11 + i * 10, i ? C.steel : C.chalk));
    ui.text('click a column to drop', L, y + h - 12, C.steelDark);
  }
}
