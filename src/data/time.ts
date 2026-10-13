// The clock (DESIGN.md §1). A night runs 8pm to 6am; the sim counts ticks from the doors opening.

export const TIME = {
  /** sim ticks per real second */
  tickRate: 60,
  /** ticks in one game hour at 1x (27 s) */
  ticksPerHour: 1620,
  /** ticks in one game minute */
  ticksPerMinute: 27,
  /** the night is 10 game hours, 8pm to 6am */
  nightHours: 10,
  /** the hour on the clock when the doors open (24 h) */
  openHour: 20,
  derivation: 'DESIGN.md §1: 1 game hour = 27 s at 1x, a night 8pm-6am = 4.5 min, a 10-night season about 60 min',
} as const;

export const NIGHT_TICKS = TIME.ticksPerHour * TIME.nightHours;

/** "9:42 PM" for a tick count since the doors opened. */
export function clockLabel(tick: number): string {
  const minutes = Math.floor(tick / TIME.ticksPerMinute);
  const h24 = (TIME.openHour + Math.floor(minutes / 60)) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m < 10 ? '0' : ''}${m} ${h24 < 12 ? 'AM' : 'PM'}`;
}
