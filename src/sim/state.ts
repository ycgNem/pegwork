// The whole sim state: plain data plus the seeded RNG. Money is in cents.
import type { BoardDef } from '../data/boards';
import type { MarbleId } from '../data/marbles';
import type { Command, LoggedCommand } from './commands';
import type { GameEvent } from './events';
import type { Marble } from './physics/marble';
import type { Rng } from './rng';

export interface Stats {
  drops: number;
  landed: number;
  jammed: number;
  /** cents staked and paid out */
  staked: number;
  paid: number;
  cupHits: number[];
}

export interface GameState {
  seed: number;
  tick: number;
  rng: Rng;
  board: BoardDef;
  /** the marble the next drop uses */
  marble: MarbleId;
  bankroll: number;
  /** stake per marble */
  stake: number;
  /** marbles in play */
  marbles: Marble[];
  nextMarble: number;
  /** commands waiting for the next tick */
  pending: Command[];
  /** every command applied, with its tick */
  log: LoggedCommand[];
  stats: Stats;
  /** this tick's events, for the systems after the one that raised them */
  now: GameEvent[];
  /** this tick's landed marbles, from physics to payouts */
  landed: Marble[];
}
