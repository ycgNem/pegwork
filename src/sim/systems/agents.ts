// Agents (DESIGN.md §1, §5): gamblers choose a table, walk to its seat on the flow field, sit, and
// get up at their stop-loss, their win goal, or the end of their patience, then walk out.
import { TIME } from '../../data/time';
import { chooseTable, claim, standUp } from '../choice';
import { walkTo } from '../floor';
import type { Gambler, GameState } from '../state';

/** 2 tiles a game minute: 32 px per 27 ticks, in 1/16 px a tick (DESIGN.md §1) */
export const WALK_SPEED = 19;
/** a gambler who can't find a seat for this long leaves */
const WAIT_TICKS = 10 * TIME.ticksPerMinute;

export function leave(g: GameState, a: Gambler) {
  standUp(g, a);
  a.phase = 'leave';
  [a.tx, a.ty] = g.floor.door;
  g.now.push({ t: 'left', agent: a.id, type: a.type, net: a.bankroll - a.start, start: a.start, minutes: Math.floor(a.age / TIME.ticksPerMinute), quiet: a.cheat !== null || a.ejected });
}

export function agentSystem(g: GameState) {
  if (g.phase !== 'night') return;
  for (const a of g.agents) {
    if (a.phase === 'gone') continue;
    a.px = a.x;
    a.py = a.y;
    a.age++;
    switch (a.phase) {
      case 'choose': {
        const pick = g.busted ? null : chooseTable(g, a);
        if (pick) claim(g, a, pick);
        else if (++a.waited > WAIT_TICKS || g.busted) leave(g, a);
        break;
      }
      case 'walk':
        if (walkTo(g, a, WALK_SPEED)) {
          a.phase = 'seated';
          g.now.push({ t: 'seated', agent: a.id, table: a.table, seat: a.seat });
        }
        break;
      case 'seated': {
        const t = g.tables[a.table];
        a.patience--;
        const down = a.start - a.bankroll;
        if (a.patience <= 0 || a.bankroll < t.min || down * 1000 >= a.start * a.stopLoss || a.bankroll >= a.winGoal || g.busted) leave(g, a);
        break;
      }
      case 'leave':
        if (walkTo(g, a, WALK_SPEED)) a.phase = 'gone';
        break;
    }
  }
}
