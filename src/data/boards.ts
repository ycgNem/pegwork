// Boards as data (DESIGN.md §1–§2). Parts snap to cells; a part's position is its cell's center.
//
// Rows: row 0 is the hopper above the screen (marbles release there), row 1 is the drop rail
// (drawn at the top of the screen; no parts), rows 26–27 hold the cups. The screen shows rows 1–27
// (DECISIONS.md #9).

export const BOARD = {
  cols: 20,
  rows: 28,
  cell: 8,
  /** the hopper row marbles release in, and the rail row below it: no parts in either */
  hopperRow: 0,
  railRow: 1,
  /** cups sit in the bottom two rows */
  cupRow: 26,
  cupRows: 2,
  derivation: 'DESIGN.md §1: 20 x 28 cells of 8 px (160 x 224 px); hopper and rail rows decided in M0 (DECISIONS.md #9)',
} as const;

export interface PegDef {
  /** cell column and row */
  c: number;
  r: number;
}

export interface CupDef {
  /** first cell column and width in cells */
  c: number;
  span: number;
  mult: number;
}

export interface BoardDef {
  id: string;
  name: string;
  pegs: PegDef[];
  cups: CupDef[];
  /**
   * Rows where the frame has a shoulder: a one-cell 45° lip on each wall that turns the lane along
   * the wall inward (no cell-snapped peg can reach that lane without making a corner pocket a
   * marble could rest in; DECISIONS.md #11).
   */
  shoulders: number[];
  derivation: string;
}

/** Cell `c`'s center in board px. */
export const cellCenter = (c: number) => c * BOARD.cell + BOARD.cell / 2;

/**
 * The base board (DESIGN.md §2): five cups at x0 x1 x3 x1 x0, four cells each, and a staggered
 * field of 24 pegs. The field was tuned in M0 by Dry Run until every column's EV sat in 0.70–0.95
 * with the best column in 0.85–0.95 (the measured numbers are in DESIGN.md §2 and §8.1).
 */
export const BASE_BOARD: BoardDef = {
  id: 'base',
  name: 'Base board',
  pegs: [
    { c: 10, r: 4 },
    { c: 6, r: 8 }, { c: 10, r: 8 }, { c: 12, r: 8 },
    { c: 1, r: 10 }, { c: 5, r: 10 }, { c: 13, r: 10 }, { c: 15, r: 10 }, { c: 17, r: 10 },
    { c: 2, r: 12 }, { c: 4, r: 12 }, { c: 8, r: 12 }, { c: 16, r: 12 },
    { c: 3, r: 14 }, { c: 7, r: 14 },
    { c: 14, r: 16 }, { c: 18, r: 16 },
    { c: 1, r: 18 }, { c: 7, r: 18 }, { c: 9, r: 18 }, { c: 11, r: 18 },
    { c: 2, r: 20 }, { c: 10, r: 20 },
    { c: 17, r: 22 },
  ],
  cups: [
    { c: 0, span: 4, mult: 0 },
    { c: 4, span: 4, mult: 1 },
    { c: 8, span: 4, mult: 3 },
    { c: 12, span: 4, mult: 1 },
    { c: 16, span: 4, mult: 0 },
  ],
  shoulders: [3],
  derivation: 'DESIGN.md §2: the base board loses money on purpose; the peg field is the M0 tuning recorded in DECISIONS.md',
};
