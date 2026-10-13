// The whole sim state: plain data plus seeded RNG streams (CLAUDE.md). Money in cents, fractions
// per mille, agent positions in 1/16 px, time in ticks since the doors opened.
import type { GameDef } from '../data/games';
import type { GamblerType } from '../data/gamblers';
import type { FixtureKind } from '../data/floor';
import type { TableKind } from '../data/tables';
import type { RivalMove } from '../data/strip';
import type { CheatKind } from '../data/cheats';
import type { Gaff } from '../data/heat';
import type { Role } from '../data/staff';
import type { Rng } from '../engine/rng';
import type { Command, LoggedCommand } from './commands';
import type { GameEvent } from './events';

export interface TableState {
  id: number;
  kind: TableKind;
  /** top-left tile */
  x: number;
  y: number;
  game: GameDef;
  /** the shaved dice on this table, or null (the game's weights follow it; DESIGN.md §8) */
  gaff: Gaff | null;
  /** a raid shut the table through this night (0: never raided) */
  shutNight: number;
  /** limits, cents */
  min: number;
  max: number;
  open: boolean;
  /** this table's own stream: its rounds don't depend on any other table */
  rng: Rng;
  /** round accumulator: + roundsPerHour a tick, a round each ticksPerHour */
  acc: number;
  /** agent id per seat, -1 when empty */
  seats: number[];
  /** the last outcomes, newest last (the eye in the sky's replay; at most 10) */
  last: { tick: number; outcome: number; cheat: number }[];
  rounds: number;
  /** cents bet and the house's net tonight */
  handle: number;
  net: number;
}

export type Phase = 'choose' | 'walk' | 'seated' | 'leave' | 'gone';

export interface Gambler {
  id: number;
  type: GamblerType;
  /** feet position, 1/16 px; and last tick's, for the renderer's interpolation */
  x: number;
  y: number;
  px: number;
  py: number;
  phase: Phase;
  /** the tile walked to */
  tx: number;
  ty: number;
  table: number;
  seat: number;
  /** index into the table's bets */
  bet: number;
  bankroll: number;
  start: number;
  baseBet: number;
  /** ticks of patience left */
  patience: number;
  /** ticks since arriving */
  age: number;
  /** ticks spent waiting for a seat */
  waited: number;
  thrill: number;
  sharpness: number;
  /** this gambler's error in sensing an edge, per mille (signed) */
  noise: number;
  stopLoss: number;
  winGoal: number;
  /** a cheat in disguise (their `type` is the look they pose as), or null */
  cheat: CheatKind | null;
  /** a pit boss has spotted them cheating */
  spotted: boolean;
  /** security is walking them out */
  ejected: boolean;
}

export interface StaffMember {
  id: number;
  role: Role;
  name: string;
  skill: 1 | 2 | 3;
  /** a dealer's table (-1: off the floor) */
  table: number;
  /** the tables a pit boss watches */
  watch: number[];
  /** security walks: position, target tile, the gambler it's after (-1: at its post) */
  x: number;
  y: number;
  px: number;
  py: number;
  tx: number;
  ty: number;
  target: number;
}

export interface Fixture { kind: FixtureKind; x: number; y: number; w: number; h: number }

/** A bet settled at a table this tick, for the cage (in seat order). */
export interface Settlement { table: number; agent: number; stake: number; pays10: number }

export interface Stats {
  arrived: number;
  left: number;
  leftUp: number;
  leftBroke: number;
  rounds: number;
  handle: number;
  /** the house's net tonight */
  net: number;
}

/** One night in the season's book: what the count room found. */
export interface NightRecord {
  night: number;
  net: number;
  arrivals: number;
  /** your share of the strip, per mille */
  share: number;
  wom: number;
  wages: number;
  /** a raid's fine tonight, cents */
  fines: number;
  /** heat at dawn, before it cools */
  heat: number;
}

/** The Gaming Commission's inspector (DESIGN.md §8): walks in, watches a few tables, walks out. */
export interface Inspector {
  /** 'due': walks in at `at`; 'walk' to the table being toured; 'watch' it until `at`; 'leave' */
  phase: 'due' | 'walk' | 'watch' | 'leave' | 'gone';
  at: number;
  /** the tables left to watch, in order, and the one now */
  tour: number[];
  table: number;
  x: number;
  y: number;
  px: number;
  py: number;
  tx: number;
  ty: number;
}

export interface RivalState {
  id: 'undercutter';
  /** the edge its games post, and its reputation (per mille points) */
  edge: number;
  reputation: number;
  cash: number;
  /** its nightly profits, newest last (the buyout price averages the last few) */
  profits: number[];
  /** its share of the strip last night, per mille */
  share: number;
  /** tonight it runs a free buffet */
  buffet: boolean;
  lastMove: RivalMove | null;
  rng: Rng;
  bought: boolean;
}

export interface GameState {
  seed: number;
  /** ticks since the season began; the night's clock is tick - nightStart */
  tick: number;
  phase: 'day' | 'night';
  /** the night being played, or the one the day leads into (1-based) */
  night: number;
  nightStart: number;
  /** tonight's planned arrivals and your share of the strip (per mille) */
  arrivals: number;
  share: number;
  /** reputation, per mille points of word of mouth (DESIGN.md §5, §7) */
  reputation: number;
  rival: RivalState;
  staff: StaffMember[];
  nextStaff: number;
  /** today's hiring hall */
  hall: StaffMember[];
  staffRng: Rng;
  result: 'playing' | 'won' | 'lost';
  lostReason: string;
  history: NightRecord[];
  crowdRng: Rng;
  floor: { w: number; h: number; door: [number, number]; fixtures: Fixture[]; version: number };
  tables: TableState[];
  agents: Gambler[];
  nextAgent: number;
  cage: number;
  bank: number;
  /** armored cars on the way: cents arriving at a tick */
  deliveries: { tick: number; cents: number }[];
  /** a win the cage couldn't cover: the run is over */
  busted: boolean;
  nightOver: boolean;
  /** tonight's word of mouth so far, per mille (DESIGN.md §5); added to reputation at the count */
  wom: number;
  pending: Command[];
  log: LoggedCommand[];
  now: GameEvent[];
  settle: Settlement[];
  /** Heat, 0-100 (DESIGN.md §8) */
  heat: number;
  heatRng: Rng;
  /** tonight's inspector, if one comes */
  inspector: Inspector | null;
  /** raid fines tonight, cents */
  fines: number;
  /** this tick's cheating rounds, from the tables to the cheats system */
  cheatRounds: { table: number; agent: number; kind: CheatKind }[];
  stats: Stats;
}

/** Ticks since tonight's doors opened. */
export const nightTick = (g: GameState) => g.tick - g.nightStart;
