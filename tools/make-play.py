# -*- coding: utf-8 -*-
"""
Google Play の「デベロッパー ページ」に置く 2 枚を焼く。
==========================================================================
    py -3.14 tools/make-play.py

  assets/play/developer-icon-512.png      512x512     … 頭の `s`
  assets/play/developer-header-4096.png   4096x2304   … ロゴ（sawaya studio）

**Play が求める形**
  ・JPEG か **24 ビット PNG（非透過）**  → だから RGB で保存する。alpha を持たせない
  ・アイコン 512x512 / ヘッダー 4096x2304、どちらも 1MB まで

**アイコンに角の丸みを付けないこと。**
Play はデベロッパーのアイコンを**丸く切って**出す。角を丸めても切られるうえ、
非透過なので角の外は地の色がそのまま残る。**四角いっぱいに地を敷く。**
丸に切られたときの直径は一辺の 0.707 なので、字は真ん中に小さめに置く。

**ヘッダーは中央だけが残ると思って組むこと。**
出る幅は端末によって変わり、左右も上下も切られる。
だからロゴは**真ん中に、小さめに**置く。端に何かを置かない。

色は site と同じ（themes/works/style.css の --ink / --paper）。
**濃い地に薄い字**にしてあるのは、Play の頁の地が白いから。
白地に黒字だと、頁に溶けて「画像が出ていない」ように見える。

字の組みは tools/make-logo.py と同じ手（HarfBuzz + TRACKING + PAIRS）。
**あちらの値を変えたら、こちらも同じ顔になるよう走らせ直すこと。**

要るもの
    py -3.14 -m pip install fonttools brotli uharfbuzz pillow
"""

import os
import sys

import uharfbuzz as hb
from fontTools import ttLib
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools/fonts-src/Saira-latin.woff2")
OUT_DIR = os.path.join(ROOT, "assets/play")

# **themes/works/style.css の --ink / --paper と同じ値にすること**
GROUND = (0x1A, 0x1A, 0x18)   # 地（--ink）
INK = (0xF7, 0xF7, 0xF6)      # 字（--paper）

# ---- アイコン ----
ICON_SIDE = 512
ICON_LETTER = "s"
ICON_WEIGHT = 700       # make-icon.py と同じ。細い字は小さくすると消える
ICON_LETTER_H = 0.52    # 一辺に対する字の高さ。丸く切られても収まる

# ---- ヘッダー ----
HEAD_W, HEAD_H = 4096, 2304
HEAD_WEIGHT = 600       # make-logo.py と同じ
HEAD_TRACKING = 90
HEAD_PAIRS = {
    "wa": -14, "ya": -18, "ay": -10, "ud": -6, "di": -4, "io": -6,
    "a ": -40, " s": -40,
}
HEAD_TEXT = "sawaya studio"
# ロゴの幅（画の幅に対する比）。**大きくしないこと。**
# 端が切られる前提なので、真ん中に置いて息を持たせる
HEAD_LOGO_W = 0.38

SS = 2   # いったん倍で描いてから縮める（縁のぎざぎざを消す）


def load(weight):
    """可変軸を 1 点で止めて、Pillow が読める .ttf の中身を返す。

    **flavor を外すこと。** woff2 から読んだものは flavor を持ったままで、
    そのまま save すると名前が .ttf でも中身は woff2 になり、
    Pillow も HarfBuzz も読めない（黙って豆腐になる）。
    """
    font = ttLib.TTFont(SRC)
    font = instancer.instantiateVariableFont(font, {"wght": weight})
    font.flavor = None
    tmp = os.path.join(OUT_DIR, "_tmp-%d.ttf" % weight)
    font.save(tmp)
    with open(tmp, "rb") as fh:
        data = fh.read()
    os.remove(tmp)
    return font, data, tmp


