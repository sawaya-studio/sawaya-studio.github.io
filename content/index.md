---
theme: works
lang: ja
title: "{{site.name}}"
description: sawaya studio top ページ
icon: /assets/sawaya-studio-icon.svg
appleIcon: /assets/sawaya-studio-icon.png
---

<!--
  sawaya studio の頁。

  **この頁は、コンセプトを言葉で説明しない。見せて伝える。**
  だから地は何も主張せず、棚に並ぶ札そのものがその道具の顔になっている
  （空と焼き込みの時刻／方眼紙と緑の看板／白い紙と四角いタイル）。
  **札の中に説明の字を置かないこと。** 置いた瞬間に、見せる頁ではなくなる。

  **日本語と英語は、両方を書いておく。** どちらを出すかは、見る人の端末の
  言葉の設定で自動で決まる（切り替えの札は出さない）。
  ::: ja / ::: en で包むか、値の中なら ["日本語", "English"] と 2 つ並べて書く。

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
::: ja
::: catch
ちょっとだけおしゃれに
ちょっとだけたのしく
:::
:::
::: en
::: catch
a little more beautiful
a little more fun
:::
:::

<br/>

::: ja
::: lead
かんたんに生活を彩るアプリを作っています
:::
:::
::: en
::: lead
Small apps that add a little colour to the day
:::
:::


::: <!-- top -->


::: section id=works

<!-- [ 名前, 行き先, 顔, 走る場所, ほかの行き先 ]
     顔は recaday / telop / mosaic / plain
     字は ["日本語", "English"] と 2 つ並べて書けます -->
::: shelf
[
  ["recaday", "/recaday/closed-test/", "recaday",
    ["Android (iOS 対応予定)", "Android (iOS to follow)"],
    [["Instagram", "https://www.instagram.com/recaday_app/"]]],
  [["テロップスタジオ", "telop studio"], "/telop-studio/", "telop",
    ["未リリース (iOS / Android / PC 対応予定)", "Not released yet (iOS / Android / PC)"]],
  [["オートモザイク", "auto mosaic"], "/auto-mosaic/", "mosaic",
    ["未リリース (iOS / Android 対応予定)", "Not released yet (iOS / Android)"]]
]
:::

:::


::: section id=contact

::: ja
::: eyebrow
連絡先
:::
:::
::: en
::: eyebrow
Contact
:::
:::

<!-- [ 名前, 行き先, （出したい字。省くと行き先がそのまま出る）]
     行き先が住所の形をしていない行は、押せない字として出ます -->
::: links
[
  ["GitHub", "https://github.com/sawaya-studio"],
  ["Email", "kento.sawaya at gmail.com"]
]
:::

:::

:::


::: footer
<span>{{site.name}}</span>
<span data-l="ja">あなたの生活によりそう</span>
<span data-l="en">Close to your everyday</span>
:::
