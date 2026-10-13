// The engine tooling that survived the wipe (DECISIONS #29): the seeded RNG is deterministic.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/engine/rng';

describe('engine', () => {
  it('the same seed gives the same stream', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
});
