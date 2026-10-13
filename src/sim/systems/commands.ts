// Apply this tick's commands, in the order they were queued, and log them for replay.
import { ECONOMY } from '../../data/economy';
import type { GameDef } from '../../data/games';
import { LIMITS } from '../../data/tables';
import { TIME } from '../../data/time';
import { standUp } from '../choice';
import type { Command } from '../commands';
import { spawnGambler } from './arrivals';
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

function apply(g: GameState, c: Command) {
  const table = 'table' in c ? g.tables[c.table] : undefined;
  if ('table' in c && !table) return reject(g, 'no such table');
  switch (c.t) {
    case 'openTable':
      table!.open = true;
      break;
    case 'closeTable': {
      table!.open = false;
      for (const id of table!.seats) {
        if (id < 0) continue;
        const a = g.agents[id];
        standUp(g, a);
        a.phase = 'choose';
      }
      break;
    }
    case 'setLimits': {
      const ok = c.min >= LIMITS.minFloor && c.min <= LIMITS.minCeil && c.max >= c.min * LIMITS.maxTimesMinLow && c.max <= c.min * LIMITS.maxTimesMinHigh;
      if (!ok) return reject(g, 'limits out of range');
      table!.min = c.min;
      table!.max = c.max;
      break;
    }
    case 'editGame':
      if (c.game.randomizer.kind !== table!.game.randomizer.kind) return reject(g, 'a table keeps its randomizer');
      table!.game = c.game;
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
      spawnGambler(g, c.type);
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
