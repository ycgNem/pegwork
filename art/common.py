"""Shared setup for every Carpet Joint build script (STYLE.md: the art pipeline).

- puts pixel-art-studio's scripts/ on sys.path (a vendored .claude/skills copy first, else the
  user-level install) and re-exports Sprite;
- the locked palette `pegwork` (saved once by study.py from art/palette/pegwork.png) and checks it
  still matches src/data/palette.ts;
- E: Endesga 32 by the same names as `C` in src/data/palette.ts, and the material ramps;
- pack(): writes a family's sheet, src/art/<family>.png + .json, whose frame names are the game's
  sprite names and whose pivots are the sprites' anchors (read by src/render/sheets.ts).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_local = ROOT / ".claude/skills/pixel-art-studio/scripts"
sys.path.insert(0, str(_local if _local.exists() else Path.home() / ".claude/skills/pixel-art-studio/scripts"))

from pixelstudio import Sprite, PALETTES  # noqa: E402
from PIL import Image  # noqa: E402

GAME_HEX = ["#" + h for h in re.findall(r"'#([0-9a-f]{6})'", (ROOT / "src/data/palette.ts").read_text())]
if "pegwork" not in PALETTES:
    sys.exit("palette `pegwork` is not saved: run the two lines in art/palette/make_swatch.py")
if sorted(c.lower() for c in PALETTES["pegwork"]) != sorted(GAME_HEX):
    sys.exit("palette `pegwork` no longer matches src/data/palette.ts: re-save it (art/palette/make_swatch.py)")
PALETTE = "pegwork"

_NAMES = ("rust copper chalk sand clay walnut umber crimson red ember brass gold leaf moss felt feltDark "
          "blue sky cyan white steelLight steel steelDark slate navy ink hot plum magenta pink peach tan").split()
E = dict(zip(_NAMES, GAME_HEX))

# Material ramps, shadow -> light (STYLE.md "Palette"). Shadows lean cool or red, lights lean warm.
RAMPS = {
    "skin": ["clay", "tan", "peach"],
    "skinDark": ["walnut", "clay", "tan"],
    "felt": ["feltDark", "felt", "moss"],
    "wood": ["umber", "walnut", "clay", "tan"],
    "rail": ["plum", "crimson", "red"],          # the padded leather arm rail
    "brass": ["walnut", "copper", "brass", "gold"],
    "pinkShirt": ["plum", "magenta", "pink"],
    "khaki": ["clay", "tan", "sand"],
    "straw": ["tan", "sand", "chalk"],
    "neonPink": ["plum", "magenta", "pink", "white"],   # halo out -> core in
    "neonCyan": ["navy", "blue", "cyan", "white"],
    "neonGold": ["walnut", "ember", "gold", "white"],
}
OUTLINE = E["ink"]


def pack(family, entries, padding=1):
    """entries: [(sprite_name, Sprite, frame_index_1based, (pivot_x, pivot_y))] -> src/art/<family>.png/.json"""
    entries = list(entries)
    W = sum(s.w for _, s, _, _ in entries) + padding * (len(entries) + 1)
    H = max(s.h for _, s, _, _ in entries) + 2 * padding
    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    frames, x = [], padding
    for name, s, fi, (px, py) in entries:
        sheet.alpha_composite(s.composite(fi), (x, padding))
        frames.append({"filename": name, "frame": {"x": x, "y": padding, "w": s.w, "h": s.h},
                       "rotated": False, "trimmed": False, "pivot": {"x": px, "y": py},
                       "sourceSize": {"w": s.w, "h": s.h}, "duration": s.frames[fi - 1].duration})
        x += s.w + padding
    out = ROOT / "src/art"
    out.mkdir(parents=True, exist_ok=True)
    sheet.save(out / f"{family}.png")
    meta = {"frames": frames, "meta": {"app": "pixelstudio (Carpet Joint art/common.py)", "image": f"{family}.png",
                                        "format": "RGBA8888", "size": {"w": W, "h": H}, "scale": "1"}}
    (out / f"{family}.json").write_text(json.dumps(meta, indent=1))
    used = {sheet.getpixel((i, j))[:3] for i in range(W) for j in range(H) if sheet.getpixel((i, j))[3]}
    off = [c for c in used if "#%02x%02x%02x" % c not in GAME_HEX]
    if off:
        sys.exit(f"{family}: {len(off)} colors outside the palette: {off}")
    print(f"src/art/{family}.png: {len(entries)} frames, {W}x{H}, {len(used)} colors, all in the palette")
