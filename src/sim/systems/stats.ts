// Stats: running totals for the readout and the pace tests.
import type { GameState } from '../state';

export function statsSystem(g: GameState) {
  const s = g.stats;
  for (const e of g.now) {
    if (e.t === 'dropped') { s.drops++; s.staked += e.stake; }
    else if (e.t === 'landed') { s.landed++; s.paid += e.payout; s.cupHits[e.cup]++; }
    else if (e.t === 'jammed') s.jammed++;
  }
}
