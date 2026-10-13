// The clock (DESIGN.md §1): at 6am the night is over and everyone heads for the door; once the
// floor is empty (or an hour on, whoever is left is shown out) the count room closes the night.
import { NIGHT_TICKS, TIME } from '../../data/time';
import { standUp } from '../choice';
import { endNight } from '../season';
import { nightTick, type GameState } from '../state';

export function clockSystem(g: GameState) {
  if (g.phase !== 'night') return;
  const t = nightTick(g);
  if (g.busted && g.result === 'playing') {
    g.result = 'lost';
    g.lostReason = 'The cage ran dry.';
    g.now.push({ t: 'seasonOver', result: 'lost', reason: g.lostReason });
  }
  if (g.nightOver) {
    const empty = g.agents.every((a) => a.phase === 'gone');
    if (!g.busted && (empty || t >= NIGHT_TICKS + TIME.ticksPerHour)) endNight(g);
    return;
  }
  if (t < NIGHT_TICKS) return;
  g.nightOver = true;
  for (const a of g.agents) {
    if (a.phase === 'gone') continue;
    standUp(g, a);
    a.phase = 'leave';
    [a.tx, a.ty] = g.floor.door;
  }
  g.now.push({ t: 'nightOver' });
}
