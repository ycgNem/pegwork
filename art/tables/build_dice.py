"""The dice table (STYLE.md: 48 x 32, a 3 x 2 tile footprint, seen three-quarter from above).

Brief
- Canvas 48 x 32, anchor (0, 0): the footprint's top-left. Rows 0-26 are the table top, 27-31
  its near side (the 3/4 view's front face).
- Palette `pegwork`. Materials: a padded leather arm rail (crimson ramp), green felt with a warm
  lamp pool, gold-printed layout, a walnut body with a brass trim line, a chip tray on the far rail.
- Light: a low lamp above, slightly upper-left: the felt is brightest just left of center, the
  rail's top-left edges catch red highlights, the front face is in shadow.
- Outline: ink, 1 px, inside (the sprite fills its footprint exactly).
- Readability (STYLE.md rule 2): the live dice are drawn on the felt by the renderer at
  x 16-31, y 13-19, so that area stays quiet; the HI and LO boxes either side say what you bet.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import E, OUTLINE, PALETTE, Sprite  # noqa: E402

W, H = 48, 32
TOP = 26  # last row of the table top

# 3x5 gold micro letters for the felt
MICRO = {
    "H": ["#.#", "#.#", "###", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "L": ["#..", "#..", "#..", "#..", "###"],
    "O": [".#.", "#.#", "#.#", "#.#", ".#."],
    "7": ["###", "..#", ".#.", ".#.", ".#."],
}


def micro(s, text, x, y, c):
    for ch in text:
        for j, row in enumerate(MICRO[ch]):
            for i, b in enumerate(row):
                if b == "#":
                    s.px(x + i, y + j, c)
        x += 4


def build():
    s = Sprite(W, H, palette=PALETTE)
    # the body: rounded-corner slab, near side in shadow
    s.rect(1, 0, W - 2, H - 1, E["walnut"])
    s.rect(0, 1, W - 1, H - 2, E["walnut"])
    s.rect(1, TOP + 1, W - 2, H - 2, E["umber"])
    s.rect(1, TOP + 1, W - 2, TOP + 1, E["copper"])  # brass trim along the top of the near side
    s.rect(2, TOP + 1, 6, TOP + 1, E["brass"])
    # the padded rail: crimson, highlighted on its far and left edges
    s.rect(1, 1, W - 2, TOP, E["crimson"])
    s.rect(2, 1, W - 3, 1, E["red"])
    s.rect(1, 2, 1, TOP - 1, E["red"])
    s.rect(2, TOP, W - 3, TOP, E["plum"])
    # the felt, inset 4 px, with a lamp pool
    fx0, fy0, fx1, fy1 = 4, 4, W - 5, TOP - 3
    s.rect(fx0, fy0, fx1, fy1, E["felt"])
    s.rect(fx0, fy0, fx1, fy0, E["feltDark"])  # the rail's shadow on the far edge of the felt
    s.rect(fx0, fy0, fx0, fy1, E["feltDark"])
    # the lamp pool: one clean lighter oval, a little left of center (cel, no dither: STYLE.md)
    s.ellipse(13, 8, 32, 18, E["moss"], only=E["felt"])
    # the layout in gold: HI and LO boxes, the seven between them
    for x0, word in ((6, "HI"), (W - 16, "LO")):
        s.rect(x0, 7, x0 + 9, 20, E["brass"], fill=False)
        micro(s, word, x0 + 2, 9, E["gold"])
    micro(s, "7", 22, 6, E["gold"])
    # the chip tray on the far rail: four stacks
    s.rect(18, 0, 29, 3, E["ink"])
    for i, c in enumerate((E["red"], E["white"], E["gold"], E["blue"])):
        s.rect(19 + i * 3, 1, 20 + i * 3, 2, c)
    s.outline(OUTLINE, where="inside")
    return s


def sprites():
    return [("table:dice", build(), 1, (0, 0))]


if __name__ == "__main__":
    s = build()
    s.preview(str(Path(__file__).with_name("preview_dice.png")), scale=8, bg="#b86f50")
    s.stats()
