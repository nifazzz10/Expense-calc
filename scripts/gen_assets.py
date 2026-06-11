#!/usr/bin/env python3
"""Generate icon and splash screen assets for Expense Tracker app."""

from PIL import Image, ImageDraw, ImageFilter
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')

# ── Colors ──────────────────────────────────────────────────────────────────
def h(hex_str):
    s = hex_str.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

BG        = h('#0A0A0F')
SURFACE   = h('#161622')
SURFACE2  = h('#1E1E2E')
BORDER    = h('#2A2A3E')
PURPLE    = h('#7C6FF7')
PURPLE2   = h('#5B50D6')
TEAL      = h('#00D4A8')
PINK      = h('#FF4B6E')
AMBER     = h('#FFB547')
WHITE     = (255, 255, 255)

# ── Helpers ──────────────────────────────────────────────────────────────────
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def radial_bg(size, center, edge):
    """Paint a soft radial gradient background."""
    img = Image.new('RGB', (size, size), edge)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    for r in range(int(size * 0.72), 0, -4):
        t = 1 - r / (size * 0.72)
        c = lerp(edge, center, t ** 1.6)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    return img.convert('RGBA')

def add_glow(img, cx, cy, color, radius, max_alpha=55):
    """Additive soft radial glow on an RGBA image."""
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    for r in range(radius, 0, -4):
        t = (1 - r / radius) ** 2
        a = int(max_alpha * t)
        d.ellipse([cx - r, cy - r, cx + r, cy + r],
                  fill=(*color, a))
    return Image.alpha_composite(img, glow)

def rounded_rect(draw, box, radius, fill):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill)

