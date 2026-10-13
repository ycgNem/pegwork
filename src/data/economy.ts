// Money at the start of a season and the cage's logistics (DESIGN.md §4, §6). Cents.

export const ECONOMY = {
  startBank: 400000,
  startCage: 200000,
  /** the armored car: bank to cage, a fee and a delay */
  armoredCarFee: 5000,
  armoredCarHours: 1,
  /** a dealer's wage for one night */
  dealerWage: 4000,
  derivation: 'DESIGN.md §4 and §6: bank $4,000, cage $2,000, armored car $50 and 1 game hour, dealer $40 a night',
} as const;

/** The Sweat (DESIGN.md §6): how many simulated nights the readout runs. */
export const SWEAT = {
  nights: 500,
  /** the editor's color rule for a bust chance: amber from here, red from `red` */
  amber: 0.05,
  red: 0.2,
  derivation: 'DESIGN.md §6: 500 simulated nights of the bet flow; pace test §11.2 keeps the Sweat under 5%',
} as const;

/** The editor's color rule for a house edge (DESIGN.md §2): green from 2% to 12%. */
export const EDGE_RULE = {
  low: 0.02,
  high: 0.12,
  derivation: 'DESIGN.md §2: an edge reads green from 2% to 12%, amber outside, red at or below 0%',
} as const;
