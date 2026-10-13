// Pace tests (DESIGN.md §11) at slice scale: bots play whole seasons headless on 20 seeds.
import { describe, expect, it } from 'vitest';
import { GREEDY, runSeason, TUNER } from '../src/sim/bots';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('pace §11.1: the greedy starter loses', () => {
  const greedy = SEEDS.map((s) => runSeason(s, GREEDY));
  const tuner = SEEDS.map((s) => runSeason(s, TUNER));
  const wins = (rs: typeof greedy) => rs.filter((r) => r.result === 'won').length;

  it('a bot that never edits a paytable wins at most 20% of seasons', () => {
    expect(wins(greedy)).toBeLessThanOrEqual(4);
  });

  // measured over 60 seeds (DESIGN.md §11.1): greedy 7%, tuner 28%; 20 seeds land near 2 and 6
  it('a bot that brings every bet to about 8% wins at least 25%, and at least twice as often', () => {
    expect(wins(tuner)).toBeGreaterThanOrEqual(5);
    expect(wins(tuner)).toBeGreaterThanOrEqual(2 * Math.max(1, wins(greedy)));
  });

  it('the greedy house loses the crowd: by night 4 its share is below where it started on 80% of seeds', () => {
    const late = greedy.filter((r) => r.shares.length >= 4);
    expect(late.length).toBeGreaterThan(10);
    expect(late.filter((r) => r.shares[3] < r.shares[0]).length).toBeGreaterThanOrEqual(Math.ceil(0.8 * late.length));
  });

  it('a whole season replays from its log', async () => {
    const { Game } = await import('../src/sim/Game');
    const r = tuner[0];
    const again = Game.replay({ seed: r.seed }, r.game.s.log, r.game.s.tick);
    expect(again.hash()).toBe(r.game.hash());
  });
});
