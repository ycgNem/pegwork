// The 1/256 px grid every position and velocity lives on after each sub-step (DESIGN.md §1).
// Positions round to the nearest step; velocities round toward zero, so rounding can never add
// speed (a bounce never gains energy, even by a rounding error).
import { PHYSICS } from '../../data/materials';

const Q = PHYSICS.quantum;

export const qpos = (v: number) => Math.round(v * Q) / Q;
export const qvel = (v: number) => Math.trunc(v * Q) / Q;
