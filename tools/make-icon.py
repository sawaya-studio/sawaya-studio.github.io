# -*- coding: utf-8 -*-
"""
タブのアイコンを焼く。
==========================================================================
    py -3.14 tools/make-icon.py

  sawaya studio … tools/fonts-src/Saira-latin.woff2 の `s`
      →  assets/sawaya-studio-icon.svg   （Chrome / Firefox。どの大きさでも崩れない）
      →  assets/sawaya-studio-icon.png   （180x180。Safari とホーム画面用）

  recaday … recaday の assets/logo-r.png（**白い R が透明地**）
      →  assets/recaday-icon.png         （180x180）

  **白い R をそのまま置かないこと。** 透明地なので、明るいタブでは消える。
  7:00 の空（skyTable.ts の 3 色）を地に敷いて、頁と同じ顔にする。

**16px で見えるものしか置かない。**
ワードマーク（sawaya studio）はタブの大きさでは読めないので、頭の `s` だけにする。
ロゴと同じ Saira なので、並べたときに別物に見えない。

**濃い地に、薄い字。** タブの地は明るいことも暗いこともあるので、
四角い塊があるほうがどちらでも見つけやすい。白地に黒字だと、明るいタブに溶ける。

字は本文より太くする（700）。**細い字は 16px で消える。**
"""

import os
import sys

from fontTools import ttLib
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools/fonts-src/Saira-latin.woff2")
OUT_SVG = os.path.join(ROOT, "assets/sawaya-studio-icon.svg")
OUT_PNG = os.path.join(ROOT, "assets/sawaya-studio-icon.png")

LETTER = "s"
WEIGHT = 700           # 本文より太く。細い字は 16px で消える
SIDE = 1000            # 図の中の一辺
RADIUS = 0.22          # 角の丸み（一辺に対する比）
LETTER_H = 0.52        # 字の高さ（一辺に対する比）
# **themes/works/style.css の --ink / --paper と同じ値にすること。**
# ここだけ古い色のままだと、タブのアイコンと頁のロゴで黒が食い違う
GROUND = "#1A1A18"     # 地（--ink。ロゴと同じ色）
INK = "#F7F7F6"        # 字（--paper）
PNG_SIDE = 180         # ホーム画面に置いたときの大きさ


def glyph_path_and_bounds(font, name):
    glyf = font.getGlyphSet()
    rec = RecordingPen()
    glyf[name].draw(rec)

    b = BoundsPen(glyf)
    rec.replay(b)
    return rec, b.bounds


def main():
    if not os.path.exists(SRC):
        sys.exit("元の書体が無い: " + SRC)

    font = ttLib.TTFont(SRC)
    font = instancer.instantiateVariableFont(font, {"wght": WEIGHT})
    upem = font["head"].unitsPerEm
    name = font.getBestCmap()[ord(LETTER)]

    rec, (x0, y0, x1, y1) = glyph_path_and_bounds(font, name)
    gw, gh = x1 - x0, y1 - y0

    # ---- 字を、四角のまんなかへ ----
    # **インクの囲みで合わせること。** 送り幅で合わせると、
    # 字の左右の余白ぶんだけ寄って見える
    scale = (SIDE * LETTER_H) / gh
    tx = SIDE / 2 - (x0 + gw / 2) * scale
    ty = SIDE / 2 + (y0 + gh / 2) * scale   # y は下向きに直すので +

    svg_pen = SVGPathPen(font.getGlyphSet())
    rec.replay(TransformPen(svg_pen, Transform(scale, 0, 0, -scale, tx, ty)))
    d = svg_pen.getCommands()

    r = SIDE * RADIUS
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
        'role="img" aria-label="sawaya studio">\n'
        '  <rect width="%d" height="%d" rx="%.1f" fill="%s"/>\n'
        '  <path d="%s" fill="%s"/>\n'
        '</svg>\n' % (SIDE, SIDE, SIDE, SIDE, r, GROUND, d, INK)
    )
    with open(OUT_SVG, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg)

    # ---- PNG ----
    # **4 倍で描いてから縮める。** そのまま 180 で描くと、角と字の縁がぎざぎざになる
    up = 4
    side = PNG_SIDE * up
    img = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, side - 1, side - 1],
                           radius=side * RADIUS, fill=GROUND)

    # 書体を Pillow に渡すために、いったん .ttf として書き出す。
    # **flavor を外すこと。** woff2 から読んだものは flavor を持ったままなので、
    # そのまま save すると中身が woff2 になり、Pillow が読めない
    font.flavor = None
    tmp = os.path.join(ROOT, "assets", "_icon-tmp.ttf")
    font.save(tmp)
    try:
        # 字の高さを合わせるために、いったん大きめで測ってから決める
        probe = 100
        f = ImageFont.truetype(tmp, probe)
        bb = f.getbbox(LETTER)
        size = int(probe * (side * LETTER_H) / (bb[3] - bb[1]))
        f = ImageFont.truetype(tmp, size)
        bb = f.getbbox(LETTER)
        draw.text(((side - (bb[2] - bb[0])) / 2 - bb[0],
                   (side - (bb[3] - bb[1])) / 2 - bb[1]),
                  LETTER, font=f, fill=INK)
    finally:
        os.remove(tmp)

    img.resize((PNG_SIDE, PNG_SIDE), Image.LANCZOS).save(OUT_PNG)

    print("%s  %.1f KB" % (os.path.relpath(OUT_SVG, ROOT), os.path.getsize(OUT_SVG) / 1024))
    print("%s  %.1f KB  （%dx%d）"
          % (os.path.relpath(OUT_PNG, ROOT), os.path.getsize(OUT_PNG) / 1024, PNG_SIDE, PNG_SIDE))


