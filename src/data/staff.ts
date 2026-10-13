// Staff (DESIGN.md §3, §8, PLAN "Staff"): who works the floor, what each level does, what they
// cost a night. Money in cents; pace per mille of the table's rounds per hour.

export type Role = 'dealer' | 'pitBoss' | 'security' | 'cashier';

export interface RoleDef {
  role: Role;
  label: string;
  /** wage a night by skill level 1-3 */
  wage: [number, number, number];
  derivation: string;
}

export const ROLES: Record<Role, RoleDef> = {
  dealer: { role: 'dealer', label: 'Dealer', wage: [3000, 4000, 5500], derivation: 'DESIGN.md §3: a dealer runs one table; $30 green, $40 standard, $55 veteran a night' },
  pitBoss: { role: 'pitBoss', label: 'Pit boss', wage: [6000, 7500, 9000], derivation: 'DESIGN.md §8: watches up to 3 tables for cheats; $60-90 a night' },
  security: { role: 'security', label: 'Security', wage: [5000, 5000, 6500], derivation: 'DESIGN.md §8: walks a cheat out; $50-65 a night' },
  cashier: { role: 'cashier', label: 'Cashier', wage: [4000, 4000, 4000], derivation: 'DESIGN.md §6: the cage needs one to open the doors; $40 a night' },
};

export const STAFF = {
  /** a dealer's pace by skill (per mille of the table's rounds per hour) */
  dealerPace: [800, 1000, 1250],
  /** a pit boss spots a cheating round with this chance per skill level (per mille) */
  spotPerLevel: 20,
  /** how many tables one pit boss can watch */
  pitTables: 3,
  /** candidates in the hiring hall each day, by role */
  hall: { dealer: 2, pitBoss: 1, security: 2, cashier: 1 } as Record<Role, number>,
  /** a candidate's skill: chance of green / standard / veteran (per mille) */
  skillOdds: [350, 450, 200],
  /** security walks at this many 1/16 px a tick (a brisk 1.5x a gambler's walk) */
  securitySpeed: 28,
  derivation: 'DESIGN.md §3 and §8: dealer pace x0.8 / x1 / x1.25; a pit boss spots 2% a cheating round per level; 3 tables a pit boss',
} as const;

/** The house you open with (DESIGN.md §4): two standard dealers, a standard pit boss, a cashier. */
export const STARTING_STAFF: { members: { role: Role; skill: 1 | 2 | 3 }[]; derivation: string } = {
  members: [
    { role: 'dealer', skill: 2 },
    { role: 'dealer', skill: 2 },
    { role: 'pitBoss', skill: 2 },
    { role: 'cashier', skill: 2 },
  ],
  derivation: 'DESIGN.md §4: two dealers, one pit boss, one cashier, all standard; no security',
};

/** Names for the staff and the hiring hall: invented, ordinary 1970s names. */
export const FIRST_NAMES = ['Sal', 'Dot', 'Vern', 'Marge', 'Eddie', 'Rita', 'Frankie', 'Bev', 'Hank', 'June', 'Ray', 'Gloria', 'Stan', 'Irene', 'Benny', 'Lorraine', 'Mel', 'Pearl', 'Gus', 'Fay', 'Carl', 'Nadine', 'Luis', 'Doreen'];
export const LAST_NAMES = ['Ruiz', 'Kowalski', 'Bianchi', 'Dunn', 'Okafor', 'Marsh', 'Lindqvist', 'Hale', 'Moreno', 'Price', 'Ferraro', 'Quinn', 'Novak', 'Booker', 'Sato', 'Tanner', 'Abernathy', 'Castillo'];
