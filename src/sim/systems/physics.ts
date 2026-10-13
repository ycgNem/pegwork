// Physics: move every marble in play one tick. Contacts and jams become events; landed marbles go
// to the payout system.
import { buildWorld } from '../physics/world';
import { stepMarble } from '../physics/marble';
import type { GameState } from '../state';

export function physicsSystem(g: GameState) {
  const world = buildWorld(g.board);
  g.landed = [];
  for (const m of g.marbles) {
    const st = stepMarble(world, m, (body, speed) => {
      const b = world.bodies[body];
      g.now.push({ t: 'contact', marble: m.id, body, part: b.part, mat: b.mat, speed });
    });
    if (st === 'landed') g.landed.push(m);
    else if (st === 'jammed') g.now.push({ t: 'jammed', marble: m.id });
  }
  if (g.landed.length || g.marbles.some((m) => m.state === 'jammed')) g.marbles = g.marbles.filter((m) => m.state === 'falling');
}
