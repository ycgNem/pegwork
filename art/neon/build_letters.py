"""Neon letters for the marquee (STYLE.md: 12 x 16 with a glow ring; tube core + darker same-hue
halo, no alpha blending). The sign out front reads CARPET JOINT.

Brief
- Canvas 12 x 16, anchor (0, 0). Each glyph is a 5 x 6 skeleton drawn at x2: a 10 x 12 letter in
  2 px tubes, inset 1 px left/right and 2 px top/bottom.
- Palette `pegwork`, the neonPink ramp: plum (outer glow) -> magenta (halo) -> pink (tube) ->
  white (the hot top edge of each tube).
- The glow: a solid 1 px magenta halo hugging the tube, then a solid plum line above and below
  (the 1 px gap between letters stays dark so they don't merge).
- `:dim` frames are the flicker: tube magenta, halo plum, no outer glow.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import E, PALETTE, Sprite  # noqa: E402

GLYPHS = {
    "C": [".####", "#....", "#....", "#....", "#....", ".####"],
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#"],
    "R": ["####.", "#...#", "####.", "#..#.", "#...#", "#...#"],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#...."],
    "E": ["#####", "#....", "####.", "#....", "#....", "#####"],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "J": ["..###", "....#", "....#", "....#", "#...#", ".###."],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", ".###."],
    "I": ["#####", "..#..", "..#..", "..#..", "..#..", "#####"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
}


def build(ch, dim=False):
    s = Sprite(12, 16, palette=PALETTE)
    tube = E["magenta"] if dim else E["pink"]
    halo = E["plum"] if dim else E["magenta"]
    hot = E["pink"] if dim else E["white"]
    on = set()
    for j, row in enumerate(GLYPHS[ch]):
        for i, b in enumerate(row):
            if b == "#":
                for dx in (0, 1):
                    for dy in (0, 1):
                        on.add((1 + i * 2 + dx, 2 + j * 2 + dy))
    for x, y in on:
        s.px(x, y, tube)
    # the hot line along the top of every tube
    for x, y in on:
        if (x, y - 1) not in on and (x, y + 1) in on:
            s.px(x, y, hot)
    s.outline(halo, where="outside")
    if not dim:
        # the outer glow: a solid plum line above and below wherever the halo reaches the edge
        for x in range(12):
            for y, k in ((1, 1), (14, -1)):
                if s.get(x, y) is None and s.get(x, y + k) is not None:
                    s.px(x, y, E["plum"])
    return s


def sprites():
    out = []
    for ch in GLYPHS:
        out.append((f"neon:{ch}", build(ch), 1, (0, 0)))
        out.append((f"neon:{ch}:dim", build(ch, dim=True), 1, (0, 0)))
    return out


if __name__ == "__main__":
    from PIL import Image
    here = Path(__file__).parent
    word = "CARPET JOINT"
    hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    img = Image.new("RGBA", (len(word) * 13 + 4, 20), hexrgb(E["navy"]))
    x = 2
    for ch in word:
        if ch != " ":
            img.alpha_composite(build(ch).composite(1), (x, 2))
        x += 13
    img.resize((img.width * 6, img.height * 6), Image.NEAREST).save(here / "preview_sign.png")
    build("A").stats()
    print("preview_sign.png")
