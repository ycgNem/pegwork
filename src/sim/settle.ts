// The one place a bet's money moves (DESIGN.md §6): the live cage system and the Sweat both
// settle through these, so the forecast fails exactly when the floor would.
import { LOSE } from './odds/odds';

/** The gambler's gain on a win (cents, rounded down): stake × pays10 / 10. */
export const gain = (stake: number, pays10: number) => Math.floor((stake * pays10) / 10);

/**
 * The cage after one bet: a loss adds the stake; a win pays the gain, and a win bigger than the
 * cage busts the house (returns -1).
 */
export function settle(cage: number, stake: number, pays10: number): number {
  if (pays10 === LOSE) return cage + stake;
  const g = gain(stake, pays10);
  return g > cage ? -1 : cage - g;
}

/** The stake a gambler puts down: their base bet inside the table's limits, never more than they have. */
export function stakeFor(baseBet: number, bankroll: number, min: number, max: number): number {
  return Math.min(bankroll, Math.max(min, Math.min(max, baseBet)));
}
