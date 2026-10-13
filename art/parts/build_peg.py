"""Peg and bent peg: 8x8, the cell they snap to, anchor at the cell center (4, 4). STYLE.md.

Brief: a brass pin head seen face-on, 6 px across (r = 3, its collision size), lit from the upper
left: gold at the lit shoulder, copper into the lower right, a walnut core shadow, ink outline. A
one-pixel cast shadow drops down-right onto the felt so pegs sit on the board, not on the screen.
Bent (readability rule 1): the head has been knocked a pixel down-right and tipped, so it reads as
a flattened oval; the brass has gone dull (no gold left), a rust scratch crosses it, and its shadow
stretches. It must look wrong at 1x next to a true peg.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import E, OUTLINE, PALETTE, Sprite, disc6  # noqa: E402

HERE = Path(__file__).resolve().parent

KEY = {"G": "chalk", "g": "gold", "B": "brass", "c": "copper", "w": "walnut", "r": "rust", "u": "umber"}

# light from the upper left and a little in front (STYLE.md: one light, upper left)
LIGHT = (-0.55, -0.6, 0.58)


def dome(steps, cx=1.5, cy=1.5, R=2.3):
    """A 4x4 pin head shaded as a dome: each pixel's normal dotted with the light, bucketed into
    `steps` (darkest first). The interior corners fall steep and dark, which is what rounds a 6 px disc."""
    rows = []
    for y in range(4):
        row = ""
        for x in range(4):
            dx, dy = x - cx, y - cy
            z = max(0.0, R * R - dx * dx - dy * dy) ** 0.5
            n = (dx / R, dy / R, z / R)
            b = max(0.0, sum(a * l for a, l in zip(n, LIGHT)))
            row += steps[min(len(steps) - 1, int(b * len(steps) / 0.95))]
        rows.append(row)
    return rows


TRUE = dome("wcBBg")
# one specular pixel at the brightest point, never a blob
TRUE[0] = "G" + TRUE[0][1:]


def shadow(s, x0, y0):
    """the disc's cast shadow, one pixel down-right, only where nothing is drawn"""
    pts = {(x0 + 1 + i, y0 + j) for i in range(4) for j in (0, 5)} | {(x0 + i, y0 + 1 + j) for i in (0, 5) for j in range(4)}
    pts |= {(x0 + 1 + i, y0 + 1 + j) for i in range(4) for j in range(4)}
    for x, y in pts:
        sx, sy = x + 1, y + 1
        if 0 <= sx < 8 and 0 <= sy < 8 and (sx, sy) not in pts:
            s.px(sx, sy, E["ink"])


def peg():
    s = Sprite(8, 8, palette=PALETTE)
    shadow(s, 1, 1)
    disc6(s, 1, 1, OUTLINE)
    for y, row in enumerate(TRUE):
        for x, ch in enumerate(row):
            s.px(2 + x, 2 + y, E[KEY[ch]])
    return s


BENT = [
    "cccc",
    "crrw",
    "cwww",
]


def bent():
    s = Sprite(8, 8, palette=PALETTE)
    # the head, a pixel down-right and tipped into a 6x5 oval, its shadow stretched below it
    x0, y0 = 2, 2
    for x in range(x0 + 2, x0 + 6):
        s.px(x, y0 + 5, E["ink"])
    s.px(x0 + 5, y0 + 4, E["ink"])
    s.rect(x0 + 1, y0, x0 + 4, y0 + 4, OUTLINE)
    s.rect(x0, y0 + 1, x0 + 5, y0 + 3, OUTLINE)
    for y, row in enumerate(BENT):
        for x, ch in enumerate(row):
            s.px(x0 + 1 + x, y0 + 1 + y, E[KEY[ch]])
    # the lit lip of the tipped head
    s.px(x0 + 1, y0 + 1, E["brass"])
    return s


def sprites():
    return [("peg", peg(), 1, (4, 4)), ("peg:bent", bent(), 1, (4, 4))]


if __name__ == "__main__":
    a, b = peg(), bent()
    a.preview(str(HERE / "preview_peg.png"), scale=16)
    b.preview(str(HERE / "preview_peg_bent.png"), scale=16)
    a.stats()
    b.stats()
