// Staff helpers (DESIGN.md §3, §8): making staff, the hiring hall, who deals which table and at
// what pace, who watches it, where security waits.
import { FIRST_NAMES, LAST_NAMES, ROLES, STAFF, type Role } from '../data/staff';
import { TABLE_KINDS } from '../data/tables';
import { center } from './floor';
import type { GameState, StaffMember, TableState } from './state';

export function makeStaff(g: GameState, role: Role, skill: 1 | 2 | 3): StaffMember {
  const r = g.staffRng;
  const [px, py] = securityPost(g);
  return {
    id: g.nextStaff++, role, skill,
    name: `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`,
    table: -1, watch: [],
    x: center(px), y: center(py), px: center(px), py: center(py), tx: px, ty: py, target: -1,
  };
}

/** Today's candidates: a fixed count per role, each skill rolled from STAFF.skillOdds. */
export function rollHall(g: GameState) {
  g.hall = [];
  for (const role of Object.keys(STAFF.hall) as Role[])
    for (let i = 0; i < STAFF.hall[role]; i++) {
      const roll = g.staffRng.int(0, 999);
      const skill = roll < STAFF.skillOdds[0] ? 1 : roll < STAFF.skillOdds[0] + STAFF.skillOdds[1] ? 2 : 3;
      g.hall.push(makeStaff(g, role, skill));
    }
}

export const wageOf = (s: StaffMember) => ROLES[s.role].wage[s.skill - 1];

export const dealerOf = (g: GameState, table: number) => g.staff.find((s) => s.role === 'dealer' && s.table === table);

/** Rounds per game hour at this table: its kind's pace times its dealer's (DESIGN.md §3). */
export function tablePace(g: GameState, t: TableState): number {
  const d = dealerOf(g, t.id);
  const k = d ? STAFF.dealerPace[d.skill - 1] : 0;
  return Math.round((TABLE_KINDS[t.kind].roundsPerHour * k) / 1000);
}

/** The pit bosses watching a table. */
export const watchers = (g: GameState, table: number) => g.staff.filter((s) => s.role === 'pitBoss' && s.watch.includes(table));

/** Where security waits: just inside the door, to its left. */
export function securityPost(g: GameState): [number, number] {
  const [dx, dy] = g.floor.door;
  return [Math.max(0, dx - 1), dy - 1];
}

/** A dealer's tile beside their table. */
export function dealerTile(t: TableState): [number, number] {
  const [dx, dy] = TABLE_KINDS[t.kind].dealer;
  return [t.x + dx, t.y + dy];
}
