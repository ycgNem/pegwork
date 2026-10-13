"""The tourist, the first gambler (STYLE.md: 12 x 20, feet at (6, 19), walk 4 frames x 4 directions
plus a seated pose per direction). Art-direction test for the owner: two proportion variants.

Brief
- Canvas 12 x 20, pivot (6, 19): the feet's floor line. 1 px transparent margin for the outline.
- Palette locked to `pegwork` (Endesga 32). Budget: ink outline + skin 3 + shirt 3 + khaki 3 +
  straw 3 + flower accents (cyan, gold) + sock white + sandal walnut + camera ink/steel.
- Light from the upper left: the left column of each mass is its light shade, the right its shadow.
- Outline: one color, ink, 1 px, outside (STYLE.md).
- Silhouette: the wide straw sun hat is the tourist's read (a silhouette break); the loud pink
  shirt with flowers and the camera on its strap carry the type at 1x.
- Variants: "chibi" (head 45% of height, the readable default) and "slim" (head ~30%, longer
  legs, more 1970s fashion line). VARIANT picks which one the game sheet packs.

Walk: contact / passing / contact / passing (references/animation.md): legs scissor on the
side view, a foot lifts on the front and back views, the body rises 1 px on passing frames.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import E, OUTLINE, PALETTE, Sprite  # noqa: E402

VARIANT = "chibi"

SKIN = [E["clay"], E["tan"], E["peach"]]
SHIRT = [E["magenta"], E["pink"]]
KHAKI = [E["tan"], E["sand"]]
STRAW = [E["tan"], E["sand"], E["chalk"]]

# row layout per variant: (crown rows, brim row, head rows, torso rows, shorts rows, leg row, sock row)
LAYOUT = {
    "chibi": dict(crown=(1, 3), brim=4, brimx=(1, 10), crownx=(3, 8), head=(5, 9), headx=(3, 8),
                  torso=(10, 13), torsox=(2, 9), shorts=(14, 15), leg=16, sock=17),
    "slim": dict(crown=(1, 2), brim=3, brimx=(2, 9), crownx=(4, 7), head=(4, 7), headx=(4, 7),
                 torso=(8, 12), torsox=(3, 8), shorts=(13, 14), leg=15, sock=16, leg2=17),
}


def body(s, v, d, f, sit):
    """Draw one pose on the current frame. d: 'd' front, 'u' back, 'l' facing left. f: walk 0-3."""
    L = LAYOUT[v]
    passing = f in (1, 3) and not sit
    oy = (-1 if passing else 0) + (2 if sit else 0)
    side = d == "l"

    def r(x0, y0, x1, y1, c):
        s.rect(x0, y0 + oy, x1, y1 + oy, c)

    def p(x, y, c):
        s.px(x, y + oy, c)

    # ---- legs (drawn first so the shorts overlap them) ----
    leg, sock = L["leg"], L["sock"]
    foot = sock + 1 + (1 if v == "slim" else 0)
    if v == "slim":
        sock = L["leg2"]
    if sit:
        # seated: knees forward, a stool under the shorts
        r(4, L["shorts"][1] + 1, 7, L["shorts"][1] + 1, E["walnut"])
    elif side:
        # scissor: contact frames spread front (left) and back legs; passing frames together
        spread = {0: 2, 1: 0, 2: 2, 3: 0}[f]
        front, back = (5 - spread, 6 + spread) if f in (0, 1) else (6 + spread, 5 - spread)
        for x, near in ((back, False), (front, True)):
            sk = SKIN[1] if near else SKIN[0]
            for y in range(leg, sock + 1):
                p(x, y, sk if y < sock else E["white"])
            p(x, foot, E["walnut"])
            p(x - 1, foot, E["walnut"])
    else:
        lift = {0: None, 1: "L", 2: None, 3: "R"}[f]
        lx = (3, 4) if v == "chibi" else (4, 4)
        rx = (7, 8) if v == "chibi" else (7, 7)
        for (x0, x1), who in ((lx, "L"), (rx, "R")):
            up = 1 if lift == who else 0
            for y in range(leg, sock + 1 - up):
                r(x0, y, x1, y, SKIN[2] if (y < sock - up and who == "L") else SKIN[1] if y < sock - up else E["white"])
            r(x0, foot - up, x1, foot - up, E["walnut"])

    # ---- shorts ----
    sx0, sx1 = L["torsox"][0] + 1, L["torsox"][1] - 1
    r(sx0, L["shorts"][0], sx1, L["shorts"][1], KHAKI[1])
    r(sx1, L["shorts"][0], sx1, L["shorts"][1], KHAKI[0])
    if not side and not sit:
        p((sx0 + sx1) // 2 + 1, L["shorts"][1], KHAKI[0])  # the gap between the legs

    # ---- torso: the loud shirt ----
    tx0, tx1 = L["torsox"]
    ty0, ty1 = L["torso"]
    if side:
        tx0, tx1 = tx0 + 1, tx1 - 1
    r(tx0, ty0, tx1, ty1, SHIRT[1])
    r(tx1, ty0, tx1, ty1, SHIRT[0])
    r(tx0, ty1, tx1, ty1, SHIRT[0])
    flowers = [(tx0 + 1, ty0 + 1, E["cyan"]), (tx1 - 2, ty0 + 2, E["gold"]), (tx0 + 2, ty1 - 1, E["gold"])]
    if v == "chibi" and not side:
        flowers.append((tx1 - 1, ty1 - 1, E["cyan"]))
    for x, y, c in flowers:
        p(x, y, c)
    # the camera on its strap (front and side only)
    if d == "d":
        cx = (tx0 + tx1) // 2
        p(cx - 1, ty0, E["slate"])  # the strap
        r(cx, ty0 + 1, cx + 1, ty0 + 2, E["ink"])  # the camera, lens catching the light
        p(cx, ty0 + 1, E["steel"])
    elif side:
        r(tx0 - 1, ty0 + 2, tx0, ty0 + 3, E["ink"])
        p(tx0 - 1, ty0 + 2, E["steel"])

    # ---- arms: sleeves and forearms, swinging opposite the legs ----
    swing = {0: 1, 1: 0, 2: -1, 3: 0}[f] if not sit else 0
    if side:
        ax = (tx0 + tx1) // 2 + (1 if swing < 0 else -1 if swing > 0 else 0)
        r(ax, ty0 + 1, ax, ty0 + 2, SHIRT[0])
        r(ax, ty0 + 3, ax, ty0 + 3, SKIN[1])
    else:
        for x, k in ((tx0 - 1, swing), (tx1 + 1, -swing)):
            r(x, ty0, x, ty0 + 1, SHIRT[1] if x < tx0 else SHIRT[0])
            r(x, ty0 + 2 + max(0, k), x, ty0 + 3 + max(0, k), SKIN[2] if x < tx0 else SKIN[1])
        if sit:  # hands on the table edge
            p(tx0, ty1, SKIN[2])
            p(tx1, ty1, SKIN[1])

    # ---- head ----
    hx0, hx1 = L["headx"]
    hy0, hy1 = L["head"]
    r(hx0, hy0, hx1, hy1, SKIN[1])
    r(hx0, hy0, hx1 - 1, hy1 - 1, SKIN[2])
    if d == "d":
        ey = hy0 + (2 if v == "chibi" else 1)
        p(hx0 + 1, ey, E["ink"])
        p(hx1 - 1, ey, E["ink"])
        p(hx0, ey + 1, E["pink"])  # sunburnt cheeks
        p(hx1, ey + 1, E["pink"])
        if v == "chibi":
            p((hx0 + hx1) // 2 + 1, ey + 2, SKIN[0])  # the mouth
    elif d == "u":
        r(hx0, hy0, hx1, hy1 - 1, E["walnut"])
        r(hx0 + 1, hy1 - 1, hx1 - 1, hy1 - 1, E["walnut"])
    else:
        r(hx1 - 1, hy0, hx1, hy1 - 1, E["walnut"])  # hair at the back of the head
        p(hx1 - 2, hy0, E["walnut"])
        p(hx0 + 1, hy0 + (2 if v == "chibi" else 1), E["ink"])
        p(hx0 - 1, hy0 + (3 if v == "chibi" else 2), SKIN[2])  # the nose breaks the profile

    # ---- the sun hat: brim then crown, a red band ----
    bx0, bx1 = L["brimx"]
    if side:
        bx0, bx1 = bx0 - 1, bx1 - 1
    r(bx0, L["brim"], bx1, L["brim"], STRAW[1])
    r(bx1 - 1, L["brim"], bx1, L["brim"], STRAW[0])
    cx0, cx1 = L["crownx"]
    r(cx0, L["crown"][0], cx1, L["crown"][1], STRAW[1])
    r(cx0, L["crown"][0], cx0 + 1, L["crown"][0], STRAW[2])
    r(cx1, L["crown"][0], cx1, L["crown"][1], STRAW[0])
    r(cx0, L["crown"][1], cx1, L["crown"][1], E["red"])

    s.outline(OUTLINE, where="outside")


DIRS = ("d", "u", "l", "r")


def make(v, d, f, sit=False):
    s = Sprite(12, 20, palette=PALETTE)
    body(s, v, "l" if d == "r" else d, f, sit)
    if d == "r":
        # a true horizontal flip of the cel (mirror_x is the symmetry tool: it copies a half)
        from PIL import Image
        im = s._img()
        im.paste(im.transpose(Image.FLIP_LEFT_RIGHT))
    return s


def sprites(v=None):
    v = v or VARIANT
    out = []
    for d in DIRS:
        for f in range(4):
            out.append((f"gambler:tourist:{d}:{f}", make(v, d, f), 1, (6, 19)))
        out.append((f"gambler:tourist:sit:{d}", make(v, d, 0, sit=True), 1, (6, 19)))
    return out


def preview_sheet(v, path):
    """Every pose in a row per direction, at x8 on the sawdust floor color."""
    from PIL import Image
    hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    cols, rows = 5, 4
    sheet = Image.new("RGBA", (cols * 14, rows * 22), hexrgb(E["clay"]))
    for ri, d in enumerate(DIRS):
        for ci in range(5):
            s = make(v, d, ci, sit=False) if ci < 4 else make(v, d, 0, sit=True)
            sheet.alpha_composite(s.composite(1), (ci * 14 + 1, ri * 22 + 1))
    sheet.resize((sheet.width * 8, sheet.height * 8), Image.NEAREST).save(path)


if __name__ == "__main__":
    here = Path(__file__).parent
    for v in LAYOUT:
        preview_sheet(v, here / f"preview_tourist_{v}.png")
        make(v, "d", 0).save_silhouette(str(here / f"preview_tourist_{v}_silhouette.png"))
    s = make(VARIANT, "d", 0)
    s.stats()
    print("wrote previews for", ", ".join(LAYOUT))
