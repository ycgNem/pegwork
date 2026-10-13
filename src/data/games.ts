// Randomizers, bets and the starter games (DESIGN.md §2). A game is a randomizer plus a bet menu;
// each bet's paytable entry is in tenths ("pays10": 40 = 4 to 1, 15 = 3 to 2). The exact odds of
// every bet are computed by src/sim/odds, never stored here.

export type PocketColor = 'red' | 'black' | 'house';

export type RandomizerDef =
  /** n dice of `faces` sides; `weights` (one integer per face, all 1 when fair) is a gaff: shaved dice */
  | { kind: 'dice'; count: number; faces: number; weights?: number[] }
  /** a wheel of pockets; `weights` (one integer per pocket, all 1 when fair) is a gaff: a brake */
  | { kind: 'wheel'; pockets: PocketColor[]; weights?: number[] }
  /** a drum of `balls` numbered balls, `drawn` of them drawn each round */
  | { kind: 'drum'; balls: number; drawn: number };

export type BetDef =
  /** dice: the sum of the dice is one of `sums` */
  | { id: string; label: string; kind: 'sum'; sums: number[]; pays10: number }
  /** dice: every die shows the same face */
  | { id: string; label: string; kind: 'allSame'; pays10: number }
  /** wheel: the pocket is this color */
  | { id: string; label: string; kind: 'color'; color: PocketColor; pays10: number }
  /** wheel: the pocket is one of these (by index) */
  | { id: string; label: string; kind: 'pockets'; pockets: number[]; pays10: number }
  /** drum: the gambler picks `picks` numbers; pays10ByHits[k] is paid for k hits (-1 = lose) */
  | { id: string; label: string; kind: 'catch'; picks: number; pays10ByHits: number[] };

export interface GameDef {
  id: string;
  name: string;
  randomizer: RandomizerDef;
  bets: BetDef[];
  derivation?: string;
}

/**
 * 24 pockets: the two house pockets opposite each other (0 and 12), and red and black alternating
 * between them, the pattern flipping at 12 so the colors still alternate around it: 11 of each.
 */
const RED_WHEEL_POCKETS: PocketColor[] = (() => {
  const p: PocketColor[] = [];
  for (let i = 0; i < 24; i++) p.push(i === 0 || i === 12 ? 'house' : (i % 2) === (i < 12 ? 1 : 0) ? 'red' : 'black');
  return p;
})();

export const STARTER_GAMES: Record<'hiLo' | 'redWheel' | 'luckyDrum', GameDef> = {
  hiLo: {
    id: 'hiLo',
    name: 'Hi-Lo Dice',
    derivation: 'DESIGN.md §2: every bet 16.7% (High/Low 15/36 at 1:1, Seven and Doubles 6/36 at 4:1)',
    randomizer: { kind: 'dice', count: 2, faces: 6 },
    bets: [
      { id: 'high', label: 'High 8-12', kind: 'sum', sums: [8, 9, 10, 11, 12], pays10: 10 },
      { id: 'low', label: 'Low 2-6', kind: 'sum', sums: [2, 3, 4, 5, 6], pays10: 10 },
      { id: 'seven', label: 'Any Seven', kind: 'sum', sums: [7], pays10: 40 },
      { id: 'doubles', label: 'Doubles', kind: 'allSame', pays10: 40 },
    ],
  },
  redWheel: {
    id: 'redWheel',
    name: 'Red Wheel',
    derivation: 'DESIGN.md §2: 24 pockets, 11 red 11 black 2 house; colors 8.3%, one pocket at 20:1 12.5%',
    randomizer: { kind: 'wheel', pockets: RED_WHEEL_POCKETS },
    bets: [
      { id: 'red', label: 'Red', kind: 'color', color: 'red', pays10: 10 },
      { id: 'black', label: 'Black', kind: 'color', color: 'black', pays10: 10 },
      { id: 'pocket', label: 'One Pocket', kind: 'pockets', pockets: [7], pays10: 200 },
    ],
  },
  luckyDrum: {
    id: 'luckyDrum',
    name: 'Lucky Drum',
    derivation: 'DESIGN.md §2: 40 balls, 10 drawn; Pick 1 at 2.5:1 is 12.5%, Pick 3 (2 hits 2:1, 3 hits 40:1) is 9.2%',
    randomizer: { kind: 'drum', balls: 40, drawn: 10 },
    bets: [
      { id: 'pick1', label: 'Pick 1', kind: 'catch', picks: 1, pays10ByHits: [-1, 25] },
      { id: 'pick3', label: 'Pick 3', kind: 'catch', picks: 3, pays10ByHits: [-1, -1, 20, 400] },
    ],
  },
};

export const GAMES_DERIVATION = {
  derivation: 'DESIGN.md §2: the starter games are deliberately greedy (16.7% dice, 8.3-12.5% wheel); the drum is layer 0\'s third randomizer, 40 balls, 10 drawn (§3)',
} as const;
