"""The art-direction test in context (STYLE.md): the dice table on a patch of sawdust floor with
tourists seated at it and walking past, both proportion variants side by side, and the neon sign
on the street below, at 1x and x4. Writes art/preview_context.png. Run after the build scripts."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for sub in ("", "people", "tables", "neon"):
    sys.path.insert(0, str(HERE / sub))
from common import E  # noqa: E402
from PIL import Image  # noqa: E402
import build_dice  # noqa: E402
import build_letters  # noqa: E402
import build_tourist  # noqa: E402

hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def floor(img, x0, y0, w, h):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            plank_seam = (y - y0) % 4 == 3 or ((x - x0) + ((y - y0) // 4) * 7) % 16 == 0
            img.putpixel((x, y), hexrgb(E["walnut"] if plank_seam else E["clay"]))


def put(img, s, x, y, pivot=(0, 0)):
    img.alpha_composite(s.composite(1), (x - pivot[0], y - pivot[1]))


def scene(variant):
    W, H = 112, 72
    img = Image.new("RGBA", (W, H), hexrgb(E["ink"]))
    floor(img, 0, 0, W, 56)
    t = build_tourist
    # seated behind the table (facing down), the table, seated in front (backs to us)
    for sx in (24, 40):
        put(img, t.make(variant, "d", 0, sit=True), sx, 18 + 4, (6, 19))
    put(img, build_dice.build(), 16, 16)
    put(img, t.make(variant, "u", 0, sit=True), 32, 56, (6, 19))
    # walking past: front, side, back
    put(img, t.make(variant, "d", 1), 78, 28, (6, 19))
    put(img, t.make(variant, "r", 0), 92, 40, (6, 19))
    put(img, t.make(variant, "u", 2), 76, 52, (6, 19))
    # the street and the start of the sign
    for y in range(56, H):
        for x in range(W):
            img.putpixel((x, y), hexrgb(E["navy"]))
    x = 4
    for ch in "CARPET J":
        if ch != " ":
            put(img, build_letters.build(ch), x, 56)
        x += 13
    return img


a, b = scene("chibi"), scene("slim")
W, H = a.size
pad = 8
sheet = Image.new("RGBA", (2 * W + pad + 2 * (W * 4) + 3 * pad, H * 4), hexrgb(E["ink"]))
sheet.alpha_composite(a, (0, 0))
sheet.alpha_composite(b, (0, H + pad))
sheet.alpha_composite(a.resize((W * 4, H * 4), Image.NEAREST), (W + pad, 0))
sheet.alpha_composite(b.resize((W * 4, H * 4), Image.NEAREST), (W + pad + W * 4 + pad, 0))
sheet.save(HERE / "preview_context.png")
print("art/preview_context.png  (left: 1x chibi above slim; then x4 chibi, x4 slim)")