# ---- recaday ----------------------------------------------------------------

R_SRC = "E:/claude_workspace/solog/assets/logo-r.png"
R_OUT = os.path.join(ROOT, "assets/recaday-icon.png")
# 空。skyTable.ts の 7:00 の行（頁のうしろと同じ 3 色）
SKY = [(0.00, (0x5D, 0x81, 0x97)),
       (0.52, (0x70, 0x97, 0xAD)),
       (1.00, (0xCA, 0xC4, 0xA8))]


def recaday():
    """recaday のアイコン。**白い R に、7:00 の空を敷く。**"""
    if not os.path.exists(R_SRC):
        print("×  recaday の R が無い: " + R_SRC)
        return

    up = 4
    side = PNG_SIDE * up

    # 空。上から下へ、3 色を継いで塗る
    sky = Image.new("RGB", (1, side))
    for y in range(side):
        t = y / (side - 1)
        for i in range(len(SKY) - 1):
            a, ca = SKY[i]
            b, cb = SKY[i + 1]
            if a <= t <= b:
                k = (t - a) / (b - a)
                sky.putpixel((0, y), tuple(int(ca[j] + (cb[j] - ca[j]) * k) for j in range(3)))
                break
    sky = sky.resize((side, side))

    img = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, side - 1, side - 1], radius=side * RADIUS, fill="#FFFFFF")
    img = Image.composite(sky.convert("RGBA"), Image.new("RGBA", (side, side), (0, 0, 0, 0)),
                          img.split()[3])

    # R を、インクの囲みで真ん中へ
    r = Image.open(R_SRC).convert("RGBA")
    box = r.split()[3].getbbox()
    r = r.crop(box)
    h = int(side * 0.52)
    w = int(r.width * h / r.height)
    r = r.resize((w, h), Image.LANCZOS)
    img.alpha_composite(r, ((side - w) // 2, (side - h) // 2))

    img.resize((PNG_SIDE, PNG_SIDE), Image.LANCZOS).save(R_OUT)
    print("%s  %.1f KB  （%dx%d）"
          % (os.path.relpath(R_OUT, ROOT), os.path.getsize(R_OUT) / 1024, PNG_SIDE, PNG_SIDE))



# ---- オートモザイク ---------------------------------------------------------

M_SVG = os.path.join(ROOT, "assets/auto-mosaic-icon.svg")
M_PNG = os.path.join(ROOT, "assets/auto-mosaic-icon.png")
# 道具の theme/index.ts の値。**混ぜものをしないこと**
M_KEY = "#0026E6"
M_INK = "#000000"
M_PAPER = "#FFFFFF"


def auto_mosaic():
    """オートモザイクのアイコン。**タイル 4 つ。**

    道具のアイコン（mobile/assets/icon-512.png）と同じ組みだが、
    **黒を四角いっぱいに広げてある。** あちらは白い余白の中に黒い四角が
    浮いていて、16px まで縮めると縁の黒が消えてタイルだけが散る。

    **角は丸めない。** この道具が作るのは四角いタイル。
    """
    # 100 の中で … 縁 8、タイル 39、あいだ 6
    B, T, G = 8, 39, 6
    tiles = [(B, B, M_KEY), (B + T + G, B, M_PAPER), (B + T + G, B + T + G, M_KEY)]

    rows = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
            'role="img" aria-label="auto mosaic">',
            '  <rect width="100" height="100" fill="%s"/>' % M_INK]
    for x, y, c in tiles:
        rows.append('  <rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>'
                    % (x, y, T, T, c))
    rows.append('</svg>')
    with open(M_SVG, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(rows) + "\n")

    # PNG。**縮めてぼかさないこと。** 直線しか無いので、そのままの大きさで描く
    k = PNG_SIDE / 100.0
    img = Image.new("RGB", (PNG_SIDE, PNG_SIDE), M_INK)
    d = ImageDraw.Draw(img)
    for x, y, c in tiles:
        d.rectangle([round(x * k), round(y * k),
                     round((x + T) * k) - 1, round((y + T) * k) - 1], fill=c)
    img.save(M_PNG)

    for f in (M_SVG, M_PNG):
        print("%s  %.1f KB" % (os.path.relpath(f, ROOT), os.path.getsize(f) / 1024))


if __name__ == "__main__":
    main()
    recaday()
    auto_mosaic()
