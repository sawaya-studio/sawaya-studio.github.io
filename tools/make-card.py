# -*- coding: utf-8 -*-
"""
SNS に貼ったときに出る札（og:image）を焼く。
==========================================================================
    py -3.14 tools/make-card.py

  assets/cards/recaday-1200x630.png     recaday と closed test の頁

**なぜ、ワードマークをそのまま og:image にしてはいけないか。**

  1. **透けている。** assets/recaday-lockup.png は地が透明。
     貼り先が暗い所（Threads の夜の見た目など）だと、黒に近い字が消える。
     og:image は**地を持った 1 枚**でなければならない。
  2. **形が違う。** ワードマークは 3.09 : 1。札は 1.91 : 1（1200x630）。
     合わないものを渡すと、切られるか、**そもそも使われない。**
     使われないと、貼り先は頁の中でいちばん大きい絵を勝手に拾う。
     closed test では、それが「権限がありません」の画面だった。

だから、**頁と同じ顔をした 1 枚を、正しい形と地で焼いて渡す。**

**空は、本物を撮って置く。**
うしろの空は WebGL の shader（assets/sky.js。アプリの SkyBackdrop.tsx の写し）で
描いている。ここで色の帯だけを作ると、**雲の無い空になる**（実際に一度そうなった）。
だから、その shader に 1200x630 で描かせた 1 枚を tools/cards-src/ に置いてある。

  空を撮り直したいとき
    1. npm run serve
    2. http://127.0.0.1:5199/tools/card-shot.html を開く（1200x630 で描く頁）
    3. その 1200x630 を撮って tools/cards-src/recaday-sky-1200x630.png に置く

ワードマークは**撮らずに、ここで重ねる。** 撮った絵を伸ばすと字の輪郭がにじむ。
雲はにじんでも分からないが、字は分かる。

**名前を変えたら、貼り先の覚えも切れる。** Threads も X も、一度読んだ札を
しばらく覚えている。差し替えたのに古いままのときは、名前を変えるのが早い。
"""

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets/cards")
LOCKUP = os.path.join(ROOT, "assets/recaday-lockup.png")

# 札の形。**1.91 : 1。** og:image はどこでもこの形で見られる
W, H = 1200, 630

# 撮っておいた空（雲つき）。作り直し方は上のとおり
SKY_SRC = os.path.join(ROOT, "tools/cards-src/recaday-sky-1200x630.png")

# ワードマークの幅（札の幅に対する比）。**大きくしないこと。**
# 一覧の中では小さく出るので、余白があるほうが名前として読める
MARK_W = 0.52


def main():
    for f in (LOCKUP, SKY_SRC):
        if not os.path.exists(f):
            sys.exit("元が無い: " + f)
    os.makedirs(OUT_DIR, exist_ok=True)

    img = Image.open(SKY_SRC).convert("RGB")
    if img.size != (W, H):
        img = img.resize((W, H), Image.LANCZOS)

    mark = Image.open(LOCKUP).convert("RGBA")
    w = int(W * MARK_W)
    mark = mark.resize((w, round(mark.height * w / mark.width)), Image.LANCZOS)

    """
    **絵の中心と、字の中心は同じではない。**
    焼いた 1 枚（1658 x 536）を測ると、上下は画像のちょうど中央だが、
    左右は**字が右へ 27.5px（幅の 1.66%）寄っている**。
    絵をそのまま中央に置くと、そのぶん字が右へずれる。
    """
    x = (W - mark.width) // 2 - round(mark.width * 0.0166)
    y = (H - mark.height) // 2
    img.paste(mark, (x, y), mark)

    out = os.path.join(OUT_DIR, "recaday-1200x630.png")
    img.save(out, optimize=True)
    im = Image.open(out)
    print("%s  %sx%s  %s  %.0f KB"
          % (os.path.relpath(out, ROOT), im.width, im.height, im.mode,
             os.path.getsize(out) / 1024))


if __name__ == "__main__":
    main()
