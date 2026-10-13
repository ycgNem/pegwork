// The game: state, the fixed system order, commands in and events out (CLAUDE.md). Pure and
// deterministic: no DOM, no time, no Math.random. Same seed + same commands = same state, bit for bit.
import { BASE_BOARD, type BoardDef } from '../data/boards';
import { ECONOMY } from '../data/economy';
import type { Command, LoggedCommand } from './commands';
import type { GameEvent } from './events';
import { Rng } from './rng';
import type { GameState } from './state';
import { duelSystem } from './systems/duel';
import { commandSystem } from './systems/commands';
import { physicsSystem } from './systems/physics';
import { payoutSystem } from './systems/payouts';
import { wearSystem } from './systems/wear';
import { bankrollSystem } from './systems/bankroll';
import { rivalSystem } from './systems/rival';
import { skillSystem } from './systems/skills';
import { statsSystem } from './systems/stats';

/** The fixed order, every tick. */
export const SYSTEMS = [
  ['duel', duelSystem],
  ['commands', commandSystem],
  ['physics', physicsSystem],
  ['payouts', payoutSystem],
  ['wear', wearSystem],
  ['bankroll', bankrollSystem],
  ['rival', rivalSystem],
  ['skills', skillSystem],
  ['stats', statsSystem],
] as const;

export interface GameOptions {
  seed: number;
  board?: BoardDef;
  bankroll?: number;
}

export class Game {
  s: GameState;
  /** events since the last drain */
  private out: GameEvent[] = [];

  constructor(opts: GameOptions) {
    const board = opts.board ?? BASE_BOARD;
    this.s = {
      seed: opts.seed,
      tick: 0,
      rng: new Rng(opts.seed),
      board,
      marble: 'steel',
      bankroll: opts.bankroll ?? ECONOMY.startBankroll,
      stake: ECONOMY.defaultStake,
      marbles: [],
      nextMarble: 0,
      pending: [],
      log: [],
      stats: { drops: 0, landed: 0, jammed: 0, staked: 0, paid: 0, cupHits: board.cups.map(() => 0) },
      now: [],
      landed: [],
    };
  }

  /** Queue a command for the next tick. */
  command(cmd: Command) {
    this.s.pending.push(cmd);
  }

  tick() {
    const g = this.s;
    g.now = [];
    for (const [, sys] of SYSTEMS) sys(g);
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
    const word = (x: number) => {
      for (let k = 0; k < 4; k++) {
        h ^= x & 255;
        h = Math.imul(h, 16777619);
        x >>>= 8;
      }
    };
    // positions and velocities are whole numbers of 1/256 px; money and counts are whole numbers
    const mix = (v: number) => word(Math.round(v * 256) | 0);
    const seed = (v: number) => word(v >>> 0);
    mix(g.tick);
    seed(g.rng.s);
    mix(g.bankroll);
    mix(g.stake);
    mix(g.nextMarble);
    for (const m of g.marbles) {
      mix(m.id); mix(m.x); mix(m.y); mix(m.vx); mix(m.vy); seed(m.rs); mix(m.age); mix(m.still); mix(m.tags);
    }
    for (const v of g.stats.cupHits) mix(v);
    mix(g.stats.paid);
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
    return game;
  }
}