def wordmark(px_w):
    """ロゴを、ink の囲みぴったりに切った RGBA で返す（幅 px_w）。

    並べ方は make-logo.py と同じ。**書体の kern を HarfBuzz に効かせ**、
    そのうえで全体の字間（TRACKING）と対ごとの詰め（PAIRS）を足す。
    """
    font, data, tmp = load(HEAD_WEIGHT)
    upem = font["head"].unitsPerEm

    face = hb.Face(data)
    hbfont = hb.Font(face)
    hbfont.scale = (upem, upem)
    buf = hb.Buffer()
    buf.add_str(HEAD_TEXT)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    if len(buf.glyph_infos) != len(HEAD_TEXT):
        sys.exit("字と字形の数が合わない。合字が起きている")

    # 送りを font unit で積む
    xs, x = [], 0.0
    for i, pos in enumerate(buf.glyph_positions):
        xs.append(x + pos.x_offset)
        x += pos.x_advance
        if i + 1 < len(HEAD_TEXT):
            x += HEAD_TRACKING + HEAD_PAIRS.get(HEAD_TEXT[i:i + 2], 0)
    total = x

    # 倍の大きさで描く
    size = int(round(upem * (px_w * SS) / total))
    with open(tmp, "wb") as fh:
        fh.write(data)
    try:
        f = ImageFont.truetype(tmp, size)
        k = size / upem
        pad = size
        img = Image.new("RGBA", (int(total * k) + pad * 2, size * 3), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        base = size * 2
        for ch, ox in zip(HEAD_TEXT, xs):
            if ch != " ":
                d.text((pad + ox * k, base), ch, font=f, fill=INK + (255,), anchor="ls")
    finally:
        os.remove(tmp)

    # **囲みぴったりに切る。** 余白を残すと、置いた先で真ん中が合わない
    img = img.crop(img.split()[3].getbbox())
    h = max(1, int(round(img.height * px_w / img.width)))
    return img.resize((px_w, h), Image.LANCZOS)


def icon():
    """頭の `s`。四角いっぱいの地に、真ん中へ。角は丸めない（Play が丸く切る）"""
    font, data, tmp = load(ICON_WEIGHT)
    side = ICON_SIDE * SS
    img = Image.new("RGB", (side, side), GROUND)
    d = ImageDraw.Draw(img)

    with open(tmp, "wb") as fh:
        fh.write(data)
    try:
        # 字の高さを合わせるために、いったん大きめで測ってから決める
        probe = 200
        f = ImageFont.truetype(tmp, probe)
        bb = f.getbbox(ICON_LETTER)
        size = int(probe * (side * ICON_LETTER_H) / (bb[3] - bb[1]))
        f = ImageFont.truetype(tmp, size)
        bb = f.getbbox(ICON_LETTER)
        # **インクの囲みで合わせること。** 送り幅で合わせると、字の左右の余白ぶん寄る
        d.text(((side - (bb[2] - bb[0])) / 2 - bb[0],
                (side - (bb[3] - bb[1])) / 2 - bb[1]),
               ICON_LETTER, font=f, fill=INK)
    finally:
        os.remove(tmp)

    out = os.path.join(OUT_DIR, "developer-icon-512.png")
    img.resize((ICON_SIDE, ICON_SIDE), Image.LANCZOS).save(out)
    return out


def header():
    img = Image.new("RGB", (HEAD_W, HEAD_H), GROUND)
    logo = wordmark(int(HEAD_W * HEAD_LOGO_W))
    img.paste(logo, ((HEAD_W - logo.width) // 2, (HEAD_H - logo.height) // 2), logo)
    out = os.path.join(OUT_DIR, "developer-header-4096.png")
    img.save(out)
    return out


def main():
    if not os.path.exists(SRC):
        sys.exit("元の書体が無い: " + SRC)
    os.makedirs(OUT_DIR, exist_ok=True)

    for out in (icon(), header()):
        im = Image.open(out)
        kb = os.path.getsize(out) / 1024
        # **1MB を超えたら Play が受け取らない**ので、ここで気づけるようにする
        warn = "  ← 1MB を超えている" if kb > 1024 else ""
        print("%-42s %sx%s  %s  %.0f KB%s"
              % (os.path.relpath(out, ROOT), im.width, im.height, im.mode, kb, warn))


if __name__ == "__main__":
    main()
