// The strip (DESIGN.md §7): how many gamblers walk it each night, how they split among the houses,
// and the rival you face in the slice. Money in cents; U is a house's pull in the crowd softmax.

export const STRIP = {
  /** gamblers on the strip on night 1, and the growth a night (per mille) */
  population: 600,
  growth: 80,
  /** U = repWeight x reputation - edgeWeight x the house's posted edge (+ the rival's bonus) */
  repWeight: 0.05,
  edgeWeight: 14,
  /** reputation keeps this much each night (per mille) before tonight's word of mouth is added */
  repKeep: 800,
  /** the other houses (the Showman and the Outfit) as one fixed pull until they arrive in M4 */
  restOfStripU: -0.8,
  /** the slice is this many nights; the day after the last is the last chance to buy */
  sliceNights: 4,
  derivation: 'DESIGN.md §7: 600 gamblers on night 1, +8% a night; share by softmax of 0.05 rep - 14 x edge; you start near 12%',
} as const;

export type RivalMove = 'undercut' | 'billboard' | 'buffet';

export interface RivalDef {
  id: 'undercutter';
  name: string;
  owner: string;
  /** the edge its posted games average, and the floor it will cut to */
  edge: number;
  edgeFloor: number;
  reputation: number;
  cash: number;
  /** what one of its gamblers spends a night, per point of edge (cents per 1.0 edge) */
  spendPerEdge: number;
  /** its nightly costs */
  overhead: number;
  /** the building it sells with */
  buildingValue: number;
  /** what one night of its buffet adds to its pull */
  buffetU: number;
  moves: RivalMove[];
  derivation: string;
}

export const UNDERCUTTER: RivalDef = {
  id: 'undercutter',
  name: 'The Silver Dollar',
  owner: 'Lou Tolliver, the Undercutter',
  edge: 0.045,
  edgeFloor: 0.03,
  reputation: 4,
  cash: 1500000,
  spendPerEdge: 48000,
  overhead: 571800,
  buildingValue: 700000,
  buffetU: 0.4,
  moves: ['undercut', 'billboard', 'buffet', 'undercut', 'billboard', 'buffet'],
  derivation: 'DESIGN.md §7: thin edges (4.5% cutting to 3%), big crowds, a thin margin: about $1,000 a night at the start, priced near $11,000',
};

/** Buyout price (DESIGN.md §7): 5 nights of its recent average profit plus its building. */
export const BUYOUT = {
  nightsOfProfit: 4,
  /** how many recent nights the average uses */
  window: 3,
  derivation: 'DESIGN.md §7: price = 4 x the average of its last 3 nights\' profit + building value, never below the building',
} as const;
