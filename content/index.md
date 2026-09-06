---
theme: works
lang: ja
title: "{{site.name}}"
description: sawaya studio top ページ
icon: /assets/sawaya-studio-icon.svg
appleIcon: /assets/sawaya-studio-icon.png
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

<!-- 名乗り。焼いた 1 枚（assets/sawaya-studio.svg）。
     字を変えたら  py -3.14 tools/make-logo.py -->
::: logo
:::


<!-- キャッチコピー。**字詰めは自動で入ります**（約物と、和文と欧文のあいだ）。
     行を分けたいところで改行するだけ。中で Markdown は効きません -->
::: catch
ちょっとだけおしゃれに
ちょっとだけたのしく
:::

<br/>

::: lead
かんたんに生活を彩るアプリを作っています
:::


::: <!-- top -->


::: section id=works

<!-- [ 名前, 行き先, 顔, 走る場所 ]  顔は recaday / telop / plain -->
::: shelf
[
  ["recaday", "/recaday/closed-test/", "recaday", "Android (iOS 対応予定)"],
  ["テロップスタジオ", "/telop-studio/", "telop", "未リリース (iOS / Android 対応予定)"]
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
  ["GitHub", "https://github.com/sawaya-studio"]
]
:::

:::

:::


::: footer
<span>{{site.name}}</span>
<span>あなたの生活によりそう</span>
:::
