// Staff on the floor (PLAN "Staff"): security walks to the gambler it's after and shows them out;
// a caught cheat's winnings tonight go back to the cage. Dealers, pit bosses and cashiers stand at
// their posts (the renderer places them).
import { CHEAT_RULES } from '../../data/cheats';
import { STAFF } from '../../data/staff';
import { tileOf, walkTo } from '../floor';
import { securityPost } from '../staff';
import type { GameState } from '../state';
import { leave } from './agents';

export function staffSystem(g: GameState) {
  if (g.phase !== 'night') return;
  for (const s of g.staff) {
    if (s.role !== 'security') continue;
    s.px = s.x;
    s.py = s.y;
    if (s.target < 0) {
      [s.tx, s.ty] = securityPost(g);
      walkTo(g, s, STAFF.securitySpeed);
      continue;
    }
    const a = g.agents[s.target];
    if (!a || a.phase === 'gone' || a.phase === 'leave') {
      s.target = -1;
      continue;
    }
    [s.tx, s.ty] = [tileOf(a.x), tileOf(a.y)];
    if (!walkTo(g, s, STAFF.securitySpeed)) continue;
    // caught: tonight's winnings back to the cage, a little reputation for a clean house
    const recovered = Math.max(0, a.bankroll - a.start);
    g.cage += recovered;
    g.stats.net += recovered;
    a.bankroll -= recovered;
    a.ejected = true;
    if (a.cheat) g.wom += CHEAT_RULES.caughtRep;
    g.now.push({ t: 'ejected', agent: a.id, recovered });
    leave(g, a);
    s.target = -1;
  }
}
