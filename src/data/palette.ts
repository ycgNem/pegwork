// Endesga 32 (STYLE.md: the game palette; every sprite is locked to it by the art pipeline).
// Colors are referred to by index everywhere; C names them by what they are on the board.

export const PALETTE: readonly string[] = [
  '#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633',
  '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e',
  '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
  '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569',
];

/** Palette indices by name. Ramps (shadow -> light) are listed in STYLE.md. */
export const C = {
  rust: 0, copper: 1, chalk: 2, sand: 3, clay: 4, walnut: 5, umber: 6, crimson: 7,
  red: 8, ember: 9, brass: 10, gold: 11, leaf: 12, moss: 13, felt: 14, feltDark: 15,
  blue: 16, sky: 17, cyan: 18, white: 19, steelLight: 20, steel: 21, steelDark: 22, slate: 23,
  navy: 24, ink: 25, hot: 26, plum: 27, magenta: 28, pink: 29, peach: 30, tan: 31,
} as const;

/** '#rrggbb' + alpha as a CSS rgba() string. */
export function rgba(c: number, a: number): string {
  const h = PALETTE[c];
  return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
}
