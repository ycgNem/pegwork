// The physics (DESIGN.md §1): no tunneling, no energy gained on a bounce, everything on the 1/256 grid.
import { describe, expect, it } from 'vitest';
import { BASE_BOARD, BOARD, type BoardDef, type PegDef } from '../src/data/boards';
import { MARBLES } from '../src/data/marbles';
import { PHYSICS } from '../src/data/materials';
import { Rng } from '../src/sim/rng';
import { buildWorld } from '../src/sim/physics/world';
import { spawnMarble, stepMarble, type Marble } from '../src/sim/physics/marble';

/** A dense field: a peg on every site two cells apart, alternate rows offset (gaps of 10 px). */
function denseBoard(): BoardDef {
  const pegs: PegDef[] = [];
  for (let r = 3; r <= 23; r += 2) for (let c = 1 + ((r - 3) / 2) % 2; c <= 18; c += 2) pegs.push({ c, r });
  return { ...BASE_BOARD, id: 'dense', pegs, shoulders: [] };
}

const W = BOARD.cols * BOARD.cell, H = BOARD.rows * BOARD.cell;

describe('physics', () => {
  it('1,000 seeded marbles through a dense field never leave the board except through the cups', () => {
    const board = denseBoard();
    const world = buildWorld(board);
    const rng = new Rng(4242);
    let landed = 0, maxSpeed = 0, escapes = 0;
    for (let i = 0; i < 1000; i++) {
      // some released fast, to test 400 px/s (terminal speed) against the field
      const m = spawnMarble(world, MARBLES.steel, i, rng.int(0, BOARD.cols - 1), rng.next(), rng.int(0, 1e9), 1);
      if (i % 2) { m.vy = 400; m.vx = rng.range(-150, 150); }
      while (stepMarble(world, m) === 'falling') {
        if (m.x < m.r - 1e-9 || m.x > W - m.r + 1e-9 || m.y < m.r - 1e-9 || m.y > H - m.r + 1e-9) escapes++;
        maxSpeed = Math.max(maxSpeed, Math.hypot(m.vx, m.vy));
      }
      expect(m.state).toBe('landed');
      expect(m.cup).toBeGreaterThanOrEqual(0);
      expect(m.cup).toBeLessThan(board.cups.length);
      landed++;
    }
    expect(escapes).toBe(0);
    expect(landed).toBe(1000);
    expect(maxSpeed).toBeLessThanOrEqual(PHYSICS.terminalSpeed);
  });

  it('never tunnels through a peg at terminal speed', () => {
    // straight at a lone peg at 400 px/s from every sub-pixel offset: it always bounces off
    const board: BoardDef = { ...BASE_BOARD, pegs: [{ c: 10, r: 14 }], shoulders: [] };
    const world = buildWorld(board);
    const pegX = 10 * 8 + 4, pegY = 14 * 8 + 4;
    for (let k = 0; k < 64; k++) {
      const m = spawnMarble(world, MARBLES.steel, k, 10, 0.5, 1, 1);
      m.x = pegX + (k - 32) / 16; // within ±2 px of dead center
      m.y = pegY - 40;
      m.vy = 400;
      let hit = false;
      for (let t = 0; t < 30 && m.state === 'falling'; t++) {
        stepMarble(world, m);
        if (m.vy < 0) hit = true;
        expect(Math.hypot(m.x - pegX, m.y - pegY)).toBeGreaterThanOrEqual(m.r + 3 - 1e-6);
      }
      expect(hit).toBe(true);
    }
  });

  it('energy never increases on a bounce', () => {
    const world = buildWorld(denseBoard());
    const rng = new Rng(9);
    let bounces = 0;
    for (let i = 0; i < 200; i++) {
      const m: Marble = spawnMarble(world, MARBLES.steel, i, rng.int(0, 19), rng.next(), rng.int(0, 1e9), 1);
      // speed just before each sub-step's collisions = previous speed with one sub-step of gravity
      while (m.state === 'falling') {
        const before = { vx: m.vx, vy: m.vy, x: m.x, y: m.y };
        let contacts = 0;
        stepMarble(world, m, () => contacts++);
        if (!contacts) continue;
        bounces++;
        // a tick with a bounce: mechanical energy (per unit mass) can only fall, give or take one
        // sub-step's push-out of the marble from the body it touched
        const e0 = 0.5 * (before.vx ** 2 + before.vy ** 2) - PHYSICS.gravity * before.y;
        const e1 = 0.5 * (m.vx ** 2 + m.vy ** 2) - PHYSICS.gravity * m.y;
        expect(e1).toBeLessThanOrEqual(e0 + PHYSICS.gravity * 0.5);
      }
    }
    expect(bounces).toBeGreaterThan(1000);
  });

  it('a head-on bounce keeps the material restitution of the impact speed', () => {
    // straight down onto a lone brass peg at 200 px/s: it comes back up at 0.55 of that
    const world = buildWorld({ ...BASE_BOARD, pegs: [{ c: 10, r: 14 }], shoulders: [] });
    const m = spawnMarble(world, MARBLES.steel, 0, 10, 0.5, 1, 1);
    m.x = 10 * 8 + 4;
    m.y = 14 * 8 + 4 - 6 - 2;
    m.vy = 200;
    let contact = 0;
    while (!contact) stepMarble(world, m, (_b, speed) => (contact = speed));
    expect(contact).toBeGreaterThanOrEqual(200);
    expect(m.vx).toBe(0);
    // the rest of the tick's gravity is at most 4 sub-steps of 2.5 px/s
    expect(m.vy).toBeLessThan(-0.55 * contact + 10);
    expect(m.vy).toBeGreaterThan(-0.55 * contact - 1);
  });

  it('keeps positions and velocities on the 1/256 px grid', () => {
    const world = buildWorld(denseBoard());
    const m = spawnMarble(world, MARBLES.steel, 0, 7, 0.37, 99, 1);
    while (stepMarble(world, m) === 'falling') {
      for (const v of [m.x, m.y, m.vx, m.vy]) expect(Number.isInteger(v * PHYSICS.quantum)).toBe(true);
    }
  });
});
