"""The M0 sprites in context: a patch of felt backboard with true pegs, a bent peg and the steel
marble's four frames, at 1x and scaled x4 (how the game shows them on a 1536x864 window).
Writes art/preview_context.png. Run after the build scripts."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import E  # noqa: E402
from PIL import Image  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent / "marbles"))
sys.path.insert(0, str(Path(__file__).resolve().parent / "parts"))
import build_peg  # noqa: E402
import build_steel  # noqa: E402

hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
W, H = 64, 40
img = Image.new("RGBA", (W, H), hexrgb(E["feltDark"]))
for x in range(8, W, 8):
    for y in range(8, H, 8):
        img.putpixel((x, y), hexrgb(E["felt"]))
peg, bent = build_peg.peg(), build_peg.bent()
steel = build_steel.build()
def put(s, frame, cx, cy, px, py):
    img.alpha_composite(s.composite(frame), (cx - px, cy - py))
for i, c in enumerate([12, 28, 44]):
    put(peg, 1, c, 12, 4, 4)
put(bent, 1, 60 - 4, 12, 4, 4)  # a bent peg at the end of the row
for i in range(4):
    put(peg if i % 2 else bent, 1, 12 + i * 16, 28, 4, 4)
for f in range(4):
    put(steel, f + 1, 20 + f * 12, 4 + 0, 3, 3)
big = img.resize((W * 4, H * 4), Image.NEAREST)
sheet = Image.new("RGBA", (W + 8 + W * 4, H * 4), (24, 20, 37, 255))
sheet.alpha_composite(img, (0, 0))
sheet.alpha_composite(big, (W + 8, 0))
sheet.save(Path(__file__).with_name("preview_context.png"))
print("art/preview_context.png")
