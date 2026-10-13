// Sprite sheets made by the pixel-art-studio build scripts (art/<family>/build_*.py, STYLE.md):
// every src/art/<family>.png with its <family>.json. The JSON is Aseprite-compatible; each frame's
// filename is the game's sprite name (e.g. `marble:steel:0`) and its pivot is the sprite's anchor.
import { artReady, defImageSprite } from './atlas';

export interface SheetFrame {
  filename: string;
  frame: { x: number; y: number; w: number; h: number };
  pivot?: { x: number; y: number };
}
export interface SheetJson {
  frames: SheetFrame[];
  meta: { image: string; size: { w: number; h: number } };
}

const metas = import.meta.glob<SheetJson>('../art/*.json', { eager: true, import: 'default' });
const urls = import.meta.glob<string>('../art/*.png', { eager: true, query: '?url', import: 'default' });

/** every sprite name some sheet provides */
export const sheetSprites = new Set<string>();

/** Register every sheet's frames with the atlas. Resolves once they have loaded. */
export function loadSheets(): Promise<void> {
  for (const [path, meta] of Object.entries(metas)) {
    const url = urls[path.replace(/\.json$/, '.png')];
    if (!url) continue;
    for (const f of meta.frames) {
      sheetSprites.add(f.filename);
      defImageSprite(f.filename, { url, ...f.frame, ox: f.pivot?.x ?? 0, oy: f.pivot?.y ?? 0 });
    }
  }
  return artReady();
}
