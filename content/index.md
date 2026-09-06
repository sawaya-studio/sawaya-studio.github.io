---
theme: works
lang: ja
title: "{{site.name}}"
description: ここに、検索結果と SNS に出る一行を書く。
---

<!--
  sawaya studio の頁。**中身はこれから書く。** ここは骨だけ。

  **この頁は、コンセプトを言葉で説明しない。見せて伝える。**
  だから地は何も主張せず、棚に並ぶ札そのものがその道具の顔になっている
  （空と焼き込みの時刻／方眼紙と緑の看板と台本の行）。
  **札の中に説明の字を置かないこと。** 置いた瞬間に、見せる頁ではなくなる。

  ・作り直すのは  node tools/build.mjs        （見ながら書くなら --watch）
  ・札の顔を足したいときは、themes/works/theme.mjs の FACE と
    themes/works/style.css の .face--* に 1 つずつ書く
-->

::: main

::: top

::: mark
{{site.name}}
:::

# ここに、いちばん言いたい一行。

:::


::: section id=works

<!-- [ 名前, 行き先, 顔, 走る場所 ]  顔は recaday / telop / plain -->
::: shelf
[
  ["recaday", "/recaday/", "recaday", "iOS / Android"],
  ["テロップスタジオ", "/telop-studio/", "telop", "Android → iOS → PC"]
]
:::

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
