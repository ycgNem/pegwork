// The odds calculator (DESIGN.md §2): the starter table is exact, a seeded simulation agrees within
// its error, and a gaff moves the true odds while the apparent odds stay put.
import { describe, expect, it } from 'vitest';
import { STARTER_GAMES, type GameDef } from '../src/data/games';
import { Rng } from '../src/engine/rng';
import { betOdds, compile, isGaffed, LOSE } from '../src/sim/odds/odds';
import { rat, str } from '../src/sim/odds/rational';

const { hiLo, redWheel, luckyDrum } = STARTER_GAMES;
const idx = (g: GameDef, id: string) => g.bets.findIndex((b) => b.id === id);

describe('odds: the starter table in DESIGN.md §2', () => {
  const rows: [GameDef, string, string, number, number][] = [
    // game, bet, exact edge, sigma, hit rate
    [hiLo, 'high', '1/6', 0.986, 15 / 36],
    [hiLo, 'low', '1/6', 0.986, 15 / 36],
    [hiLo, 'seven', '1/6', 1.863, 6 / 36],
    [hiLo, 'doubles', '1/6', 1.863, 6 / 36],
    [redWheel, 'red', '1/12', 0.9965, 11 / 24],
    [redWheel, 'black', '1/12', 0.9965, 11 / 24],
    [redWheel, 'pocket', '1/8', 4.196, 1 / 24],
    [luckyDrum, 'pick1', '1/8', 1.516, 1 / 4],
  ];
  for (const [game, bet, edge, sigma, hit] of rows)
    it(`${game.name} ${bet}: edge ${edge}`, () => {
      const o = betOdds(game, idx(game, bet));
      expect(str(o.edgeExact)).toBe(edge);
      expect(o.sigma).toBeCloseTo(sigma, 3);
      expect(o.hit).toBeCloseTo(hit, 12);
    });

  it('Lucky Drum pick 3: 2 hits at 2:1, 3 hits at 40:1 is a 9.2% edge (hypergeometric, exact)', () => {
    // P(2) = C(3,2)C(37,8)/C(40,10), P(3) = C(37,7)/C(40,10)
    const o = betOdds(luckyDrum, idx(luckyDrum, 'pick3'));
    expect(o.edge).toBeCloseTo(0.0923, 3);
    expect(o.edgeExact.d % 1n).toBe(0n);
  });
});

describe('odds: simulation agrees with the exact math', () => {
  for (const game of [hiLo, redWheel, luckyDrum])
    it(`${game.name}: 20,000 seeded rounds land within 4 standard errors on every bet`, () => {
      const c = compile(game), rng = new Rng(7);
      const sums = game.bets.map(() => 0);
      const N = 20000;
      for (let i = 0; i < N; i++) {
        const o = c.sample(rng);
        game.bets.forEach((_, b) => {
          const r = c.ret(b, o);
          sums[b] += r === LOSE ? 0 : 1 + r / 10;
        });
      }
      game.bets.forEach((_, b) => {
        const odds = betOdds(game, b);
        const se = odds.sigma / Math.sqrt(N);
        expect(Math.abs(sums[b] / N - (1 - odds.edge))).toBeLessThan(4 * se);
      });
    });
});

describe('odds: gaffs', () => {
  it('shaved dice (sixes and ones heavier) change the true odds, not the apparent ones', () => {
    const shaved: GameDef = { ...hiLo, randomizer: { kind: 'dice', count: 2, faces: 6, weights: [3, 2, 2, 2, 2, 3] } };
    expect(isGaffed(shaved)).toBe(true);
    expect(isGaffed(hiLo)).toBe(false);
    const d = idx(hiLo, 'doubles');
    const truth = betOdds(shaved, d), seen = betOdds(shaved, d, true);
    expect(str(seen.edgeExact)).toBe('1/6');
    // doubles: (9+4+4+4+4+9)/14^2 = 34/196, x5 back = 170/196, edge 26/196 = 13/98
    expect(str(truth.edgeExact)).toBe(str(rat(13, 98)));
    expect(truth.edge).toBeLessThan(seen.edge);
  });
});
