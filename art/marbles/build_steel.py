"""Steel marble: 6x6 (r = 3), four-frame shine, anchor at the center (3, 3). STYLE.md.

Brief: the brightest thing on the board after glass. A chrome ball reflects its world: the sky half
(upper) light, a hard horizon band, the floor half (lower) dark with a fleck of the green felt it
rolls over. Light from the upper left. Ink outline, one color. The shine is a glint that swells and
fades at the light-side pole while the horizon band rocks a pixel, so the ball reads as turning
without the pixel art ever rotating.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import E, OUTLINE, PALETTE, Sprite, disc6  # noqa: E402

HERE = Path(__file__).resolve().parent

# interior 4x4 (x 1..4, y 1..4): sky, horizon, floor
BASE = [
    "LLLs",
    "LLss",
    "dDDd",
    "sddf",
]
KEY = {"L": "steelLight", "s": "steel", "D": "steelDark", "d": "slate", "f": "felt"}

# per frame: glint pixels (white) and whether the horizon band rocks right
FRAMES = [
    {"glint": [(1, 1)], "rock": 0},
    {"glint": [(1, 1), (2, 1)], "rock": 0},
    {"glint": [(2, 1)], "rock": 1},
    {"glint": [], "rock": 1},
]


def build():
    s = Sprite(6, 6, palette=PALETTE)
    for i, f in enumerate(FRAMES):
        if i:
            s.add_frame(copy=False)
        disc6(s, 0, 0, OUTLINE)
        for y, row in enumerate(BASE):
            # the horizon band (row 2) rocks a pixel on alternate frames
            if y == 2 and f["rock"]:
                row = row[-1] + row[:-1]
            for x, ch in enumerate(row):
                s.px(1 + x, 1 + y, E[KEY[ch]])
        for gx, gy in f["glint"]:
            s.px(gx, gy, E["white"])
    s.set_duration(120, list(range(1, 5)))
    s.tag("shine", 1, 4)
    return s


def sprites():
    s = build()
    return [(f"marble:steel:{i}", s, i + 1, (3, 3)) for i in range(4)]


if __name__ == "__main__":
    s = build()
    s.preview(str(HERE / "preview_steel.png"), scale=16, cols=4)
    s.save_gif(str(HERE / "preview_steel.gif"), scale=12, bg=E["feltDark"])
    s.stats()
