// Commands in (CLAUDE.md: the sim is command-driven). Milestone 0 has the two a drop needs; the
// workshop, market, duel and skill commands arrive with Milestone 1.

export type Command =
  /** release one marble above board column 0–19 at the current stake */
  | { t: 'drop'; column: number }
  /** the stake per marble, in cents */
  | { t: 'setStake'; cents: number };

/** A command and the tick it was applied on: a duel's whole history (replays from it). */
export interface LoggedCommand { tick: number; cmd: Command }
