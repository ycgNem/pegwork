// Apply this tick's commands, in the order they were queued, and log them for replay.
import { addHeat, isShut, setGaff, withGaff } from '../heat';
import { HEAT } from '../../data/heat';
import { ECONOMY } from '../../data/economy';
import type { GameDef } from '../../data/games';
import { LIMITS } from '../../data/tables';
import { TIME } from '../../data/time';
import { closeTable, standUp } from '../choice';
import type { Command } from '../commands';
import { spawnGambler } from './arrivals';
import { dealerOf } from '../staff';
import { STAFF } from '../../data/staff';
import { CHEAT_RULES } from '../../data/cheats';
import { dispatch } from './cheats';
import { leave } from './agents';
import { beginNight, buyoutPrice } from '../season';
import { STRIP } from '../../data/strip';
import type { GameState } from '../state';

function reject(g: GameState, reason: string) {
  g.now.push({ t: 'rejected', reason });
}

/** A copy of a game with one paytable entry changed. */
export function withPays(game: GameDef, bet: number, pays10: number, hits?: number): GameDef {
  const bets = game.bets.map((b, i) => {
    if (i !== bet) return b;
    if (b.kind === 'catch') {
      const by = b.pays10ByHits.slice();
      by[hits ?? b.picks] = pays10;
      return { ...b, pays10ByHits: by };
    }
    return { ...b, pays10 };
  });
  return { ...game, bets };
}

/** Commands that only make sense in the day, or only at night. */
const DAY_ONLY = new Set(['openDoors', 'transferCash', 'buyout', 'closeSeason', 'hire', 'fire']);
const NIGHT_ONLY = new Set(['callArmoredCar', 'spawn', 'accuse']);

