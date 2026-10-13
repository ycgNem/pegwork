// The clock (DESIGN.md §1): at 6am the night is over; everyone heads for the door.
import { NIGHT_TICKS } from '../../data/time';
import { standUp } from '../choice';
import type { GameState } from '../state';

export function clockSystem(g: GameState) {
  if (g.nightOver || g.tick < NIGHT_TICKS) return;
  g.nightOver = true;
  for (const a of g.agents) {
    if (a.phase === 'gone') continue;
    standUp(g, a);
    a.phase = 'leave';
    [a.tx, a.ty] = g.floor.door;
  }
  g.now.push({ t: 'nightOver' });
}
