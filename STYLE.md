# Carpet Joint — Style and art pipeline

The `art-director` agent owns this file and extends it. These are the owner's decisions.

## The look in one paragraph

A 1970s casino on a neon strip, seen from a three-quarter top-down angle. Inside: patterned
carpet in burgundy and gold, green felt, warm low lamps over the tables, cigarette haze, brass
rails, polyester crowds. Outside and on the marquee: neon tubes in hot pink, cyan and gold,
which are the brightest things on screen. The sawdust joint you start in is plain boards and
bare bulbs; carpet arrives as you grow. Chunky silhouettes, a dark outline, color doing the
talking. Readable at 1x: you must be able to tell a tourist from a high roller, a busy table from
a dead one, and a cheat's tell, at a glance on a 640 × 360 screen.

## Resolution and grid

| Thing | Size | Notes |
|---|---|---|
| Screen | 640 × 360 logical | ×3 = 1920 × 1080; whole-number scaling, letterboxed |
| Floor tile | 16 × 16 px | sawdust joint 16 × 11 tiles; the floor view up to 28 × 18 |
| Gambler / staff | 12 × 20 sprite on a 16 px tile | walk 4 frames × 4 directions, sit 2 frames; overlaps the tile above, sorted by y |
| Dice table | 48 × 32 (3 × 2 tiles) | |
| Wheel | 32 × 32 (2 × 2), 8 spin frames | drawn frames; pixel art is never rotated |
| Ball drum | 48 × 32 (3 × 2) | |
| Fixtures | cage, bar, stage, entrance by footprint | |
| Neon marquee letter | 12 × 16 with a 1 px glow ring | tube core + darker same-hue halo, no alpha blending |
| Portraits | 48 × 48 rivals, 64 × 64 the flagship boss | |
| Icons | 16 × 16 | web nodes, staff traits, gaffs |
| Top bar / right panel | 16 px tall / 176 px wide | |

Integer positions only; whole-factor scaling only; **pixel art is never rotated**. Odds readouts,
the Sweat graph, the web's links and the strip map's lines are drawn as pixel geometry, not
sprites.

## Palette

**Endesga 32, provisional** (it has the neon pinks, cyan and gold, plus warm carpet and felt
ramps). The art director tests it in Milestone 0 on a neon letter, a tourist and the dice table,
and either keeps it or proposes one replacement palette to the owner. The game palette file is
`src/data/palette.ts`; the pipeline locks every sprite to it. Ramps get written here after the
M0 test. Outline: ink (181425), one color, 1 px, on every sprite.

## Readability rules (gameplay, not decoration)

1. Each gambler type has its own silhouette and color pattern (a tourist's loud shirt and camera,
   a high roller's white suit, a local's cap). A cheat looks like the type it's posing as, but
   has one tell that a sharp eye (or the eye in the sky) can catch.
2. A table's state reads at 1x: open/closed lamp, seats filled, a red flash when its maximum bet
   could bust the cage (DESIGN §6).
3. A big win shows above the table (chips burst, a number in the font) long enough to read,
   because winners are advertising.
4. A gaffed table carries a small mark only the owner sees, always.
5. Edges and the Sweat use the editor's color rule (DESIGN §2): green, amber, red, nothing else.

## The art pipeline: `pixel-art-studio`

All art is **code-drawn** with the `pixel-art-studio` Claude skill (Claude places every pixel
through a Python/Pillow library; deterministic; palette-locked). Not PixelLab, not SpriteCook.
Reasons: zero generation budget, every sprite is a script that can be re-run after a palette or
size change, and the style is uniform because one hand draws it.

**Install (owner, once):**

1. Python 3 on PATH (`python --version`). If missing, install from python.org and tick
   "Add to PATH".
2. `pip install --user pillow`
3. Clone `https://github.com/Gamezxz/pixel-art-studio` into `%USERPROFILE%\.claude\skills\pixel-art-studio`
   (user scope, so every project can use it) or into this repo's `.claude\skills\` (project
   scope). The skill's build scripts import from its `scripts/` folder by path; the art
   director sets that path once in `art/common.py` and every build script imports from there.

**How the art director works, every sprite:**

1. Brief in the build script's header: canvas size, palette (locked to `palette.ts` as
   `pegwork` (the saved palette keeps its old name): `art/palette/make_swatch.py` writes the swatch and its docstring has the one-time
   `study.py --save-palette pegwork` line; `art/common.py` refuses to run if the saved palette and
   `palette.ts` ever disagree), outline rule (dark outline, one color), light from the upper left.
2. `art/<family>/build_<asset>.py` places pixels with parametric functions (frames are
   function calls, never copies); `noise(seed=)` is the only randomness. Each script exposes
   `sprites()` with the game's sprite names and anchors, and run on its own writes
   `preview_*.png` beside itself. `python art/preview_context.py` shows the sprites on the floor at
   1x and x4, which is where the critique happens.
3. Run it (`python art/<family>/build_<asset>.py`), look at `preview.png`, critique against
   the checklist (silhouette at 1×, palette only, outline consistent, light consistent,
   readability rule above), fix, rerun: **at least two passes before showing the owner**.
4. `python art/build_all.py` packs every family into `src/art/<family>.png` + `.json`
   (`common.pack`: the skill's Aseprite-compatible JSON, one frame per sprite name, plus a
   `pivot` for the anchor; it fails on any color outside the palette). `save_spritesheet` writes
   one sprite's frames per sheet, and a family sheet holds several sprites, so the pack step is
   ours. The engine's sheet loader (`src/render/sheets.ts`) reads them by sprite name, and a
   sheet sprite replaces the code-drawn placeholder of the same name.
5. Never hand-edit a PNG; change the script. `e2e/coverage.mjs` lists every sprite the game
   asks for and fails on a missing one.

If the skill is missing from the session, the art director says so and stops; it does not
fall back to another generator, because mixed sources break the uniform look.
