"""Write art/palette/pegwork.png: the game palette (src/data/palette.ts) as a 32x1 swatch, which
pixel-art-studio's study.py saves as the locked palette `pegwork` (STYLE.md):

    python art/palette/make_swatch.py
    python ~/.claude/skills/pixel-art-studio/scripts/study.py art/palette/pegwork.png --save-palette pegwork
"""
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
hexes = re.findall(r"'#([0-9a-f]{6})'", (ROOT / "src/data/palette.ts").read_text())
img = Image.new("RGB", (len(hexes), 1))
for i, h in enumerate(hexes):
    img.putpixel((i, 0), tuple(int(h[k:k + 2], 16) for k in (0, 2, 4)))
img.save(Path(__file__).with_name("pegwork.png"))
print(f"{len(hexes)} colors -> art/palette/pegwork.png")
