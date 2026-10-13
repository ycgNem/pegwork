// The sawdust joint's floor (DESIGN.md §1, §4): 16 x 11 tiles of 16 px, the entrance in the
// bottom wall, the cage and the bar against the top wall, and the two starter tables.
import type { TableKind } from './tables';

export const TILE = 16;

export type FixtureKind = 'cage' | 'bar' | 'entrance';

export interface FloorDef {
  w: number;
  h: number;
  /** the entrance tile: gamblers arrive and leave here */
  door: [number, number];
  fixtures: { kind: FixtureKind; x: number; y: number; w: number; h: number }[];
  tables: { kind: TableKind; game: 'hiLo' | 'redWheel' | 'luckyDrum'; x: number; y: number }[];
  derivation: string;
}

export const SAWDUST_JOINT: FloorDef = {
  w: 16,
  h: 11,
  door: [7, 10],
  fixtures: [
    { kind: 'cage', x: 0, y: 0, w: 3, h: 2 },
    { kind: 'bar', x: 11, y: 0, w: 5, h: 1 },
    { kind: 'entrance', x: 7, y: 10, w: 2, h: 1 },
  ],
  tables: [
    { kind: 'dice', game: 'hiLo', x: 2, y: 5 },
    { kind: 'wheel', game: 'redWheel', x: 11, y: 5 },
  ],
  derivation: 'DESIGN.md §1 and §4: a 16x11 joint, two starter tables (Hi-Lo Dice, Red Wheel), a cage, a bar, an entrance',
};
