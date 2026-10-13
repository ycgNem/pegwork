// Arrivals (DESIGN.md §5, §7): tonight's crowd walks in through the door over the first 8 hours,
// a seeded chance each tick; each gambler is rolled from their type's ranges.
import { CROWD, GAMBLER_TYPES, type GamblerType } from '../../data/gamblers';
import { CHEATS, CHEAT_RULES, type CheatKind } from '../../data/cheats';
import { CHOICE } from '../../data/gamblers';
import { TIME } from '../../data/time';
import { center } from '../floor';
import { nightTick, type Gambler, type GameState } from '../state';

const CHEAT_KINDS = Object.keys(CHEATS) as CheatKind[];
const ARRIVAL_TYPES = (Object.keys(GAMBLER_TYPES) as GamblerType[]).filter((t) => GAMBLER_TYPES[t].arrivalWeight > 0);

/** chance per tick that someone walks in: tonight's planned arrivals spread over the first 8 hours */
export const arrivalChance = (planned: number) => planned / (CROWD.arrivalHours * TIME.ticksPerHour);

/** A gambler walks in; a cheat dresses as their cover type but plays from their own ranges. */
export function spawnGambler(g: GameState, type: GamblerType, cheat: CheatKind | null = null): Gambler {
  if (cheat) type = CHEATS[cheat].poseAs;
  const def = GAMBLER_TYPES[type], r = g.crowdRng;
  const money = cheat ? CHEATS[cheat] : def;
  const bankroll = r.int(money.bankroll[0] / 100, money.bankroll[1] / 100) * 100;
  const baseBet = r.int(money.baseBet[0] / 100, money.baseBet[1] / 100) * 100;
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
    cheat, spotted: false, ejected: false,
  };
  g.agents.push(a);
  g.stats.arrived++;
  g.now.push({ t: 'arrived', agent: a.id, type });
  return a;
}

export function arrivalSystem(g: GameState) {
  if (g.phase !== 'night' || g.nightOver || g.busted || nightTick(g) >= CROWD.arrivalHours * TIME.ticksPerHour) return;
  // independent cheats drift in over the same hours (DESIGN.md §8)
  const cheats = (CHEAT_RULES.arrivalsBase + CHEAT_RULES.arrivalsPerNight * (g.night - 1)) / 1000;
  if (g.crowdRng.chance(arrivalChance(cheats))) spawnGambler(g, 'tourist', g.crowdRng.pick(CHEAT_KINDS));
  if (!g.crowdRng.chance(arrivalChance(g.arrivals))) return;
  const type = g.crowdRng.weighted(ARRIVAL_TYPES, (t) => GAMBLER_TYPES[t].arrivalWeight);
  spawnGambler(g, type);
}
