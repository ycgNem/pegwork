// Milestone 0's debug floor (ROADMAP M0): the sawdust joint live, the selected table's paytable
// with its exact odds, the cage with the Sweat, a speed control and pause. Orders given while
// paused apply at once (Game.applyNow), so the readouts answer before the clock moves.
import { EDGE_RULE, SWEAT } from '../data/economy';
import { GAMBLER_TYPES } from '../data/gamblers';
import type { BetDef } from '../data/games';
import { C } from '../data/palette';
import { TABLE_KINDS } from '../data/tables';
import { clockLabel, NIGHT_TICKS, TIME } from '../data/time';
import type { GameLoop } from '../engine/loop';
import type { Input } from '../engine/input';
import { drawFloor, FloorRenderState, outlineRect, tableRect, type FloorView } from '../render/floor';
import { SUB } from '../sim/floor';
import type { Command } from '../sim/commands';
import type { GameEvent } from '../sim/events';
import { Game } from '../sim/Game';
import { betOdds, isGaffed } from '../sim/odds/odds';
import { sweat, type SweatResult } from '../sim/sweat';
import type { UI } from '../ui/ui';
import { SCREEN_H, SCREEN_W } from './screen';

/** a win this big gets its own floater, a ticker line and a sound */
const BIG_WIN = 5000;
const PANEL_X = 464, PANEL_W = SCREEN_W - PANEL_X, TOP = 16;

