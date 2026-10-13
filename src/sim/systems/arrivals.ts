// Arrivals (DESIGN.md §5, §7): tonight's crowd walks in through the door over the first 8 hours,
// a seeded chance each tick; each gambler is rolled from their type's ranges.
import { CROWD, GAMBLER_TYPES, type GamblerType } from '../../data/gamblers';
import { CHOICE } from '../../data/gamblers';
import { TIME } from '../../data/time';
import { center } from '../floor';
import { nightTick, type Gambler, type GameState } from '../state';

const ARRIVAL_TYPES = (Object.keys(GAMBLER_TYPES) as GamblerType[]).filter((t) => GAMBLER_TYPES[t].arrivalWeight > 0);

/** chance per tick that someone walks in: tonight's planned arrivals spread over the first 8 hours */
export const arrivalChance = (planned: number) => planned / (CROWD.arrivalHours * TIME.ticksPerHour);

export function spawnGambler(g: GameState, type: GamblerType): Gambler {
  const def = GAMBLER_TYPES[type], r = g.crowdRng;
  const bankroll = r.int(def.bankroll[0] / 100, def.bankroll[1] / 100) * 100;
  const baseBet = r.int(def.baseBet[0] / 100, def.baseBet[1] / 100) * 100;
  // a rough normal from three uniforms, scaled to CHOICE.edgeNoise x (1 - sharpness), per mille
  const z = r.next() + r.next() + r.next() - 1.5;
  const noise = Math.round(z * 2 * CHOICE.edgeNoise * (1000 - def.sharpness));
  const [dx, dy] = g.floor.door;
  const a: Gambler = {
    id: g.nextAgent++, type,
    x: center(dx), y: center(dy), px: center(dx), py: center(dy),
    phase: 'choose', tx: dx, ty: dy, table: -1, seat: -1, bet: 0,
    bankroll, start: bankroll, baseBet,
    patience: def.patienceMin * TIME.ticksPerMinute, age: 0, waited: 0,
    thrill: def.thrill, sharpness: def.sharpness, noise,
    stopLoss: def.stopLoss,
    winGoal: Math.floor((bankroll * r.int(def.winGoal[0], def.winGoal[1])) / 1000),
  };
  g.agents.push(a);
  g.stats.arrived++;
  g.now.push({ t: 'arrived', agent: a.id, type });
  return a;
}

export function arrivalSystem(g: GameState) {
  if (g.phase !== 'night' || g.nightOver || g.busted || nightTick(g) >= CROWD.arrivalHours * TIME.ticksPerHour) return;
  if (!g.crowdRng.chance(arrivalChance(g.arrivals))) return;
  const type = g.crowdRng.weighted(ARRIVAL_TYPES, (t) => GAMBLER_TYPES[t].arrivalWeight);
  spawnGambler(g, type);
}
