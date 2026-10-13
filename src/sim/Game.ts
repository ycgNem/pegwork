// The game: state, the fixed system order, commands in and events out (CLAUDE.md). Pure and
// deterministic: no DOM, no time, no Math.random. Same seed + same commands = same state, bit for bit.
import { ECONOMY } from '../data/economy';
import { SAWDUST_JOINT, type FloorDef } from '../data/floor';
import { STARTER_GAMES } from '../data/games';
import { LIMITS, TABLE_KINDS } from '../data/tables';
import { NIGHT_TICKS } from '../data/time';
import { Rng, hashStr } from '../engine/rng';
import type { Command, LoggedCommand } from './commands';
import type { GameEvent } from './events';
import type { GameState } from './state';
import { beginNight, seedRival } from './season';
import { UNDERCUTTER } from '../data/strip';
import { STAFF, STARTING_STAFF } from '../data/staff';
import { makeStaff, rollHall } from './staff';
import { clockSystem } from './systems/clock';
import { commandSystem } from './systems/commands';
import { arrivalSystem } from './systems/arrivals';
import { agentSystem } from './systems/agents';
import { tableSystem } from './systems/tables';
import { cheatSystem } from './systems/cheats';
import { cageSystem } from './systems/cage';
import { staffSystem } from './systems/staff';
import { heatSystem } from './systems/heat';
import { rivalSystem } from './systems/rivals';
import { eventSystem } from './systems/events';
import { reputationSystem } from './systems/reputation';
import { progressionSystem } from './systems/progression';
import { statsSystem } from './systems/stats';

/** The fixed order, every tick (CLAUDE.md). */
export const SYSTEMS = [
  ['clock', clockSystem],
  ['commands', commandSystem],
  ['arrivals', arrivalSystem],
  ['agents', agentSystem],
  ['tables', tableSystem],
  ['cheats', cheatSystem],
  ['cage', cageSystem],
  ['staff', staffSystem],
  ['heat', heatSystem],
  ['rivals', rivalSystem],
  ['events', eventSystem],
  ['reputation', reputationSystem],
  ['progression', progressionSystem],
  ['stats', statsSystem],
] as const;

export interface GameOptions {
  seed: number;
  /** open night 1's doors at once (tests and bots); otherwise the season starts on day 1 */
  open?: boolean;
  floor?: FloorDef;
  cage?: number;
  bank?: number;
  /** no walk-ins (the tests seat gamblers themselves with `spawn`) */
  noArrivals?: boolean;
}

/** Each table's stream is seeded from the game's seed and its index, so tables never share draws. */
const tableSeed = (seed: number, i: number) => hashStr(`table:${seed}:${i}`);

export class Game {
  s: GameState;
  private out: GameEvent[] = [];
  readonly opts: GameOptions;

  constructor(opts: GameOptions) {
    this.opts = opts;
    const floor = opts.floor ?? SAWDUST_JOINT;
    this.s = {
      seed: opts.seed,
      tick: 0,
      phase: 'day',
      night: 1,
      nightStart: 0,
      arrivals: 0,
      share: 0,
      reputation: 0,
      rival: {
        id: 'undercutter', edge: UNDERCUTTER.edge, reputation: UNDERCUTTER.reputation * 1000, cash: UNDERCUTTER.cash,
        profits: [], share: 0, buffet: false, lastMove: null, rng: new Rng(hashStr(`rival:${opts.seed}`)), bought: false,
      },
      staff: [],
      nextStaff: 0,
      hall: [],
      staffRng: new Rng(hashStr(`staff:${opts.seed}`)),
      result: 'playing',
      lostReason: '',
      history: [],
      crowdRng: new Rng(hashStr(`crowd:${opts.seed}`)),
      floor: { w: floor.w, h: floor.h, door: [...floor.door], fixtures: floor.fixtures.map((f) => ({ ...f })), version: 0 },
      tables: floor.tables.map((t, i) => ({
        id: i, kind: t.kind, x: t.x, y: t.y, game: STARTER_GAMES[t.game], gaff: null, shutNight: 0,
        min: LIMITS.defaultMin, max: LIMITS.defaultMax, open: true,
        rng: new Rng(tableSeed(opts.seed, i)), acc: 0,
        seats: TABLE_KINDS[t.kind].seats.map(() => -1),
        last: [], rounds: 0, handle: 0, net: 0,
      })),
      agents: [],
      nextAgent: 0,
      cage: opts.cage ?? ECONOMY.startCage,
      bank: opts.bank ?? ECONOMY.startBank,
      deliveries: [],
      busted: false,
      nightOver: false,
      wom: 0,
      pending: [],
      log: [],
      now: [],
      settle: [],
      cheatRounds: [],
      heat: 0,
      heatRng: new Rng(hashStr(`heat:${opts.seed}`)),
      inspector: null,
      fines: 0,
      stats: { arrived: 0, left: 0, leftUp: 0, leftBroke: 0, rounds: 0, handle: 0, net: 0 },
    };
    seedRival(this.s);
    // the opening staff: dealers on the first tables, the pit boss watching them (DESIGN.md §4)
    let dealt = 0;
    for (const m of STARTING_STAFF.members) {
      const s = makeStaff(this.s, m.role, m.skill);
      if (s.role === 'dealer') s.table = dealt < this.s.tables.length ? dealt++ : -1;
      if (s.role === 'pitBoss') s.watch = this.s.tables.slice(0, STAFF.pitTables).map((t) => t.id);
      this.s.staff.push(s);
    }
    rollHall(this.s);
    if (opts.open) {
      beginNight(this.s);
      this.s.now = [];
    }
  }

