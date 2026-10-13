// Gaffs and Heat (DESIGN.md §8): the shaved dice, who spots them, and what Heat brings.

export type ShaveSide = 'low' | 'high';

/** A table's gaff: dice shaved to favor one side, light (1) to heavy (3). */
export interface Gaff { side: ShaveSide; strength: 1 | 2 | 3 }

export const SHAVE = {
  /** a fair face's weight; each favored face of a shaved die weighs base + strength */
  base: 6,
  labels: ['light', 'medium', 'heavy'] as const,
  derivation: 'DESIGN.md §8: shaved dice tilt toward 1-3 or 4-6; a favored face weighs 6 + strength (1-3) against 6',
} as const;

export const HEAT = {
  /** a seated gambler reads the dice in a round with sharpness x strength x this (per million) */
  gamblerSpot: 1000,
  /** the inspector watching a gaffed table reads it in a round with strength x this (per mille) */
  inspectorSpot: 20,
  /** heat a gambler's spotting adds, and an inspector's finding */
  gamblerHeat: 15,
  inspectorHeat: 25,
  /** word of mouth from a gambler who reads the dice and walks out telling people (per mille) */
  spotWom: 1000,
  /** a rough ejection (an honest gambler walked out) */
  roughHeat: 3,
  coolPerNight: 5,
  /** from this heat an inspector comes every night; below it, with chance heat / 100 */
  inspectorEvery: 50,
  raidAt: 75,
  licenseAt: 100,
  /** a raid fines this much of the cage (per mille) */
  raidFine: 250,
  /** the inspector walks in this many hours after the doors open (a seeded draw between) */
  inspectorArrive: [1, 4] as [number, number],
  /** and watches each open table this long, up to this many tables */
  inspectorHours: 1,
  inspectorTables: 3,
  derivation: 'DESIGN.md §8: a gambler spots 0.001 x sharpness x strength a round, the inspector 0.02 x strength; +15 / +25 heat; cools 5 a night; inspector every night from 50, raid at 75 (25% of the cage), license at 100',
} as const;
