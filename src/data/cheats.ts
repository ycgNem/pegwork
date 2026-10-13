// Gambler cheats (DESIGN.md §8): who they pose as, how they take the table, how often they come.

export type CheatKind = 'slider' | 'pastPoster';

export interface CheatDef {
  kind: CheatKind;
  label: string;
  /** the gambler type they dress as (their look and patience) */
  poseAs: 'tourist' | 'local';
  bankroll: [number, number];
  baseBet: [number, number];
  /** which tables they work */
  tables: ('dice' | 'wheel' | 'drum')[];
  /** the slider controls a roll this often (per mille); the past-poster posts on this share of wins */
  rate: number;
  derivation: string;
}

export const CHEATS: Record<CheatKind, CheatDef> = {
  slider: {
    kind: 'slider', label: 'Dice slider', poseAs: 'local', bankroll: [30000, 100000], baseBet: [1000, 2500],
    tables: ['dice'], rate: 250,
    derivation: 'DESIGN.md §8: controls one die 1 roll in 4 at a dice table; $300-1,000, $10-25 bets',
  },
  pastPoster: {
    kind: 'pastPoster', label: 'Past-poster', poseAs: 'tourist', bankroll: [30000, 100000], baseBet: [1000, 2500],
    tables: ['dice', 'wheel'], rate: 1000,
    derivation: 'DESIGN.md §8: slips a second stake onto a winning bet after the result: every win paid double',
  },
};

export const CHEAT_RULES = {
  /** expected independent cheats a night: base + per night after the first (per mille) */
  arrivalsBase: 500,
  arrivalsPerNight: 250,
  /** a caught cheat's winnings tonight go back to the cage; reputation gains this (per mille) */
  caughtRep: 1000,
  /** accusing an honest gambler costs this much reputation (per mille) */
  wrongRep: 2000,
  derivation: 'DESIGN.md §8: 0.5 independent cheats on night 1, +0.25 a night; a catch +1 reputation, a wrong accusation -2',
} as const;
