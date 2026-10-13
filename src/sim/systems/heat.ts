// Heat (DESIGN.md §8): every round on a shaved table may be read, by a sharp gambler at it or by
// the Gaming Commission's inspector watching it. A gambler who reads the dice walks out telling
// people; the inspector's finding ends the tour. Heat brings the raid and, at 100, the license.
// The inspector walks in on the nights the season drew (season.ts), watches up to three open
// tables an hour each, and walks out.
import { HEAT } from '../../data/heat';
import { TIME } from '../../data/time';
import { center, walkTo } from '../floor';
import { addHeat, watchTile } from '../heat';
import type { GameState } from '../state';
import { leave } from './agents';

/** the inspector strolls, a little slower than a gambler (1/16 px a tick) */
const INSPECTOR_SPEED = 16;

function inspectorStep(g: GameState) {
  const ins = g.inspector;
  if (!ins || ins.phase === 'gone') return;
  ins.px = ins.x;
  ins.py = ins.y;
  if (ins.phase === 'due') {
    if (g.tick < ins.at || g.nightOver) return;
    // the tour: up to three open tables, in a seeded order
    ins.tour = g.heatRng.shuffle(g.tables.filter((t) => t.open).map((t) => t.id)).slice(0, HEAT.inspectorTables);
    const [dx, dy] = g.floor.door;
    [ins.x, ins.y, ins.px, ins.py] = [center(dx), center(dy), center(dx), center(dy)];
    g.now.push({ t: 'inspector', what: 'arrived' });
    next(g);
    return;
  }
  if (g.nightOver && ins.phase !== 'leave') goHome(g);
  if (ins.phase === 'walk') {
    if (walkTo(g, ins, INSPECTOR_SPEED)) {
      ins.phase = 'watch';
      ins.at = g.tick + HEAT.inspectorHours * TIME.ticksPerHour;
    }
  } else if (ins.phase === 'watch') {
    if (g.tick >= ins.at || !g.tables[ins.table].open) next(g);
  } else if (ins.phase === 'leave') {
    if (walkTo(g, ins, INSPECTOR_SPEED)) {
      ins.phase = 'gone';
      g.now.push({ t: 'inspector', what: 'left' });
    }
  }
}

/** On to the next table on the tour, or out the door. */
function next(g: GameState) {
  const ins = g.inspector!;
  const id = ins.tour.shift();
  if (id === undefined) return goHome(g);
  ins.table = id;
  [ins.tx, ins.ty] = watchTile(g, g.tables[id]);
  ins.phase = 'walk';
}

function goHome(g: GameState) {
  const ins = g.inspector!;
  ins.tour = [];
  ins.table = -1;
  [ins.tx, ins.ty] = g.floor.door;
  ins.phase = 'leave';
}

/** This tick's rounds on shaved tables: the inspector's look first, then the seated gamblers'. */
function spotting(g: GameState) {
  for (const e of g.now) {
    if (e.t !== 'round') continue;
    const t = g.tables[e.table];
    if (!t.gaff) continue;
    const s = t.gaff.strength;
    const ins = g.inspector;
    if (ins && ins.phase === 'watch' && ins.table === t.id) {
      if (g.heatRng.chance((HEAT.inspectorSpot * s) / 1000)) {
        g.now.push({ t: 'gaffSpotted', table: t.id, agent: -1, heat: HEAT.inspectorHeat });
        addHeat(g, HEAT.inspectorHeat);
        goHome(g);
        continue;
      }
    }
    for (const id of t.seats) {
      if (id < 0) continue;
      const a = g.agents[id];
      if (a.phase !== 'seated' || a.cheat) continue;
      if (!g.heatRng.chance((HEAT.gamblerSpot / 1e6) * (a.sharpness / 1000) * s)) continue;
      // they read the dice, cash out and tell the strip
      g.now.push({ t: 'gaffSpotted', table: t.id, agent: a.id, heat: HEAT.gamblerHeat });
      g.wom -= HEAT.spotWom;
      // (quiet on the way out: this is their word of mouth)
      a.ejected = true;
      leave(g, a);
      addHeat(g, HEAT.gamblerHeat);
      break;
    }
  }
}

export function heatSystem(g: GameState) {
  if (g.phase !== 'night' || g.result !== 'playing') return;
  spotting(g);
  inspectorStep(g);
}
