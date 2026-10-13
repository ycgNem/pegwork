// Commands in (CLAUDE.md: the sim is command-driven). Milestone 0 has the ones the debug floor
// needs; the floor, staff, crowd, gaff, web and buyout commands arrive with Milestone 1.
import type { GameDef } from '../data/games';
import type { GamblerType } from '../data/gamblers';

export type Command =
  | { t: 'openTable'; table: number }
  /** the seated gamblers get up and look for another table */
  | { t: 'closeTable'; table: number }
  /** limits in cents */
  | { t: 'setLimits'; table: number; min: number; max: number }
  /** replace a table's game (the editor's result); the outcome space must keep its kind */
  | { t: 'editGame'; table: number; game: GameDef }
  /** one paytable entry: pays10 for a bet (for a catch bet, the entry for `hits`) */
  | { t: 'setPays'; table: number; bet: number; pays10: number; hits?: number }
  /** the armored car: cents from the bank to the cage, arriving in an hour */
  | { t: 'callArmoredCar'; cents: number }
  /** debug floor only: a gambler of this type walks in now */
  | { t: 'spawn'; type: GamblerType }
  /** day: open tonight's doors */
  | { t: 'openDoors' }
  /** day: move cash between the bank and the cage at once (positive: into the cage) */
  | { t: 'transferCash'; cents: number }
  /** day: buy the rival out from the bank */
  | { t: 'buyout' }
  /** the last day of the slice: walk away without buying */
  | { t: 'closeSeason' };

/** A command and the tick it was applied on: a night's whole history (it replays from it). */
export interface LoggedCommand { tick: number; cmd: Command }
