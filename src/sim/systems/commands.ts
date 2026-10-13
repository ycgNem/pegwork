// Commands: apply what the player (or a bot) asked for since the last tick, in order.
import { BOARD } from '../../data/boards';
import { MARBLES } from '../../data/marbles';
import { ECONOMY, stakeCeiling } from '../../data/economy';
import { dropDraw } from '../dryrun';
import { buildWorld } from '../physics/world';
import { spawnMarble } from '../physics/marble';
import type { GameState } from '../state';

export function commandSystem(g: GameState) {
  const cmds = g.pending;
  g.pending = [];
  // stakes already committed this tick (the bankroll system takes them after physics)
  let committed = 0;
  for (const cmd of cmds) {
    g.log.push({ tick: g.tick, cmd });
    switch (cmd.t) {
      case 'setStake': {
        const c = Math.round(cmd.cents / 100) * 100;
        g.stake = Math.max(ECONOMY.minStake, Math.min(stakeCeiling(g.bankroll), c));
        break;
      }
      case 'drop': {
        if (!Number.isInteger(cmd.column) || cmd.column < 0 || cmd.column >= BOARD.cols) {
          g.now.push({ t: 'rejected', reason: 'no such column' });
          break;
        }
        const stake = Math.min(g.stake, stakeCeiling(g.bankroll - committed));
        if (g.bankroll - committed < stake) {
          g.now.push({ t: 'rejected', reason: 'bankroll' });
          break;
        }
        committed += stake;
        const [u, seed] = dropDraw(g.rng);
        const m = spawnMarble(buildWorld(g.board), MARBLES[g.marble], g.nextMarble++, cmd.column, u, seed, stake);
        g.marbles.push(m);
        g.now.push({ t: 'dropped', marble: m.id, column: cmd.column, stake });
        break;
      }
    }
  }
}
