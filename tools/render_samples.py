#!/usr/bin/env python3
"""Procedural sample-photo renderer for Vice Heat - Palmera Cover Studio.

Every demo photo the app ships is painted by this script with Pillow: no
downloaded or generated-elsewhere image ever enters the repository, so the
committed JPGs are reproducible from committed text alone.

    python3 tools/render_samples.py

writes app/assets/boulevard.jpg, app/assets/pier.jpg and app/assets/beach.jpg
at 1200x900. Scenes: (a) a sunset boulevard with art-deco blocks and a
convertible silhouette, (b) a neon pier at night with a diner sign,
(c) a beach aerial with a lifeguard tower and a speedboat.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 900
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "assets"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky(img, stops):
    """Multi-stop vertical gradient; stops are (position 0..1, rgb)."""
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                d.line([(0, y), (W, y)], fill=lerp(c0, c1, (t - p0) / max(p1 - p0, 1e-6)))
                break


def glow(img, cx, cy, radius, color, peak=110):
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    steps = 24
    for i in range(steps, 0, -1):
        r = radius * i / steps
        v = int(peak * (1 - i / steps) ** 1.6)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(color[0] * v // 255, color[1] * v // 255, color[2] * v // 255))
    layer = layer.filter(ImageFilter.GaussianBlur(28))
    px, lx = img.load(), layer.load()
    for y in range(H):
        for x in range(W):
            a, b = px[x, y], lx[x, y]
            px[x, y] = (min(255, a[0] + b[0]), min(255, a[1] + b[1]), min(255, a[2] + b[2]))


def palm(d, x, y, s, color, lean=0.35):
    """A palm silhouette: curved trunk plus eight fronds."""
    top = (x + int(lean * s), y - int(1.55 * s))
    for i in range(9):
        t = i / 8
        d.line([(x + int(lean * s * t * t), y - int(1.55 * s * t)), (x + int(lean * s * (t + 0.12)), y - int(1.55 * s * (t + 0.04)))], fill=color, width=max(3, int(s * 0.09)))
    for k in range(8):
        ang = math.pi * (0.08 + 0.16 * k)
        ex = top[0] + int(math.cos(ang) * s * (0.75 + 0.2 * math.sin(k * 2.7)))
        ey = top[1] + int(abs(math.sin(ang)) * s * 0.42) - int(s * 0.12)
        mid = (top[0] + int((ex - top[0]) * 0.5), top[1] - int(s * 0.30))
        d.line([top, mid, (ex, ey)], fill=color, width=max(2, int(s * 0.055)))
    d.ellipse([top[0] - 7, top[1] - 4, top[0] + 7, top[1] + 10], fill=color)


def grain_vignette(img, seed, grain=11):
    rnd = random.Random(seed)
    noise = Image.effect_noise((W, H), 22).convert("L")
    px, nx = img.load(), noise.load()
    cx, cy = W / 2, H / 2
    maxd = math.hypot(cx, cy)
    for y in range(H):
        for x in range(W):
            d = math.hypot(x - cx, y - cy) / maxd
            vig = 1 - 0.34 * max(0.0, d - 0.42) ** 1.5
            g = (nx[x, y] - 128) / 128 * grain
            r, gg, b = px[x, y]
            px[x, y] = (int(max(0, min(255, (r + g) * vig))), int(max(0, min(255, (gg + g) * vig))), int(max(0, min(255, (b + g) * vig))))
    return img


def neon_text(img, xy, text, size, color, halo):
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    try:
        font = ImageFont.load_default(size=size)
    except TypeError:
        font = ImageFont.load_default()
    d.text(xy, text, font=font, fill=halo)
    layer = layer.filter(ImageFilter.GaussianBlur(10))
    px, lx = img.load(), layer.load()
    for y in range(H):
        for x in range(W):
            a, b = px[x, y], lx[x, y]
            px[x, y] = (min(255, a[0] + b[0]), min(255, a[1] + b[1]), min(255, a[2] + b[2]))
    d2 = ImageDraw.Draw(img)
    d2.text(xy, text, font=font, fill=color)
    return img


def boulevard():
    img = Image.new("RGB", (W, H))
    sky(img, [(0.0, (38, 24, 84)), (0.34, (122, 44, 118)), (0.58, (232, 92, 110)), (0.78, (255, 158, 84)), (1.0, (255, 196, 110))])
    glow(img, 830, 560, 330, (255, 170, 90), peak=130)
    d = ImageDraw.Draw(img)
    d.ellipse([742, 472, 918, 648], fill=(255, 214, 130))
    d.ellipse([742, 472, 918, 648], outline=(255, 236, 180), width=3)
    # distant skyline
    rnd = random.Random(7)
    x = -10
    while x < W:
        bw = rnd.randint(46, 96)
        bh = rnd.randint(90, 250)
        d.rectangle([x, 648 - bh, x + bw, 648], fill=(52, 30, 74))
        for wy in range(648 - bh + 12, 630, 20):
            for wx in range(x + 8, x + bw - 8, 16):
                if rnd.random() < 0.42:
                    d.rectangle([wx, wy, wx + 6, wy + 9], fill=(255, 196, 110))
        x += bw + rnd.randint(4, 18)
    # art-deco blocks, left and right foreground
    for (bx, bw, bh, base) in [(0, 235, 430, (34, 20, 58)), (955, 245, 470, (30, 18, 54))]:
        d.rectangle([bx, 648 - bh, bx + bw, 648], fill=base)
        d.rectangle([bx, 648 - bh, bx + bw, 648 - bh + 16], fill=(255, 120, 160))
        for row in range(6):
            for col in range(3):
                wx = bx + 28 + col * 62
                wy = 648 - bh + 44 + row * 58
                d.rounded_rectangle([wx, wy, wx + 34, wy + 40], 14, fill=(255, 214, 130) if (row + col) % 3 else (94, 220, 220))
        d.rectangle([bx + bw // 2 - 5, 648 - bh - 42, bx + bw // 2 + 5, 648 - bh], fill=base)
    # road with perspective and reflections
    d.polygon([(0, H), (430, 648), (770, 648), (W, H)], fill=(26, 18, 38))
    for i in range(9):
        t = i / 9
        y = 668 + t * t * 210
        d.line([(560 - 130 * t, y), (640 + 130 * t, y)], fill=(255, 220, 150), width=max(2, int(3 + t * 7)))
    for gx in (180, 1010):
        glow(img, gx, 700, 90, (255, 110, 170), peak=60)
    d = ImageDraw.Draw(img)
    # convertible silhouette, centre foreground
    car = [(300, 806), (352, 748), (470, 730), (520, 692), (700, 692), (760, 730), (880, 748), (916, 806), (880, 830), (330, 830)]
    d.polygon(car, fill=(12, 8, 20))
    d.line([(520, 692), (700, 692)], fill=(255, 150, 190), width=4)
    for wx in (392, 812):
        d.ellipse([wx - 46, 784, wx + 46, 876], fill=(6, 5, 10))
        d.ellipse([wx - 20, 810, wx + 20, 850], fill=(70, 60, 84))
    d.rectangle([330, 800, 884, 812], fill=(255, 92, 140))
    # driver + passenger heads
    d.ellipse([566, 640, 606, 684], fill=(12, 8, 20))
    d.ellipse([636, 646, 672, 686], fill=(12, 8, 20))
    palm(d, 268, 700, 120, (16, 10, 26), lean=0.3)
    palm(d, 936, 712, 132, (16, 10, 26), lean=-0.28)
    palm(d, 90, 760, 96, (12, 8, 20), lean=0.42)
    return grain_vignette(img, 41)


def pier():
    img = Image.new("RGB", (W, H))
    sky(img, [(0.0, (6, 8, 30)), (0.5, (14, 16, 52)), (0.8, (24, 30, 66)), (1.0, (30, 36, 74))])
    d = ImageDraw.Draw(img)
    rnd = random.Random(11)
    for _ in range(150):
        sx, sy = rnd.randint(0, W), rnd.randint(0, 420)
        r = rnd.choice([1, 1, 2])
        d.ellipse([sx, sy, sx + r, sy + r], fill=(235, 240, 255))
    d.ellipse([980, 60, 1064, 144], fill=(232, 236, 248))
    d.ellipse([1002, 52, 1078, 128], fill=(10, 12, 38))
    # sea
    d.rectangle([0, 520, W, 760], fill=(10, 34, 62))
    for i in range(46):
        y = 532 + i * 5
        x0 = rnd.randint(0, 900)
        ln = rnd.randint(40, 240)
        col = (255, 110, 190) if i % 5 == 0 else ((64, 210, 220) if i % 3 else (120, 170, 220))
        d.line([(x0, y), (x0 + ln, y)], fill=col, width=2)
    # pier deck + posts
    d.polygon([(0, 900), (0, 742), (W, 700), (W, 900)], fill=(38, 24, 20))
    for i in range(11):
        x = 30 + i * 112
        d.line([(x, 748), (x + 60, 900)], fill=(90, 62, 40), width=5)
    for i in range(26):
        x = i * 48
        d.line([(x, 742 - i * 1.6), (x + 34, 900)], fill=(52, 34, 24), width=3)
    # diner block with striped awning
    d.rectangle([90, 380, 560, 700], fill=(24, 22, 44))
    d.rectangle([90, 380, 560, 414], fill=(255, 110, 180))
    for i in range(8):
        x = 96 + i * 58
        d.polygon([(x, 560), (x + 28, 560), (x + 20, 596), (x + 8, 596)], fill=(255, 120, 170) if i % 2 else (240, 244, 250))
    for i in range(4):
        x = 122 + i * 108
        d.rounded_rectangle([x, 452, x + 82, 548], 8, fill=(255, 206, 120), outline=(255, 140, 190), width=3)
    # lamp posts with halos
    for lx in (660, 830, 1000):
        d.line([(lx, 690), (lx, 520)], fill=(16, 14, 26), width=7)
        glow(img, lx, 506, 74, (120, 230, 255), peak=95)
    d = ImageDraw.Draw(img)
    for lx in (660, 830, 1000):
        d.ellipse([lx - 11, 494, lx + 11, 516], fill=(210, 250, 255))
    # ferris wheel silhouette, right
    cx, cy, r = 1010, 330, 168
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 120, 200), width=5)
    d.ellipse([cx - r + 26, cy - r + 26, cx + r - 26, cy + r - 26], outline=(110, 220, 255), width=3)
    for k in range(8):
        a = k * math.pi / 4
        ex, ey = cx + int(math.cos(a) * r), cy + int(math.sin(a) * r)
        d.line([(cx, cy), (ex, ey)], fill=(200, 160, 255), width=3)
        d.ellipse([ex - 9, ey - 9, ex + 9, ey + 9], fill=(255, 214, 120))
    d.line([(cx - 90, 700), (cx, cy), (cx + 90, 700)], fill=(16, 14, 26), width=9)
    img = neon_text(img, (128, 402), "PALMERA DINER", 44, (255, 240, 250), (255, 60, 160))
    img = neon_text(img, (150, 606), "OPEN ALL NIGHT", 30, (190, 250, 255), (40, 160, 255))
    return grain_vignette(img, 97)


def beach():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    # aerial: sand top-left sweeping to turquoise sea bottom-right
    d.rectangle([0, 0, W, H], fill=(238, 214, 160))
    d.polygon([(0, 620), (260, 470), (560, 430), (900, 470), (1200, 560), (1200, 900), (0, 900)], fill=(64, 196, 205))
    d.polygon([(0, 660), (280, 520), (580, 486), (910, 522), (1200, 606), (1200, 900), (0, 900)], fill=(28, 158, 190))
    d.polygon([(0, 730), (340, 600), (700, 580), (1200, 680), (1200, 900), (0, 900)], fill=(16, 110, 168))
    # foam edge
    rnd = random.Random(23)
    for i in range(90):
        t = i / 90
        x = int(t * W)
        y = int(620 - 150 * math.sin(t * 2.4) + rnd.randint(-9, 9))
        d.ellipse([x, y, x + rnd.randint(18, 54), y + 7], fill=(248, 252, 250))
    # umbrellas + towels on the sand
    for _ in range(26):
        ux, uy = rnd.randint(30, 1140), rnd.randint(40, 430)
        if uy > 470 - ux * 0.05:
            continue
        col = rnd.choice([(255, 92, 140), (255, 170, 60), (90, 210, 230), (240, 90, 90)])
        d.polygon([(ux - 34, uy), (ux + 34, uy), (ux, uy - 30)], fill=col)
        d.rectangle([ux - 26, uy + 10, ux + 26, uy + 22], fill=(250, 248, 240))
    # lifeguard tower
    tx, ty = 300, 300
    d.polygon([(tx - 52, ty + 130), (tx - 20, ty), (tx + 20, ty), (tx + 52, ty + 130)], fill=(120, 84, 52))
    d.rectangle([tx - 74, ty - 84, tx + 74, ty + 4], fill=(250, 250, 246))
    d.rectangle([tx - 74, ty - 84, tx + 74, ty - 58], fill=(255, 84, 120))
    d.rectangle([tx - 46, ty - 52, tx + 46, ty - 14], fill=(52, 120, 150))
    d.polygon([(tx - 92, ty - 84), (tx + 92, ty - 84), (tx + 60, ty - 122), (tx - 60, ty - 122)], fill=(255, 84, 120))
    d.line([(tx - 70, ty + 130), (tx + 96, ty + 130)], fill=(90, 60, 36), width=6)
    # boardwalk strip
    d.rectangle([0, 0, W, 34], fill=(150, 110, 70))
    for x in range(0, W, 44):
        d.line([(x, 0), (x, 34)], fill=(110, 78, 46), width=3)
    # speedboat + wake, lower right
    bx, by = 830, 700
    d.polygon([(bx - 190, by + 44), (bx - 60, by - 6), (bx + 170, by - 18), (bx + 226, by + 20), (bx + 120, by + 52)], fill=(248, 248, 250))
    d.rectangle([bx - 60, by - 18, bx + 170, by + 2], fill=(255, 92, 140))
    d.rectangle([bx + 8, by - 52, bx + 96, by - 16], fill=(30, 90, 130))
    for i in range(7):
        sp = i * 26
        d.line([(bx - 200 - sp * 2, by + 30 + sp // 2), (bx - 160, by + 40)], fill=(235, 250, 252), width=4)
        d.line([(bx - 200 - sp * 2, by + 66 - sp // 3), (bx - 160, by + 48)], fill=(235, 250, 252), width=3)
    glow(img, 140, 120, 150, (255, 220, 140), peak=55)
    return grain_vignette(img, 55)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("boulevard.jpg", boulevard), ("pier.jpg", pier), ("beach.jpg", beach)]:
        im = fn()
        path = OUT / name
        im.save(path, "JPEG", quality=84, optimize=True)
        print(f"rendered {path.relative_to(ROOT)} {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
