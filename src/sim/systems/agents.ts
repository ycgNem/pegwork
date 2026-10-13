// Agents (DESIGN.md §1, §5): gamblers choose a table, walk to its seat on the flow field, sit, and
// get up at their stop-loss, their win goal, or the end of their patience, then walk out.
import { TIME } from '../../data/time';
import { chooseTable, claim, standUp } from '../choice';
import { center, flowField, nextStep, tileOf } from '../floor';
import type { Gambler, GameState } from '../state';

/** 2 tiles a game minute: 32 px per 27 ticks, in 1/16 px a tick (DESIGN.md §1) */
export const WALK_SPEED = 19;
/** a gambler who can't find a seat for this long leaves */
const WAIT_TICKS = 10 * TIME.ticksPerMinute;

export function leave(g: GameState, a: Gambler) {
  standUp(g, a);
  a.phase = 'leave';
  [a.tx, a.ty] = g.floor.door;
  g.now.push({ t: 'left', agent: a.id, type: a.type, net: a.bankroll - a.start, start: a.start, minutes: Math.floor(a.age / TIME.ticksPerMinute) });
}

const toward = (v: number, goal: number, step: number) => (v < goal ? Math.min(goal, v + step) : Math.max(goal, v - step));

/** Move one tick along the flow field toward (tx, ty); true when standing on its center. */
function walk(g: GameState, a: Gambler): boolean {
  const cx = tileOf(a.x), cy = tileOf(a.y);
  const gx = center(a.tx), gy = center(a.ty);
  if (cx === a.tx && cy === a.ty) {
    a.x = toward(a.x, gx, WALK_SPEED);
    a.y = toward(a.y, gy, WALK_SPEED);
    return a.x === gx && a.y === gy;
  }
  const f = flowField(g, a.tx, a.ty);
  const next = nextStep(g, f, cx, cy);
  if (!next) {
    // off the field (the floor changed under them): step straight there
    a.x = gx;
    a.y = gy;
    return true;
  }
  const [nx, ny] = next;
  // axis-aligned: line up on the current tile's center across the direction of travel first
  if (nx !== cx) {
    if (a.y !== center(cy)) a.y = toward(a.y, center(cy), WALK_SPEED);
    else a.x = toward(a.x, center(nx), WALK_SPEED);
  } else {
    if (a.x !== center(cx)) a.x = toward(a.x, center(cx), WALK_SPEED);
    else a.y = toward(a.y, center(ny), WALK_SPEED);
  }
  return false;
}

export function agentSystem(g: GameState) {
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
        if (walk(g, a)) {
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
        if (walk(g, a)) a.phase = 'gone';
        break;
    }
  }
}
