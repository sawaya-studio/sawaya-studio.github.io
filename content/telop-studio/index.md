---
theme: telop
lang: ja
title: テロップスタジオ
description: ここに、検索結果と SNS に出る一行を書く。
image: /telop-studio/icon.png
twitterCard: summary
icon: /telop-studio/favicon.png
---

<!--
  テロップスタジオの頁。**中身はこれから書く。** ここは骨だけ。

  ・ふつうの文章は、そのまま Markdown で書く
  ・::: で始まる行は「部品」。使えるものの一覧は content/_書き方.md
  ・作り直すのは  node tools/build.mjs        （見ながら書くなら --watch）

  この頁の作法（道具の側からそのまま引いてある）
  ・**緑は押せるものだけ。** 飾りに緑を使うと、押せる色が意味を失う
  ・**オレンジは押せないものだけ。** 札・数字・見出しの影
-->

::: topbar brand="テロップスタジオ" lead="ここに、ひとことの説明" pill="作っています"
:::

::: main

::: hero

::: eyebrow
TELOP STUDIO
:::

# ここに、いちばん言いたい一行。

::: lead
ここに、その下の 2〜3 行。
:::

::: chips
- ここに札
- ここに札
- ここに札
:::

::: cta
::: btn href=#road
いまどこまで来ているか
:::
::: btn href=#how ghost
画面をさわってみる
:::
:::

:::


::: section id=how

::: eyebrow
画面
:::

## さわれる画面の見出し

ここに本文。

<!--
  行の一覧と、右のいつでも見える画面。
    kind … speech（セリフ）/ gap（無音）/ telop / text / se / bgm
    at   … その行の時刻
    who  … 誰が喋ったか（speakers の何番目か）
    cut  … true にすると、書き出しから落ちた見た目になる
  pos は、テロップを最初に置く場所（0〜8。左上から右下へ）
-->
::: editor speakers="わたし:#2fa45f, ゲスト:#f2913c" pos=7 note="※ うしろの絵は見本です。"
[
  {"kind":"speech","at":"0:00.4","who":0,"text":"ここにセリフ","cut":true},
  {"kind":"gap","at":"0:02.1","len":1.9},
  {"kind":"speech","at":"0:04.0","who":0,"text":"ここにセリフ"},
  {"kind":"speech","at":"0:07.2","who":1,"text":"ここにセリフ"},
  {"kind":"gap","at":"0:10.6","len":0.4},
  {"kind":"telop","at":"0:11.0","text":"ここにテロップ"},
  {"kind":"se","at":"0:12.4","file":"ぽん.wav","hint":"この時刻に1回鳴る"},
  {"kind":"speech","at":"0:13.1","who":0,"text":"ここにセリフ"}
]
:::

:::


::: section

::: eyebrow
できること
:::

## できることの見出し

::: spec
| ここに項目 | ここに説明 |
| ここに項目 | ここに説明 |
| ここに項目 | ここに説明 |
:::

:::


::: section

::: eyebrow
つくり
:::

## つくりの見出し

::: cols

::: card
### ここに小見出し
ここに本文。
:::

::: card
### ここに小見出し
ここに本文。
:::

::: card
### ここに小見出し
ここに本文。
:::

:::

:::


::: section id=road

::: eyebrow
これから
:::

## これからの見出し

ここに本文。

<!-- now= が「いまここ」。[ 名前, 説明 ] -->
::: road now=1
[
  ["Android 版", "ここに説明。"],
  ["iOS 版", "ここに説明。"],
  ["Windows / Mac", "ここに説明。"]
]
:::

::: note
ここに、ひとこと。
:::

:::

:::


::: footer
<span>ここに、この頁が何の頁かを一行で</span>
<span><a href="/">{{site.name}}</a></span>
:::
