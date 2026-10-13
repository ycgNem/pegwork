// Money (DESIGN.md §5). Cents throughout the sim.

export const ECONOMY = {
  /** bankroll at the start of a run */
  startBankroll: 20000,
  /** stake per marble: the floor, the ceiling, and the share of bankroll it may not exceed */
  minStake: 200,
  maxStake: 2000,
  stakeCap: 0.1,
  /** the stake a new run starts on */
  defaultStake: 1000,
  derivation: 'DESIGN.md §5: bankroll $200, stakes $2–$20 capped at 10% of bankroll, $10 the reference stake',
} as const;

/** The largest stake allowed with this bankroll (cents), never under the floor. */
export function stakeCeiling(bankroll: number): number {
  return Math.max(ECONOMY.minStake, Math.min(ECONOMY.maxStake, Math.floor((bankroll * ECONOMY.stakeCap) / 100) * 100));
}
