// Gambler types and how a gambler picks a table and a bet (DESIGN.md §5). Fractions are per mille
// so the sim's state stays whole numbers; money in cents; patience in game minutes.

export type GamblerType = 'tourist' | 'local' | 'conventioneer' | 'highRoller';

export interface GamblerTypeDef {
  type: GamblerType;
  label: string;
  bankroll: [number, number];
  baseBet: [number, number];
  patienceMin: number;
  thrill: number;
  sharpness: number;
  /** word of mouth added to tomorrow's reputation when leaving up 50% or more */
  wom: number;
  /** leaves after losing this share of the session bankroll */
  stopLoss: number;
  /** leaves after reaching this multiple of the session bankroll */
  winGoal: [number, number];
  /** share of the night's arrivals (whales come by their own schedule, §6) */
  arrivalWeight: number;
  derivation: string;
}

export const GAMBLER_TYPES: Record<GamblerType, GamblerTypeDef> = {
  tourist: {
    type: 'tourist', label: 'Tourist', bankroll: [6000, 20000], baseBet: [200, 500], patienceMin: 90,
    thrill: 500, sharpness: 100, wom: 1000, stopLoss: 800, winGoal: [1500, 3000], arrivalWeight: 60,
    derivation: 'DESIGN.md §5: $60-200, $2-5 bets, 90 min, thrill 0.5, sharpness 0.1, WoM 1.0, stops 80% down',
  },
  local: {
    type: 'local', label: 'Local', bankroll: [10000, 30000], baseBet: [500, 500], patienceMin: 150,
    thrill: 200, sharpness: 600, wom: 600, stopLoss: 600, winGoal: [1500, 2000], arrivalWeight: 25,
    derivation: 'DESIGN.md §5: $100-300, $5 bets, 150 min, thrill 0.2, sharpness 0.6, WoM 0.6, stops at 60% down',
  },
  conventioneer: {
    type: 'conventioneer', label: 'Conventioneer', bankroll: [20000, 50000], baseBet: [500, 1000], patienceMin: 60,
    thrill: 600, sharpness: 200, wom: 1500, stopLoss: 800, winGoal: [1500, 3000], arrivalWeight: 15,
    derivation: 'DESIGN.md §5: $200-500, $5-10 bets, 60 min, thrill 0.6, sharpness 0.2, WoM 1.5, stops 80% down',
  },
  highRoller: {
    type: 'highRoller', label: 'High roller', bankroll: [500000, 5000000], baseBet: [10000, 100000], patienceMin: 120,
    thrill: 700, sharpness: 500, wom: 4000, stopLoss: 1000, winGoal: [1500, 3000], arrivalWeight: 0,
    derivation: 'DESIGN.md §5: $5,000-50,000, $100-1,000 bets, 120 min, thrill 0.7, sharpness 0.5, WoM 4.0',
  },
};

/** How a free gambler scores a table's best bet for them: DESIGN.md §5's choice formula. */
export const CHOICE = {
  hit: 1.0,
  top: 0.6,
  buzz: 0.4,
  edge: 8,
  walk: 0.05,
  /** softmax temperature over tables */
  temperature: 0.25,
  /** SD of the noise on a gambler's sense of the edge, scaled by (1 - sharpness) */
  edgeNoise: 0.04,
  derivation: 'DESIGN.md §5: score = 1.0 H + 0.6 thrill log2(top) + 0.4 buzz - 8 sharpness perceivedEdge - 0.05 walk, softmax at T 0.25',
} as const;

/** When tonight's crowd (DESIGN.md §7: the strip times your share) walks in. */
export const CROWD = {
  /** arrivals come in the first 8 game hours, evenly */
  arrivalHours: 8,
  derivation: 'DESIGN.md §1: arrivals at an even seeded rate over the first 8 game hours (8pm-4am)',
} as const;
