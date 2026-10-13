// The cage (DESIGN.md §6): the armored car's deliveries arrive, then this tick's bets settle in
// order. A win the cage can't cover busts the house and ends the run.
import { settle, gain } from '../settle';
import type { GameState } from '../state';

export function cageSystem(g: GameState) {
  for (let i = g.deliveries.length - 1; i >= 0; i--) {
    const d = g.deliveries[i];
    if (d.tick > g.tick) continue;
    g.cage += d.cents;
    g.deliveries.splice(i, 1);
    g.now.push({ t: 'delivered', cents: d.cents });
  }
  for (const s of g.settle) {
    if (g.busted) break;
    const next = settle(g.cage, s.stake, s.pays10);
    if (next < 0) {
      g.busted = true;
      g.now.push({ t: 'bust', table: s.table, agent: s.agent, owed: gain(s.stake, s.pays10), cage: g.cage });
      break;
    }
    g.stats.net += next - g.cage;
    g.cage = next;
  }
  g.settle = [];
}