# ── Chart drawing helper ──────────────────────────────────────────────────────
def draw_chart(img, cx, cy, scale=1.0):
    """Draw a bar + trend-line chart, centred on (cx, cy)."""
    draw = ImageDraw.Draw(img)
    img_rgba = img  # already RGBA

    bar_w   = int(72 * scale)
    bar_gap = int(24 * scale)
    corner  = int(14 * scale)
    bottom  = cy + int(120 * scale)
    max_h   = int(270 * scale)

    # (height_ratio, color)
    bars = [
        (0.48, PINK),
        (0.70, PURPLE2),
        (0.58, PURPLE),
        (0.92, TEAL),
    ]

    n = len(bars)
    total_w = n * bar_w + (n - 1) * bar_gap
    start_x = cx - total_w // 2

    tops = []
    for i, (ratio, color) in enumerate(bars):
        x1 = start_x + i * (bar_w + bar_gap)
        h_px = int(max_h * ratio)
        y1 = bottom - h_px
        x2 = x1 + bar_w
        draw.rounded_rectangle([x1, y1, x2, bottom], radius=corner, fill=color)
        # lighter highlight on top edge
        light = tuple(min(255, c + 50) for c in color)
        draw.rounded_rectangle([x1, y1, x2, y1 + int(corner * 1.5)],
                               radius=corner, fill=light)
        tops.append(((x1 + x2) // 2, y1))

    # Trend line + dots drawn on a separate RGBA layer so we can blur-glow it
    trend = Image.new('RGBA', img.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(trend)

    dot_r = int(9 * scale)
    line_w = max(2, int(3 * scale))

    # Glow halo
    for i in range(len(tops) - 1):
        for w in range(line_w + 10, line_w, -2):
            a = int(60 * (1 - (w - line_w) / 10))
            td.line([tops[i], tops[i + 1]], fill=(*WHITE, a), width=w)

    td.line(tops, fill=(*WHITE, 210), width=line_w)

    for px, py in tops:
        td.ellipse([px - dot_r, py - dot_r, px + dot_r, py + dot_r],
                   fill=(*WHITE, 255))

    return Image.alpha_composite(img_rgba, trend)

# ── App Icon  1024 × 1024 ─────────────────────────────────────────────────────
def make_icon(size=1024):
    center_col = h('#130F28')           # deep purple-black
    img = radial_bg(size, center_col, BG)

    cx = cy = size // 2

    # Purple glow halo
    img = add_glow(img, cx, cy, PURPLE, int(size * 0.55), max_alpha=40)
    img = add_glow(img, cx, cy, TEAL,   int(size * 0.25), max_alpha=18)

    # Draw chart
    img = draw_chart(img, cx, cy + int(size * 0.02), scale=size / 512)

    return img.convert('RGBA')

# ── Splash  1284 × 2778 ───────────────────────────────────────────────────────
def make_splash(w=1284, h_px=2778):
    center_col = h('#0F0C1F')
    img = radial_bg(max(w, h_px), center_col, BG)
    img = img.crop((0, 0, max(w, h_px), max(w, h_px)))
    # Pad / crop to target ratio
    if w != h_px:
        sq = max(w, h_px)
        bg = Image.new('RGBA', (sq, sq), (*BG, 255))
        bg.paste(img)
        img = bg.crop(((sq - w) // 2, (sq - h_px) // 2,
                       (sq - w) // 2 + w, (sq - h_px) // 2 + h_px))
    img = img.convert('RGBA')

    cx, cy_logo = w // 2, h_px // 2 - int(h_px * 0.04)

    # Glow
    img = add_glow(img, cx, cy_logo, PURPLE, int(w * 0.55), max_alpha=50)
    img = add_glow(img, cx, cy_logo, TEAL,   int(w * 0.22), max_alpha=20)

    # Card container
    card_w, card_h = int(w * 0.62), int(w * 0.62)
    card_x = cx - card_w // 2
    card_y = cy_logo - card_h // 2
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h],
                            radius=int(card_w * 0.18),
                            fill=(*SURFACE, 200))
    # Card border
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h],
                            radius=int(card_w * 0.18),
                            outline=(*BORDER, 255), width=2)

    # Draw chart inside card
    img = draw_chart(img, cx, cy_logo + int(card_h * 0.05),
                     scale=card_w / 460)

    # App name text (drawn as simple pixel text via PIL default font)
    # Use a larger built-in font if available, else draw manually
    try:
        from PIL import ImageFont
        font_path = '/System/Library/Fonts/Supplemental/Futura.ttc'
        if not os.path.exists(font_path):
            font_path = '/System/Library/Fonts/Helvetica.ttc'
        if not os.path.exists(font_path):
            font_path = '/System/Library/Fonts/SFNSDisplay.ttf'
        name_font = ImageFont.truetype(font_path, size=int(w * 0.072))
        tag_font  = ImageFont.truetype(font_path, size=int(w * 0.034))
        has_font  = True
    except Exception:
        has_font = False

    draw = ImageDraw.Draw(img)
    text_y = cy_logo + card_h // 2 + int(h_px * 0.038)

    if has_font:
        title = "Expense Tracker"
        bbox  = draw.textbbox((0, 0), title, font=name_font)
        tw    = bbox[2] - bbox[0]
        draw.text((cx - tw // 2, text_y), title,
                  fill=(*WHITE, 245), font=name_font)

        tag  = "Track · Analyse · Save"
        bbox2 = draw.textbbox((0, 0), tag, font=tag_font)
        tw2   = bbox2[2] - bbox2[0]
        draw.text((cx - tw2 // 2, text_y + int(w * 0.09)),
                  tag, fill=(*h('#9D8FFF'), 180), font=tag_font)
    else:
        # Fallback: draw title word-by-word with large default font
        draw.text((cx - 120, text_y), "Expense Tracker",
                  fill=(*WHITE, 245))

    return img

# ── Favicon  48 × 48 ──────────────────────────────────────────────────────────
def make_favicon(size=48):
    img = Image.new('RGBA', (size, size), (*BG, 255))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    # Small bar chart
    bars = [(0.5, PINK), (0.75, PURPLE), (0.95, TEAL)]
    bar_w = 7; gap = 3
    total = len(bars) * bar_w + (len(bars)-1) * gap
    sx = cx - total // 2
    btm = cy + 10
    for i, (r, c) in enumerate(bars):
        x1 = sx + i * (bar_w + gap)
        h_px = int(28 * r)
        draw.rounded_rectangle([x1, btm - h_px, x1 + bar_w, btm],
                               radius=2, fill=c)
    return img

# ── Generate ──────────────────────────────────────────────────────────────────
print("Generating icon.png …")
icon = make_icon(1024)
icon.save(os.path.join(OUT, 'icon.png'))

print("Generating adaptive-icon.png …")
# Android adaptive icon: same design but 20% inner padding
adaptive = Image.new('RGBA', (1024, 1024), (*BG, 255))
inner = make_icon(820)
adaptive.paste(inner, (102, 102), inner)
adaptive.save(os.path.join(OUT, 'adaptive-icon.png'))

print("Generating splash-icon.png …")
splash = make_splash(1284, 2778)
splash.save(os.path.join(OUT, 'splash-icon.png'))

print("Generating favicon.png …")
fav = make_favicon(48)
fav.save(os.path.join(OUT, 'favicon.png'))

print("Done ✓")
