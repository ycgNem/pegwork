// Physics constants and surface materials (DESIGN.md §1). Every number carries its derivation.
// Changing anything here changes every distribution in the game: ask the owner first (CLAUDE.md).

export interface Physics {
  /** simulation ticks per second */
  tickHz: number;
  /** physics sub-steps per tick */
  subSteps: number;
  /** px/s² */
  gravity: number;
  /** px/s; speed is clamped to this */
  terminalSpeed: number;
  /** px */
  marbleRadius: number;
  /** px */
  pegRadius: number;
  /** positions and velocities are kept on a grid of this many steps per px */
  quantum: number;
  /** px of seeded jitter either side of a column's center at release */
  dropJitter: number;
  /** the jitter never falls closer than this to dead center (px): a dead-center drop onto a peg
   * would balance on it, its roll-off too small for the 1/256 grid to see (DECISIONS.md #13) */
  dropJitterMin: number;
  derivation: string;
}

export const PHYSICS: Physics = {
  tickHz: 60,
  subSteps: 4,
  gravity: 600,
  terminalSpeed: 400,
  marbleRadius: 3,
  pegRadius: 3,
  quantum: 256,
  dropJitter: 1,
  dropJitterMin: 1 / 16,
  derivation: 'DESIGN.md §1: tick 1/60 s, 4 sub-steps (400 px/s moves 1.67 px per sub-step < r), g 600, terminal 400, r 3, 1/256 px, ±1 px jitter clear of the center by 1/16 px',
};

/**
 * The rail tap: a marble that has almost stopped (balanced on a peg top, wedged against a wall) for
 * `stillTicks` gets a sideways tap of `tapSpeed`, direction from its own seeded stream. A marble
 * still in play after `jamTicks` is jammed and pays nothing (a test asserts this never happens).
 */
export const RAIL_TAP = {
  stillSpeed: 4,
  stillTicks: 30,
  tapSpeed: 24,
  jamTicks: 1800,
  derivation: 'DESIGN.md §1 (the rail tap): below 4 px/s for half a second; a 24 px/s tap moves a marble off a 3 px peg top within a few ticks; 30 s cap',
};

export type MaterialId = 'peg' | 'bumper' | 'wall' | 'cupWall';

export interface Material {
  id: MaterialId;
  /** share of the normal speed kept on a bounce */
  restitution: number;
  /** share of the tangential speed lost per contact */
  friction: number;
  derivation: string;
}

export const MATERIALS: Record<MaterialId, Material> = {
  peg: { id: 'peg', restitution: 0.55, friction: 0.02, derivation: 'DESIGN.md §1: brass peg, a lively but losing bounce' },
  bumper: { id: 'bumper', restitution: 0.95, friction: 0.02, derivation: 'DESIGN.md §1 and §3: deflects hard' },
  wall: { id: 'wall', restitution: 0.4, friction: 0.02, derivation: 'DESIGN.md §1: the wooden frame soaks up a bounce' },
  cupWall: { id: 'cupWall', restitution: 0.2, friction: 0.02, derivation: 'DESIGN.md §1: tin cups keep what lands in them' },
};
