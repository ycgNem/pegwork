// Table kinds (DESIGN.md §3): seats, pace, footprint on the 16 px floor grid, and where the seats
// are relative to the table's top-left tile. Gamblers sit on the seat tiles.

export type TableKind = 'dice' | 'wheel' | 'drum';

export interface TableKindDef {
  kind: TableKind;
  /** footprint in tiles */
  w: number;
  h: number;
  /** rounds per game hour with a standard dealer */
  roundsPerHour: number;
  cost: number;
  /** seat tiles relative to the table's top-left tile, in seat order */
  seats: [number, number][];
  /** where the dealer stands, relative to the top-left tile */
  dealer: [number, number];
  derivation: string;
}

export const TABLE_KINDS: Record<TableKind, TableKindDef> = {
  dice: {
    kind: 'dice', w: 3, h: 2, roundsPerHour: 80, cost: 120000,
    seats: [[0, -1], [1, -1], [2, -1], [0, 2], [1, 2], [2, 2]], dealer: [-1, 0],
    derivation: 'DESIGN.md §3: 6 seats, 80 rounds/hour, 3x2 tiles, $1,200',
  },
  wheel: {
    kind: 'wheel', w: 2, h: 2, roundsPerHour: 45, cost: 150000,
    seats: [[0, -1], [1, -1], [-1, 1], [2, 1], [0, 2], [1, 2]], dealer: [-1, 0],
    derivation: 'DESIGN.md §3: 6 seats, 45 rounds/hour, 2x2 tiles, $1,500',
  },
  drum: {
    kind: 'drum', w: 3, h: 2, roundsPerHour: 12, cost: 180000,
    seats: [[0, -1], [1, -1], [2, -1], [-1, 1], [3, 1], [0, 2], [1, 2], [2, 2]], dealer: [-1, 0],
    derivation: 'DESIGN.md §3: 8 seats, 12 draws/hour, 3x2 tiles, $1,800',
  },
};

export const LIMITS = {
  /** a table's minimum bet may be set between these (cents) */
  minFloor: 100,
  minCeil: 2500,
  /** its maximum is this many times its minimum */
  maxTimesMinLow: 5,
  maxTimesMinHigh: 100,
  /** a new table's limits */
  defaultMin: 200,
  defaultMax: 5000,
  derivation: 'DESIGN.md §3: minimum $1-$25, maximum x5 to x100 of it, layer-0 default $2-$50',
} as const;
