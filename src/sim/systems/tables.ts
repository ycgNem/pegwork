// Tables (DESIGN.md §3): each open table plays a round every ticksPerHour / pace ticks while anyone
// is seated, at its dealer's pace. One outcome per round from the table's own stream; every seated
// bet settles against it, in seat order, through the cage (systems/cage.ts). Cheats work here
// (DESIGN.md §8): a dice slider controls some rolls, a past-poster doubles their wins; each
// cheating round goes to the cheats system for the pit bosses to spot.
import { CHEATS } from '../../data/cheats';
import { TIME } from '../../data/time';
import { compile, LOSE } from '../odds/odds';
import { gain, stakeFor } from '../settle';
import { tablePace } from '../staff';
import type { GameState, TableState } from '../state';

/** How many times a slider's controlled roll is re-drawn looking for their number. */
const SLIDE_TRIES = 6;

function playRound(g: GameState, t: TableState) {
  const seated = t.seats.filter((id) => id >= 0 && g.agents[id].phase === 'seated');
  if (!seated.length) return;
  const c = compile(t.game);
  let outcome = c.sample(t.rng);
  let cheater = -1;
  // a slider at the table, on one roll in four, slides the dice until their bet comes in
  const slider = seated.map((id) => g.agents[id]).find((a) => a.cheat === 'slider' && !a.ejected);
  if (slider && t.rng.chance(CHEATS.slider.rate / 1000)) {
    for (let k = 0; k < SLIDE_TRIES && c.ret(slider.bet, outcome) === LOSE; k++) outcome = c.sample(t.rng);
    cheater = slider.id;
    g.cheatRounds.push({ table: t.id, agent: slider.id, kind: 'slider' });
    g.now.push({ t: 'cheatRound', table: t.id, agent: slider.id, kind: 'slider' });
  }
  let bets = 0;
  for (const id of seated) {
    const a = g.agents[id];
    const stake = stakeFor(a.baseBet, a.bankroll, t.min, t.max);
    if (stake < t.min) continue;
    let pays10 = c.ret(a.bet, outcome);
    // a past-poster slips a second stake onto the winning bet after the result
    if (a.cheat === 'pastPoster' && pays10 > 0 && !a.ejected) {
      pays10 *= 2;
      cheater = a.id;
      g.cheatRounds.push({ table: t.id, agent: a.id, kind: 'pastPoster' });
      g.now.push({ t: 'cheatRound', table: t.id, agent: a.id, kind: 'pastPoster' });
    }
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
  t.last.push({ tick: g.tick, outcome, cheat: cheater });
  if (t.last.length > 10) t.last.shift();
  g.now.push({ t: 'round', table: t.id, outcome, bets });
}

export function tableSystem(g: GameState) {
  if (g.phase !== 'night' || g.busted || g.nightOver) return;
  for (const t of g.tables) {
    if (!t.open) continue;
    t.acc += tablePace(g, t);
    while (t.acc >= TIME.ticksPerHour) {
      t.acc -= TIME.ticksPerHour;
      playRound(g, t);
    }
  }
}
