// Payouts and tags (DESIGN.md §2): stake x cup multiplier x the tags picked up on the way.
import { buildWorld } from '../physics/world';
import type { GameState } from '../state';

export function payoutSystem(g: GameState) {
  if (!g.landed.length) return;
  const world = buildWorld(g.board);
  for (const m of g.landed) {
    const mult = world.cups[m.cup].mult;
    const payout = Math.round(m.stake * mult * m.tags);
    g.now.push({ t: 'landed', marble: m.id, cup: m.cup, mult, tags: m.tags, payout });
  }
}