function apply(g: GameState, c: Command) {
  if (g.result !== 'playing') return reject(g, 'the season is over');
  if (DAY_ONLY.has(c.t) && g.phase !== 'day') return reject(g, 'that waits for the day');
  if (NIGHT_ONLY.has(c.t) && g.phase !== 'night') return reject(g, 'that needs the doors open');
  // (assign checks its own table: -1 takes a dealer off the floor)
  const table = 'table' in c && c.t !== 'assign' ? g.tables[c.table] : undefined;
  if ('table' in c && c.t !== 'assign' && !table) return reject(g, 'no such table');
  switch (c.t) {
    case 'openTable':
      if (!dealerOf(g, table!.id)) return reject(g, 'the table needs a dealer');
      if (isShut(g, table!)) return reject(g, 'the Commission has it shut tonight');
      table!.open = true;
      break;
    case 'closeTable':
      closeTable(g, table!.id);
      break;
    case 'setLimits': {
      const ok = c.min >= LIMITS.minFloor && c.min <= LIMITS.minCeil && c.max >= c.min * LIMITS.maxTimesMinLow && c.max <= c.min * LIMITS.maxTimesMinHigh;
      if (!ok) return reject(g, 'limits out of range');
      table!.min = c.min;
      table!.max = c.max;
      break;
    }
    case 'editGame':
      if (c.game.randomizer.kind !== table!.game.randomizer.kind) return reject(g, 'a table keeps its randomizer');
      // the editor can't rig a game: the dice stay as the table's gaff has them
      table!.game = withGaff({ ...c.game, randomizer: { ...c.game.randomizer, weights: undefined } as typeof c.game.randomizer }, table!.gaff);
      break;
    case 'gaff':
      if (table!.kind !== 'dice') return reject(g, 'only dice can be shaved');
      if (c.gaff && !(c.gaff.strength >= 1 && c.gaff.strength <= 3 && (c.gaff.side === 'low' || c.gaff.side === 'high'))) return reject(g, 'no such shave');
      setGaff(table!, c.gaff);
      break;
    case 'setPays':
      if (!(c.pays10 >= -1 && c.pays10 <= 10000) || !table!.game.bets[c.bet]) return reject(g, 'paytable entry out of range');
      table!.game = withPays(table!.game, c.bet, c.pays10, c.hits);
      break;
    case 'callArmoredCar': {
      const cost = c.cents + ECONOMY.armoredCarFee;
      if (c.cents <= 0 || cost > g.bank) return reject(g, 'not enough in the bank');
      g.bank -= cost;
      g.deliveries.push({ tick: g.tick + ECONOMY.armoredCarHours * TIME.ticksPerHour, cents: c.cents });
      break;
    }
    case 'spawn':
      spawnGambler(g, c.type, c.cheat ?? null);
      break;
    case 'openDoors':
      if (g.night > STRIP.sliceNights) return reject(g, 'the season is over: buy the rival out or walk away');
      if (!g.staff.some((s) => s.role === 'cashier')) return reject(g, 'the cage needs a cashier');
      beginNight(g);
      break;
    case 'hire': {
      const i = g.hall.findIndex((s) => s.id === c.candidate);
      if (i < 0) return reject(g, 'no such candidate');
      const s = g.hall.splice(i, 1)[0];
      g.staff.push(s);
      g.now.push({ t: 'hired', staff: s.id, role: s.role });
      break;
    }
    case 'fire': {
      const i = g.staff.findIndex((s) => s.id === c.staff);
      if (i < 0) return reject(g, 'no such staff');
      const s = g.staff[i];
      g.staff.splice(i, 1);
      if (s.role === 'dealer' && s.table >= 0) closeTable(g, s.table);
      break;
    }
    case 'assign': {
      const s = g.staff.find((m) => m.id === c.staff);
      if (!s) return reject(g, 'no such staff');
      if (c.table >= 0 && !g.tables[c.table]) return reject(g, 'no such table');
      if (s.role === 'dealer') {
        const from = s.table;
        if (from === c.table) break;
        // whoever deals there now swaps to this dealer's old table
        const other = c.table >= 0 ? dealerOf(g, c.table) : undefined;
        s.table = c.table;
        if (other) other.table = from;
        if (from >= 0 && !other) closeTable(g, from);
      } else if (s.role === 'pitBoss') {
        const i = s.watch.indexOf(c.table);
        if (i >= 0) s.watch.splice(i, 1);
        else if (s.watch.length >= STAFF.pitTables) return reject(g, 'a pit boss watches 3 tables at most');
        else s.watch.push(c.table);
      } else return reject(g, 'only dealers and pit bosses are assigned');
      break;
    }
    case 'accuse': {
      const a = g.agents[c.agent];
      if (!a || a.phase === 'gone' || a.phase === 'leave') return reject(g, 'they are gone');
      if (!g.staff.some((s) => s.role === 'security')) return reject(g, 'there is no security to walk them out');
      g.now.push({ t: 'accused', agent: a.id, guilty: a.cheat !== null });
      if (a.cheat) {
        a.spotted = true;
        dispatch(g, a);
      } else {
        // an honest gambler, accused: they leave, and the strip hears about it
        g.wom -= CHEAT_RULES.wrongRep;
        addHeat(g, HEAT.roughHeat);
        a.ejected = true;
        leave(g, a);
      }
      break;
    }
    case 'transferCash': {
      const to = c.cents;
      if ((to > 0 && to > g.bank) || (to < 0 && -to > g.cage)) return reject(g, 'not that much there');
      g.bank -= to;
      g.cage += to;
      break;
    }
    case 'buyout': {
      const price = buyoutPrice(g);
      if (g.rival.bought) return reject(g, 'already bought');
      if (g.bank < price) return reject(g, "the bank can't cover the price");
      g.bank -= price;
      g.rival.bought = true;
      g.result = 'won';
      g.now.push({ t: 'boughtOut', price });
      g.now.push({ t: 'seasonOver', result: 'won', reason: 'You bought out the Silver Dollar.' });
      break;
    }
    case 'closeSeason':
      g.result = 'lost';
      g.lostReason = 'The Silver Dollar still runs the strip.';
      g.now.push({ t: 'seasonOver', result: 'lost', reason: g.lostReason });
      break;
  }
}

export function commandSystem(g: GameState) {
  const cmds = g.pending;
  g.pending = [];
  for (const c of cmds) {
    g.log.push({ tick: g.tick, cmd: c });
    apply(g, c);
  }
}
