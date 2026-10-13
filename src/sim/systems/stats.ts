// Night stats for the count room and the tests.
import type { GameState } from '../state';

export function statsSystem(g: GameState) {
  for (const e of g.now) if (e.t === 'left') g.stats.left++;
}
