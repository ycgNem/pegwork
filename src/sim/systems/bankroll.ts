// Bankroll: stakes leave when a marble drops; payouts arrive when it lands.
import type { GameState } from '../state';

export function bankrollSystem(g: GameState) {
  for (const e of g.now) {
    if (e.t === 'dropped') g.bankroll -= e.stake;
    else if (e.t === 'landed') g.bankroll += e.payout;
  }
}