export function money(cents: number, sign = false): string {
  const neg = cents < 0, d = Math.floor(Math.abs(cents) / 100);
  const s = '$' + d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? '-' + s : sign ? '+' + s : s;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

/** pays10 as odds: 40 -> "4:1", 15 -> "3:2", 0 -> "push", -1 -> "loses". */
export function fmtPays(p: number): string {
  if (p < 0) return 'loses';
  if (p === 0) return 'push';
  const k = gcd(p, 10);
  return `${p / k}:${10 / k}`;
}

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** The editor's color rule (DESIGN.md §2). */
export function edgeColor(e: number): number {
  if (e <= 0) return C.red;
  return e < EDGE_RULE.low || e > EDGE_RULE.high ? C.brass : C.leaf;
}

function sweatColor(p: number): number {
  return p >= SWEAT.red ? C.red : p >= SWEAT.amber ? C.brass : C.leaf;
}

/** The paytable entry a bet's +/- buttons step: the top-hits entry for a catch bet. */
function payOf(b: BetDef): { pays10: number; hits?: number } {
  return b.kind === 'catch' ? { pays10: b.pays10ByHits[b.picks], hits: b.picks } : { pays10: b.pays10 };
}

/** pays10 steps: tenths below 3:1, halves to 10:1, whole numbers above. */
function stepPays(p: number, dir: number): number {
  const step = p < 30 || (p === 30 && dir < 0) ? 1 : p < 100 || (p === 100 && dir < 0) ? 5 : 10;
  return Math.max(0, p + dir * step);
}

export class FloorScreen {
  game: Game;
  seed: number;
  readonly ready = true;
  rs = new FloorRenderState();
  view: FloorView = { ox: 104, oy: 64 };
  selected = 0;
  ticker: { text: string; color: number }[] = [];
  private sweatAt = -9999;
  sweat: SweatResult = { p: 0, se: 0, n: 0, topWin: 0 };
  sweatMs = 0;
  /** the win that broke the house, for the count room */
  bust: { owed: number; cage: number; table: number } | null = null;
  sfx: (id: string, v?: number, p?: number) => void = () => {};

  constructor(seed = 1, public loop?: GameLoop) {
    this.seed = seed;
    this.game = new Game({ seed });
  }

  newNight() {
    this.seed++;
    this.game = new Game({ seed: this.seed });
    this.rs = new FloorRenderState();
    this.ticker = [];
    this.sweatAt = -9999;
    this.bust = null;
  }

  /** One sim tick (the loop's tick callback; e2e steps it directly). */
  tick() {
    this.game.tick();
    this.consume(this.game.drain());
    // floaters age with the sim, so a paused floor freezes them too
    for (const f of this.rs.floats) f.age += 1 / 60;
    this.rs.floats = this.rs.floats.filter((f) => f.age < 1.2);
  }

  order(cmd: Command) {
    if (this.game.applyNow(cmd)) {
      this.consume(this.game.drain());
      this.sweatAt = -9999;
    }
  }

  private say(text: string, color: number = C.chalk) {
    this.ticker.push({ text, color });
    if (this.ticker.length > 3) this.ticker.shift();
  }

  /** A number floating up; nudged above any fresh one it would overlap. */
  private float(x: number, y: number, text: string, color: number) {
    if (this.rs.floats.length >= 14) return;
    for (const f of this.rs.floats) if (f.age < 0.5 && Math.abs(f.x - x) < 24 && Math.abs(f.y - f.age * 14 - y) < 9) y -= 10;
    this.rs.floats.push({ x, y, text, color, age: 0 });
  }

  private consume(events: GameEvent[]) {
    const g = this.game.s;
    // small wins in one round show as one number over the table (STYLE.md rule 3: readable)
    const small = new Map<number, number>();
    for (const e of events) {
      switch (e.t) {
        case 'round':
          if (g.tables[e.table].kind === 'wheel') this.rs.spinAt.set(e.table, this.rs.time);
          break;
        case 'win': {
          const a = g.agents[e.agent];
          if (e.cents >= BIG_WIN) {
            this.float(this.view.ox + a.x / SUB, this.view.oy + a.y / SUB - 22, money(e.cents, true), C.gold);
            this.say(`${GAMBLER_TYPES[a.type].label} won ${money(e.cents)} at ${g.tables[e.table].game.name}`, C.gold);
            this.sfx('win');
          } else small.set(e.table, (small.get(e.table) ?? 0) + e.cents);
          break;
        }
        case 'arrived':
          if (e.type === 'highRoller') this.say('A high roller walks in.', C.gold);
          break;
        case 'left':
          if (e.net * 2 >= e.start) this.say(`A ${GAMBLER_TYPES[e.type].label.toLowerCase()} leaves up ${money(e.net)}: they'll talk.`, C.leaf);
          break;
        case 'bust':
          this.bust = { owed: e.owed, cage: e.cage, table: e.table };
          this.say(`The cage can't pay ${money(e.owed)}. The house is finished.`, C.red);
          break;
        case 'delivered':
          this.say(`The armored car drops ${money(e.cents)} at the cage.`, C.sky);
          this.sfx('cage');
          break;
        case 'rejected':
          this.say(e.reason, C.red);
          break;
        case 'nightOver':
          this.say('6:00 AM. The count room.', C.chalk);
          break;
      }
    }
    for (const [t, cents] of small) {
      const r = tableRect(g.tables[t], this.view);
      this.float(r.x + r.w / 2, r.y - 4, money(cents, true), C.chalk);
    }
  }

  private refreshSweat() {
    const g = this.game.s;
    if (g.tick - this.sweatAt < 60) return;
    this.sweatAt = g.tick;
    const t0 = performance.now();
    this.sweat = sweat(g, 500, g.tick + 1);
    this.sweatMs = performance.now() - t0;
  }

  frame(ctx: CanvasRenderingContext2D, ui: UI, input: Input, alpha: number) {
    const g = this.game.s, loop = this.loop;
    this.rs.time += ui.dt;
    if (loop) {
      if (input.wasPressed('pause')) loop.paused = !loop.paused;
      if (input.wasPressed('speed1')) [loop.speed, loop.paused] = [1, false];
      if (input.wasPressed('speed2')) [loop.speed, loop.paused] = [2, false];
    }
    this.refreshSweat();

    drawFloor(ctx, g, this.view, g.nightOver || g.busted ? 1 : alpha, this.rs, { w: PANEL_X, h: SCREEN_H });
    // tables: click to select; the selected one outlined in gold; red when one win could bust the cage
    g.tables.forEach((t, i) => {
      const r = tableRect(t, this.view);
      const top = Math.max(0, ...t.game.bets.map((b) => payOf(b).pays10));
      const danger = Math.floor((t.max * top) / 10) > g.cage;
      if (danger && Math.floor(this.rs.time * 3) % 2 === 0) outlineRect(ctx, r, C.red);
      else if (i === this.selected) outlineRect(ctx, r, C.gold);
      else if (ui.hover(r.x, r.y, r.w, r.h)) outlineRect(ctx, r, C.chalk);
      if (ui.hover(r.x, r.y, r.w, r.h) && ui.clicked) {
        this.selected = i;
        ui.eat();
      }
      if (danger && ui.hover(r.x, r.y, r.w, r.h)) ui.tip([{ text: `One max bet on its top payout wins ${money(Math.floor((t.max * top) / 10))}: more than the cage holds.`, color: C.red }]);
    });
    this.ticker.forEach((l, i) => ui.text(l.text, 8, SCREEN_H - 12 - (this.ticker.length - 1 - i) * 10, l.color, { shadow: C.ink }));

    this.topBar(ui);
    this.tablePanel(ui, g.tables[this.selected]);
    this.cagePanel(ui);
    if (g.busted || g.nightOver) this.countRoom(ui);
  }

  private topBar(ui: UI) {
    const g = this.game.s, loop = this.loop;
    ui.fill(0, 0, SCREEN_W, TOP, C.ink);
    ui.fill(0, TOP - 1, SCREEN_W, 1, C.plum);
    ui.text('CARPET JOINT', 6, 4, C.pink);
    ui.text('debug floor, night 1', 76, 4, C.slate);
    ui.text(clockLabel(Math.min(g.tick, NIGHT_TICKS)), 232, 4, C.chalk, { align: 'center' });
    if (loop) {
      const bx = 262;
      if (ui.button('pause', bx, 2, 26, 12, loop.paused ? 'Go' : 'II', { active: loop.paused, tip: 'Pause the floor (Space). Every order works while paused.' })) loop.paused = !loop.paused;
      if (ui.button('x1', bx + 28, 2, 18, 12, '1x', { active: !loop.paused && loop.speed === 1, tip: 'Speed 1x (1)' })) [loop.speed, loop.paused] = [1, false];
      if (ui.button('x2', bx + 48, 2, 18, 12, '2x', { active: !loop.paused && loop.speed === 2, tip: 'Speed 2x (2)' })) [loop.speed, loop.paused] = [2, false];
    }
    const inHouse = g.agents.filter((a) => a.phase !== 'gone').length;
    ui.text(`In the house ${inHouse}`, 350, 4, C.steel);
    ui.text(`Tonight ${money(g.stats.net, true)}`, 452, 4, g.stats.net >= 0 ? C.leaf : C.red);
    ui.text(`Word of mouth ${(g.wom / 1000).toFixed(1)}`, 634, 4, C.sky, { align: 'right' });
  }

  private tablePanel(ui: UI, t: Game['s']['tables'][number]) {
    const x = PANEL_X, w = PANEL_W;
    let y = TOP + 2;
    ui.panel(x, y, w - 2, 178, 'felt');
    ui.text(t.game.name, x + 6, y + 5, C.gold);
    const k = TABLE_KINDS[t.kind];
    const r = t.game.randomizer;
    const what = r.kind === 'dice' ? `${r.count}d${r.faces}` : r.kind === 'wheel' ? `${r.pockets.length} pockets` : `${r.balls} balls, ${r.drawn} drawn`;
    ui.text(`${what}, ${k.roundsPerHour} rounds/hr`, x + 6, y + 15, C.steel);
    if (isGaffed(t.game)) ui.text('GAFFED', x + w - 8, y + 5, C.red, { align: 'right' });
    y += 28;
    ui.text('Bet', x + 6, y, C.slate);
    ui.text('Pays', x + 72, y, C.slate);
    ui.text('Edge', x + 112, y, C.slate);
    ui.text('Hit', x + 168, y, C.slate, { align: 'right' });
    y += 11;
    t.game.bets.forEach((b, i) => {
      const o = betOdds(t.game, i);
      const p = payOf(b);
      ui.text(b.label, x + 6, y, C.chalk);
      if (ui.button(`pm${i}`, x + 60, y - 2, 9, 11, '-', { tip: 'Pay less' })) this.order({ t: 'setPays', table: t.id, bet: i, pays10: stepPays(p.pays10, -1), hits: p.hits });
      ui.text(fmtPays(p.pays10), x + 82, y, C.chalk, { align: 'center' });
      if (ui.button(`pp${i}`, x + 95, y - 2, 9, 11, '+', { tip: 'Pay more' })) this.order({ t: 'setPays', table: t.id, bet: i, pays10: stepPays(p.pays10, 1), hits: p.hits });
      ui.text(pct(o.edge), x + 110, y, edgeColor(o.edge));
      ui.text(pct(o.hit, 0), x + 168, y, C.steel, { align: 'right' });
      if (ui.hover(x + 4, y - 1, w - 8, 10) && !ui.hoverId)
        ui.tip([
          { text: `${b.label}: pays ${fmtPays(p.pays10)}`, color: C.gold },
          { text: `House edge ${pct(o.edge, 2)} (exact ${o.edgeExact.n}/${o.edgeExact.d})`, color: edgeColor(o.edge) },
          { text: `Swing: ${o.sigma.toFixed(2)} per $1 bet. Hits ${pct(o.hit)} of rounds.` },
        ], 160);
      y += 11;
    });
    y += 4;
    ui.text(`Limits ${money(t.min)}-${money(t.max)}`, x + 6, y, C.chalk);
    const lim = (min: number, max: number) => this.order({ t: 'setLimits', table: t.id, min, max });
    if (ui.button('mn-', x + 104, y - 2, 15, 11, 'm-', { tip: 'Lower the minimum ($1)' })) lim(t.min - 100, Math.min(t.max, (t.min - 100) * 100));
    if (ui.button('mn+', x + 121, y - 2, 15, 11, 'm+', { tip: 'Raise the minimum ($1)' })) lim(t.min + 100, Math.max(t.max, (t.min + 100) * 5));
    if (ui.button('mx-', x + 138, y - 2, 15, 11, 'M-', { tip: 'Lower the maximum ($10)' })) lim(t.min, t.max - 1000);
    if (ui.button('mx+', x + 155, y - 2, 15, 11, 'M+', { tip: 'Raise the maximum ($10). Bigger bets, bigger swings.' })) lim(t.min, t.max + 1000);
    y += 13;
    const seated = t.seats.filter((s) => s >= 0).length;
    ui.text(`Seats ${seated}/${t.seats.length}   rounds ${t.rounds}`, x + 6, y, C.steel);
    y += 10;
    ui.text(`Tonight ${money(t.net, true)} on ${money(t.handle)} bet`, x + 6, y, t.net >= 0 ? C.leaf : C.red);
    y += 13;
    if (ui.button('open', x + 6, y, 60, 12, t.open ? 'Close table' : 'Open table')) this.order({ t: t.open ? 'closeTable' : 'openTable', table: t.id });
    if (ui.button('whale', x + 70, y, 98, 12, 'Send in a whale', { tip: 'Debug: a high roller walks in now.' })) this.order({ t: 'spawn', type: 'highRoller' });
  }

  private cagePanel(ui: UI) {
    const g = this.game.s, x = PANEL_X, w = PANEL_W;
    let y = TOP + 184;
    ui.panel(x, y, w - 2, SCREEN_H - y - 2, 'wood');
    ui.text('THE CAGE', x + 6, y + 5, C.gold);
    y += 17;
    ui.text(`Cage ${money(g.cage)}`, x + 6, y, C.chalk);
    ui.text(`Bank ${money(g.bank)}`, x + w - 8, y, C.chalk, { align: 'right' });
    y += 14;
    const s = this.sweat;
    ui.text('The Sweat', x + 6, y, C.chalk);
    ui.text(`${pct(s.p, 0)} ±${pct(s.se * 2, 0)}`, x + w - 8, y, sweatColor(s.p), { align: 'right' });
    if (ui.hover(x + 4, y - 1, w - 8, 10))
      ui.tip([
        { text: 'The Sweat: the chance the cage runs dry before 6am.', color: C.gold },
        { text: `Tonight replayed ${s.n} times with the real paytables and everyone seated now (${this.sweatMs.toFixed(0)} ms).` },
      ], 160);
    y += 11;
    ui.bar(x + 6, y, w - 14, 5, s.p, sweatColor(s.p));
    y += 10;
    const tight = s.topWin > g.cage;
    ui.text(`Biggest win on the floor ${money(s.topWin)}`, x + 6, y, tight ? C.red : C.steel);
    y += 14;
    const pending = g.deliveries.reduce((n, d) => n + d.cents, 0);
    if (ui.button('car', x + 6, y, w - 14, 12, 'Armored car: +$1,000 to the cage', { tip: 'From the bank. $50 fee; arrives in one game hour.' })) this.order({ t: 'callArmoredCar', cents: 100000 });
    y += 15;
    if (pending) ui.text(`On the way: ${money(pending)}`, x + 6, y, C.sky);
    y += 12;
    ui.text(`Left up 50%: ${g.stats.leftUp}   broke fast: ${g.stats.leftBroke}`, x + 6, y, C.steel);
  }

  private countRoom(ui: UI) {
    const g = this.game.s;
    const w = 220, h = 92, x = Math.floor((PANEL_X - w) / 2), y = 120;
    ui.panel(x, y, w, h, 'dark');
    ui.text(g.busted ? 'THE CAGE RAN DRY' : '6:00 AM: THE COUNT ROOM', x + w / 2, y + 8, g.busted ? C.red : C.gold, { align: 'center' });
    if (g.busted && this.bust) ui.text(`A ${money(this.bust.owed)} win; the cage held ${money(this.bust.cage)}.`, x + 10, y + 26, C.red);
    else ui.text(`House net ${money(g.stats.net, true)} on ${money(g.stats.handle)} bet`, x + 10, y + 26, g.stats.net >= 0 ? C.leaf : C.red);
    ui.text(`${g.stats.arrived} gamblers, ${g.stats.rounds} rounds`, x + 10, y + 38, C.chalk);
    ui.text(`${g.stats.leftUp} left up 50%+, ${g.stats.leftBroke} went broke fast`, x + 10, y + 50, C.chalk);
    if (ui.button('again', x + w / 2 - 40, y + h - 20, 80, 13, 'Next night')) this.newNight();
  }
}

export const PANEL = { x: PANEL_X, w: PANEL_W, top: TOP, ticksPerHour: TIME.ticksPerHour };
