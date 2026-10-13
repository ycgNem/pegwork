// Marbles (DESIGN.md §4). Milestone 0 has Steel only; the other five and their rules are Milestone 1.

export type MarbleId = 'steel';

export interface MarbleDef {
  id: MarbleId;
  name: string;
  /** $ each */
  cost: number;
  mass: number;
  /** multiplies every surface's restitution (capped at 1: a bounce never adds energy) */
  restitutionMod: number;
  /** sprite name prefix; frames are `<sprite>:0..3` (the 4-frame shine) */
  sprite: string;
  derivation: string;
}

export const MARBLES: Record<MarbleId, MarbleDef> = {
  steel: { id: 'steel', name: 'Steel', cost: 2, mass: 1, restitutionMod: 1, sprite: 'marble:steel', derivation: 'DESIGN.md §4: the standard marble' },
};
