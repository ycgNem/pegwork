// Cheats and security (DESIGN.md §8): every cheating round at a table is a chance for each pit
// boss watching it to spot the cheat; a spotted cheat is walked out by the first free security.
import { STAFF } from '../../data/staff';
import { watchers } from '../staff';
import type { Gambler, GameState } from '../state';

/** Send the first free security after a gambler; false if nobody's free. */
export function dispatch(g: GameState, a: Gambler): boolean {
  if (g.staff.some((s) => s.role === 'security' && s.target === a.id)) return true;
  const sec = g.staff.find((s) => s.role === 'security' && s.target < 0);
  if (!sec) return false;
  sec.target = a.id;
  return true;
}

export function cheatSystem(g: GameState) {
  for (const c of g.cheatRounds) {
    const a = g.agents[c.agent];
    if (a.spotted) continue;
    for (const boss of watchers(g, c.table)) {
      if (!g.staffRng.chance((STAFF.spotPerLevel * boss.skill) / 1000)) continue;
      a.spotted = true;
      g.now.push({ t: 'cheatSpotted', table: c.table, agent: a.id, by: boss.id });
      dispatch(g, a);
      break;
    }
  }
  g.cheatRounds = [];
}
