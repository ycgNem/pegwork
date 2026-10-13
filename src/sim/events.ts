// Events out: what happened this tick, for the renderer, the sound and the tests. The sim never
// reads its own events back except within the tick that raised them (reputation reads `left`).
import type { GamblerType } from '../data/gamblers';
import type { RivalMove } from '../data/strip';
import type { CheatKind } from '../data/cheats';
import type { Role } from '../data/staff';

export type GameEvent =
  | { t: 'arrived'; agent: number; type: GamblerType }
  | { t: 'seated'; agent: number; table: number; seat: number }
  | { t: 'round'; table: number; outcome: number; bets: number }
  /** a bet that won: `cents` is the gambler's gain */
  | { t: 'win'; table: number; agent: number; cents: number }
  /** `quiet`: a cheat or someone walked out by security; they don't spread word of mouth */
  | { t: 'left'; agent: number; type: GamblerType; net: number; start: number; minutes: number; quiet: boolean }
  | { t: 'cheatRound'; table: number; agent: number; kind: CheatKind }
  | { t: 'cheatSpotted'; table: number; agent: number; by: number }
  | { t: 'accused'; agent: number; guilty: boolean }
  | { t: 'ejected'; agent: number; recovered: number }
  | { t: 'hired'; staff: number; role: Role }
  /** a gaff read: by a seated gambler (agent) or the inspector (agent -1) */
  | { t: 'gaffSpotted'; table: number; agent: number; heat: number }
  | { t: 'inspector'; what: 'arrived' | 'left' }
  | { t: 'raid'; fine: number; tables: number[] }
  /** a win the cage couldn't pay */
  | { t: 'bust'; table: number; agent: number; owed: number; cage: number }
  | { t: 'delivered'; cents: number }
  | { t: 'nightOver' }
  | { t: 'doorsOpen'; night: number; arrivals: number; share: number }
  | { t: 'dayBegins'; night: number }
  | { t: 'rivalMove'; move: RivalMove }
  | { t: 'boughtOut'; price: number }
  | { t: 'seasonOver'; result: 'won' | 'lost'; reason: string }
  | { t: 'rejected'; reason: string };
