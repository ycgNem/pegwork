# Pegwork — Style and art pipeline

The `art-director` agent owns this file and extends it. These are the owner's decisions.

## The look in one paragraph

A hustler's marble machine on a carnival midway. Warm wood, brass pegs, painted tin cups,
chalk numbers on a felt backboard, sawdust light from the upper left. Marbles are the
brightest things on screen: glass catches light, steel is cool, lead is dull, ember glows.
Chunky silhouettes, a dark outline, color doing the talking. Honest and readable: a marble's
path must be followable at 1× on a 384 × 216 screen.

## Resolution and grid

| Thing | Size | Notes |
|---|---|---|
| Screen | 384 × 216 logical | ×5 = 1920 × 1080; whole-number scaling, letterboxed |
| Board cell | 8 × 8 px | 20 × 28 cells; parts snap to cells |
| Marble | 6 × 6 px sprite (r = 3) | 4-frame shine cycle, no rotation |
| Peg / Bumper | 8 × 8 | plus a 8 × 8 "bent" variant |
| Spinner | 24 × 24, 8 rotation frames | drawn frames; pixel art is never rotated |
| Cup | 32 × 16 (4 cells) or 16 × 16 (2 cells) | multiplier painted on in the bitmap font |
| Rival portrait | 32 × 32 | 16 rivals; 4 bosses at 48 × 48 |
| Icons | 16 × 16 | parts, marbles, nodes |

Integer positions only; whole-factor scaling only; **pixel art is never rotated**.
The marble's path, the drop rail, the Dry Run histogram and the heatmap are drawn as pixel
geometry on the grid, not as sprites.

## Palette

**Endesga 32** (32 colors; warm wood and brass ramps, a clean steel ramp, strong accents). Not
Resurrect 64 (the other games). The game palette file is `src/data/palette.ts`; the art
pipeline locks every sprite to it (see below). The histogram uses three colors only: ink, felt,
and the ember accent for the mean.

**Material ramps** (shadow → light; names as `C` in `palette.ts` and `E` in `art/common.py`;
written in Milestone 0 after the Steel marble and Peg test). Shadows lean cool or red, lights warm.

| Material | Ramp | Hex |
|---|---|---|
| wood (frame, shoulders) | umber · walnut · clay · tan · sand | 3e2731 733e39 b86f50 c28569 e4a672 |
| brass (pegs, rail) | walnut · copper · brass · gold (+ chalk glint) | 733e39 d77643 feae34 fee761 |
| tin (cups) | navy · slate · steelDark · steel · steelLight | 262b44 3a4466 5a6988 8b9bb4 c0cbdc |
| felt (backboard) | ink · feltDark · felt · moss | 181425 193c3e 265c42 3e8948 |
| chalk (numbers, readouts) | steel · chalk · white | 8b9bb4 ead4aa ffffff |
| glass | blue · sky · cyan · white | 124e89 0099db 2ce8f5 ffffff |
| steel | navy · steelDark · steel · steelLight · white | 262b44 5a6988 8b9bb4 c0cbdc ffffff |
| lead | ink · navy · slate · steelDark | 181425 262b44 3a4466 5a6988 |
| ember | crimson · red · ember · brass · gold | a22633 e43b44 f77622 feae34 fee761 |

Outline: ink (181425), one color, 1 px, on every sprite. Bent and worn parts lose the top of their
ramp (a bent brass peg has no gold left) and gain a rust (be4a2f) scratch.

**Decisions from the M0 test sprites** (the art director's):
- *Steel marble* (6 x 6): a chrome ball reflects its world, so it is drawn as sky (upper half
  light), a hard horizon band, floor (lower half dark) and a one-pixel fleck of the felt it rolls
  on. The 4-frame "shine" is a glint that swells and fades at the light-side pole while the
  horizon band rocks a pixel: the ball reads as turning without the art ever rotating.
- *Peg* (8 x 8, a 6 px head on pixels 1–6 so it centers on the cell): shaded as a dome from the
  light vector (`dome()` in `art/parts/build_peg.py`), which darkens the head's corners and makes
  a 6 px disc read round instead of square; one chalk glint, never a blob; a one-pixel ink cast
  shadow down-right seats it on the felt.
- *Bent peg*: knocked a pixel down-right, tipped into a 6 x 5 oval, no gold left, a rust scratch,
  a longer shadow. At 1x it reads wrong next to a true peg by color first, shape second.

## Readability rules (gameplay, not decoration)

1. A bent part reads as bent at 1×: a visibly off-center peg, a cracked bumper, a dented cup.
2. Every cup's multiplier is painted on the cup in the bitmap font and never hidden.
3. A marble's tags show on the marble (a ring per bumper tag, a spark for a spinner tag).
4. The drop column is marked on the rail; the rival's chosen column is shown on their board.
5. The Dry Run histogram is drawn on the felt beside the board, in the same frame as the
   board, so you never leave the machine to read the math.

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
   `pegwork`: `art/palette/make_swatch.py` writes the swatch and its docstring has the one-time
   `study.py --save-palette pegwork` line; `art/common.py` refuses to run if the saved palette and
   `palette.ts` ever disagree), outline rule (dark outline, one color), light from the upper left.
2. `art/<family>/build_<asset>.py` places pixels with parametric functions (frames are
   function calls, never copies); `noise(seed=)` is the only randomness. Each script exposes
   `sprites()` with the game's sprite names and anchors, and run on its own writes
   `preview_*.png` beside itself. `python art/preview_context.py` shows the sprites on the felt at
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
