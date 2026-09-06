---
theme: works
lang: ja
title: "{{site.name}}"
description: ここに、検索結果と SNS に出る一行を書く。
---

<!--
  Sawaya Works の頁。**中身も見た目も、これから決める。**

  ・見た目（コンセプトとデザイン）は別途相談。決まったら themes/works/style.css を差し替える
  ・載せるのは「なぜ作っているか」と「連絡先・リンク」
  ・作り直すのは  node tools/build.mjs        （見ながら書くなら --watch）
-->

::: main

::: top

::: mark
{{site.name}}
:::

# ここに、いちばん言いたい一行。

ここに、その下の 2〜3 行。

:::


::: section id=works

::: eyebrow
作ったもの
:::

<!-- [ 名前, 行き先, 一行の説明, 走る場所, その道具の色 ] -->
::: works
[
  ["recaday", "/recaday/", "ここに一行の説明", "iOS / Android", "#F2D357"],
  ["テロップスタジオ", "/telop-studio/", "ここに一行の説明", "Android → iOS → PC", "#2fa45f"]
]
:::

:::


::: section id=why

::: eyebrow
なぜ作っているか
:::

## ここに見出し。

ここに本文。

:::


::: section id=contact

::: eyebrow
連絡先
:::

<!-- [ 名前, 行き先, （出したい字。省くと行き先がそのまま出る）] -->
::: links
[
  ["GitHub", "https://github.com/SawayaWorks"]
]
:::

:::

:::


::: footer
<span>{{site.name}}</span>
<span>ここに、ひとこと</span>
:::
