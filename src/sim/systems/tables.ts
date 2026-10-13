// Tables (DESIGN.md §3): each open table plays a round every ticksPerHour / roundsPerHour ticks
// while anyone is seated. One outcome per round from the table's own stream; every seated bet
// settles against it, in seat order, through the cage (systems/cage.ts).
import { TABLE_KINDS } from '../../data/tables';
import { TIME } from '../../data/time';
import { compile, LOSE } from '../odds/odds';
import { gain, stakeFor } from '../settle';
import type { GameState, TableState } from '../state';

function playRound(g: GameState, t: TableState) {
  const seated = t.seats.filter((id) => id >= 0 && g.agents[id].phase === 'seated');
  if (!seated.length) return;
  const c = compile(t.game);
  const outcome = c.sample(t.rng);
  let bets = 0;
  for (const id of seated) {
    const a = g.agents[id];
    const stake = stakeFor(a.baseBet, a.bankroll, t.min, t.max);
    if (stake < t.min) continue;
    const pays10 = c.ret(a.bet, outcome);
    bets++;
    t.handle += stake;
    g.stats.handle += stake;
    if (pays10 === LOSE) {
      a.bankroll -= stake;
      t.net += stake;
    } else {
      const won = gain(stake, pays10);
      a.bankroll += won;
      t.net -= won;
      if (won > 0) g.now.push({ t: 'win', table: t.id, agent: id, cents: won });
    }
    g.settle.push({ table: t.id, agent: id, stake, pays10 });
  }
  t.rounds++;
  g.stats.rounds++;
  t.last.push({ tick: g.tick, outcome });
  if (t.last.length > 10) t.last.shift();
  g.now.push({ t: 'round', table: t.id, outcome, bets });
}

export function tableSystem(g: GameState) {
  if (g.phase !== 'night' || g.busted || g.nightOver) return;
  for (const t of g.tables) {
    if (!t.open) continue;
    t.acc += TABLE_KINDS[t.kind].roundsPerHour;
    while (t.acc >= TIME.ticksPerHour) {
      t.acc -= TIME.ticksPerHour;
      playRound(g, t);
    }
  }
}
