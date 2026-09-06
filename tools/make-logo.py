# -*- coding: utf-8 -*-
"""
sawaya studio のロゴを焼く。
==========================================================================
    py -3.14 tools/make-logo.py

  tools/fonts-src/Saira-latin.woff2  →  assets/sawaya-studio.svg

**なぜ書体を読ませずに、図として焼くのか。**

  1. 字間をここで決められる。css の letter-spacing は「全部の字のうしろに同じ幅を
     足す」ことしかできないが、ロゴは**対ごとに詰める**もの
  2. 書体が読めなかったときに、別の顔で出ることがない
  3. どの大きさでも輪郭が崩れない

recaday のワードマークも同じ考えで焼いてある（あちらは Python の PIL）。

**組みの決まり**

  ・字は HarfBuzz に並べさせる（書体が持っている kern をそのまま効かせる）
  ・そのうえで、**全体の字間**（TRACKING）と、**対ごとの詰め**（PAIRS）を足す
  ・viewBox は**インクの囲みぴったり**に取る。余白を持たせない
    （持たせると、置く側で「見た目の中央」が合わなくなる）

要るもの
    py -3.14 -m pip install fonttools brotli uharfbuzz
"""

import os
import sys

import uharfbuzz as hb
from fontTools import ttLib
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools/fonts-src/Saira-latin.woff2")
OUT = os.path.join(ROOT, "assets/sawaya-studio.svg")

TEXT = "sawaya studio"

# 太さ。可変軸（100〜900）のどこで焼くか。
# 600 は、細すぎず「見出し」になりすぎない
WEIGHT = 600

# 全体の字間（em の千分率）。**ロゴは本文より開ける。**
# 名乗りは読むものではなく、形として覚えるものなので、少し息を入れる
TRACKING = 90

# 対ごとの詰め（em の千分率、負で詰める）。
# **書体の kern で足りないところだけ書く。**
# 小文字だけの組みなので、効くのは丸い字どうしと、間の空きやすい所
PAIRS = {
    "wa": -14,   # w の右下と a の左が開く
    "ya": -18,   # y の払いの下に a が入れる
    "ay": -10,
    "ud": -6,
    "di": -4,
    "io": -6,
    # 語間。**空白そのものを詰める。**
    # 2 語の名前は、離しすぎると 2 つの名前に見える
    "a ": -40,
    " s": -40,
}


def main():
    if not os.path.exists(SRC):
        sys.exit("元の書体が無い: " + SRC)

    # ---- 可変軸を 1 点で止める ----
    font = ttLib.TTFont(SRC)
    font = instancer.instantiateVariableFont(font, {"wght": WEIGHT})
    upem = font["head"].unitsPerEm

    # ---- HarfBuzz に並べさせる（書体が持っている kern がそのまま効く）----
    # **flavor を外してから保存すること。**
    # woff2 から読んだ書体は flavor を持ったままなので、そのまま save すると
    # 名前が .ttf でも中身は woff2 になる。HarfBuzz はそれを読めず、
    # **字がぜんぶ .notdef（豆腐）になる**（黙って起こる）。
    font.flavor = None
    tmp = os.path.join(ROOT, "assets", "_logo-tmp.ttf")
    font.save(tmp)
    with open(tmp, "rb") as fh:
        data = fh.read()
    os.remove(tmp)

    face = hb.Face(data)
    hbfont = hb.Font(face)
    hbfont.scale = (upem, upem)
    buf = hb.Buffer()
    buf.add_str(TEXT)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})

    order = font.getGlyphOrder()
    glyf = font.getGlyphSet()

    # ---- 並べる ----
    pen_paths = []
    x = 0.0
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]

        rec = RecordingPen()
        glyf[name].draw(rec)
        svg = SVGPathPen(glyf)
        # y は上向きに直す（書体は上が +、SVG は下が +）
        rec.replay(TransformPen(svg, Transform(1, 0, 0, -1, x + pos.x_offset, 0)))
        d = svg.getCommands()
        if d:
            pen_paths.append(d)

        x += pos.x_advance

        # 全体の字間と、対ごとの詰め
        if i + 1 < len(buf.glyph_infos):
            x += TRACKING
            pair = TEXT[i:i + 2]
            x += PAIRS.get(pair, 0)

    # ---- インクの囲みを測る ----
    #  **viewBox は囲みぴったりに取る。** 余白を持たせると、置く側で
    #  「見た目の中央」が合わなくなる（recaday のワードマークで実際に起きた）
    bounds = BoundsPen(glyf)
    x = 0.0
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        rec = RecordingPen()
        glyf[name].draw(rec)
        rec.replay(TransformPen(bounds, Transform(1, 0, 0, -1, x + pos.x_offset, 0)))
        x += pos.x_advance
        if i + 1 < len(buf.glyph_infos):
            x += TRACKING
            x += PAIRS.get(TEXT[i:i + 2], 0)

    x0, y0, x1, y1 = bounds.bounds
    w, h = x1 - x0, y1 - y0

    body = "\n  ".join(
        '<path d="%s"/>' % d for d in pen_paths
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.1f %.1f %.1f %.1f" '
        'fill="currentColor" role="img" aria-label="%s">\n  %s\n</svg>\n'
        % (x0, y0, w, h, TEXT, body)
    )

    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg)

    print("%s  %.1f KB  （%.0f x %.0f、比 %.3f）"
          % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024, w, h, w / h))


if __name__ == "__main__":
    main()