  /** Queue a command for the next tick. */
  command(cmd: Command) {
    this.s.pending.push(cmd);
  }

  /**
   * Apply a command now, between ticks (orders given on the paused floor). It's logged at the
   * coming tick, where a replay applies it in that tick's command system; the clock before it does
   * nothing until 6am, so it's refused from 6am on and the two orders can't differ.
   */
  applyNow(cmd: Command): boolean {
    const g = this.s;
    if (g.phase === 'night' && g.tick - g.nightStart >= NIGHT_TICKS) return false;
    const queued = g.pending;
    g.pending = [cmd];
    g.now = [];
    commandSystem(g);
    g.pending = queued;
    for (const e of g.now) this.out.push(e);
    g.now = [];
    return true;
  }

  tick() {
    const g = this.s;
    g.now = [];
    for (const [name, sys] of SYSTEMS) if (!(name === 'arrivals' && this.opts.noArrivals)) sys(g);
    for (const e of g.now) this.out.push(e);
    g.tick++;
  }

  /** Take the events raised since the last drain. */
  drain(): GameEvent[] {
    const e = this.out;
    this.out = [];
    return e;
  }

  /** FNV-1a over everything that decides the future: two games that hash alike play alike. */
  hash(): number {
    const g = this.s;
    let h = 2166136261;
    const w = (x: number) => {
      x = x | 0;
      for (let k = 0; k < 4; k++) {
        h ^= x & 255;
        h = Math.imul(h, 16777619);
        x >>>= 8;
      }
    };
    // money above 2^31 cents is split in two words
    const big = (v: number) => { w(v % 2147483648); w(Math.floor(v / 2147483648)); };
    w(g.tick); w(g.crowdRng.s); big(g.cage + 2 ** 40); big(g.bank + 2 ** 40); w(g.wom); w(g.nextAgent);
    w(g.busted ? 1 : 0); w(g.nightOver ? 1 : 0);
    w(g.phase === 'night' ? 1 : 0); w(g.night); w(g.nightStart); w(g.arrivals); w(g.share); w(g.reputation);
    w(g.result === 'playing' ? 0 : g.result === 'won' ? 1 : 2);
    const r = g.rival;
    w(Math.round(r.edge * 1e6)); w(r.reputation); big(r.cash + 2 ** 40); w(r.share); w(r.buffet ? 1 : 0); w(r.rng.s); w(r.bought ? 1 : 0);
    for (const p of r.profits) big(p + 2 ** 40);
    w(g.staffRng.s); w(g.nextStaff);
    for (const s of g.staff) { w(s.id); w(s.skill); w(s.table); w(s.x); w(s.y); w(s.target); for (const t of s.watch) w(t); }
    for (const s of g.hall) w(s.id);
    w(g.heat); w(g.heatRng.s); w(g.fines);
    const ins = g.inspector;
    if (ins) { w(['due', 'walk', 'watch', 'leave', 'gone'].indexOf(ins.phase)); w(ins.at); w(ins.table); w(ins.x); w(ins.y); for (const t of ins.tour) w(t); }
    for (const t of g.tables) {
      w(t.rng.s); w(t.acc); w(t.open ? 1 : 0); w(t.min); w(t.max); w(t.rounds); big(t.handle); big(t.net + 2 ** 40);
      // the game itself: paytable edits and gaffs decide the future too
      w(hashStr(JSON.stringify(t.game))); w(t.gaff ? (t.gaff.side === 'low' ? 1 : 4) + t.gaff.strength : 0); w(t.shutNight);
      for (const s of t.seats) w(s);
    }
    const PH = { choose: 0, walk: 1, seated: 2, leave: 3, gone: 4 };
    for (const a of g.agents) {
      w(a.id); w(a.x); w(a.y); w(PH[a.phase]); big(a.bankroll); w(a.table); w(a.seat); w(a.bet); w(a.patience); w(a.waited);
      w(a.cheat ? 1 + (a.cheat === 'slider' ? 0 : 1) : 0); w(a.spotted ? 1 : 0); w(a.ejected ? 1 : 0);
    }
    for (const d of g.deliveries) { w(d.tick); big(d.cents); }
    return h >>> 0;
  }

  /** Rebuild a game from its options and command log, run to `ticks`. */
  static replay(opts: GameOptions, log: readonly LoggedCommand[], ticks: number): Game {
    const game = new Game(opts);
    let i = 0;
    while (game.s.tick < ticks) {
      while (i < log.length && log[i].tick === game.s.tick) game.command(log[i++].cmd);
      game.tick();
    }
    // orders given after the last tick (a final day's buyout or walk-away) apply as they did live
    while (i < log.length) game.applyNow(log[i++].cmd);
    return game;
  }
}
