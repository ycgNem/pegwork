// Events out: what happened this tick, for the renderer, the sound and the tests. The sim never
// reads its own events back except within the tick that raised them (reputation reads `left`).
import type { GamblerType } from '../data/gamblers';

export type GameEvent =
  | { t: 'arrived'; agent: number; type: GamblerType }
  | { t: 'seated'; agent: number; table: number; seat: number }
  | { t: 'round'; table: number; outcome: number; bets: number }
  /** a bet that won: `cents` is the gambler's gain */
  | { t: 'win'; table: number; agent: number; cents: number }
  | { t: 'left'; agent: number; type: GamblerType; net: number; start: number; minutes: number }
  /** a win the cage couldn't pay */
  | { t: 'bust'; table: number; agent: number; owed: number; cage: number }
  | { t: 'delivered'; cents: number }
  | { t: 'nightOver' }
  | { t: 'rejected'; reason: string };
