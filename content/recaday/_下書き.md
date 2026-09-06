---
theme: recaday
lang: ja
title: recaday
description: ここに、検索結果と SNS に出る一行を書く。
image: /assets/recaday-lockup.png
icon: /assets/recaday-icon.png
---

<!--
  recaday の頁。**中身はこれから書く。** ここは骨だけ。

  ・ふつうの文章は、そのまま Markdown で書く
  ・::: で始まる行は「部品」。使えるものの一覧は content/_書き方.md
  ・日本語と英語は ::: ja / ::: en で並べて書く（**両方を組んで、片方を伏せる**）
  ・作り直すのは  node tools/build.mjs        （見ながら書くなら --watch）
-->

::: hero label:ja="どんなアプリか" label:en="What it is"
:::

::: body

::: plate

::: eyebrow
Burn-in vlog
:::

::: ja
# ここに、いちばん言いたい一行。
ここに、その下の 2〜3 行。
:::
::: en
# The one line that matters.
Two or three lines under it.
:::

::: frame scene=dawn font=bold time=07:41 filter=skin caption:ja="ここにキャプション" caption:en="Caption here"
:::

::: chips
- ここに札
- ここに札
- ここに札
:::

:::


::: plate

::: eyebrow
Record
:::

::: ja
## 撮るところの見出し
ここに本文。
:::
::: en
## Heading for recording
Body text here.
:::

::: cols

::: tick
- ここに箇条書き
- ここに箇条書き
- ここに箇条書き
:::

::: phone scene=park time=08:26 left:ja="音 ON" left:en="Mic on" right:ja="タイマー 3s" right:en="Timer 3s"
:::

:::

:::


::: plate

::: eyebrow
Burn-in
:::

::: ja
## 時刻の見出し
ここに本文。
:::
::: en
## Heading for the burned-in time
Body text here.
:::

<!-- 焼き込みの見本を流す。[ 撮った時刻, 背景, 日本語のキャプション, 英語のキャプション ] -->
::: player
[
  ["07:12:40", "dawn", "キャプション 1", "Caption 1"],
  ["07:41:50", "room", "キャプション 2", "Caption 2"],
  ["08:26:20", "park", "キャプション 3", "Caption 3"]
]
:::

::: note
ここに、図についての注意書き。
:::

::: ja
### 書体は 6 種類
ここに本文。
:::
::: en
### Six typefaces
Body text here.
:::

::: fonts
:::

:::


::: plate

::: eyebrow
Edit
:::

::: ja
## 整えるところの見出し
ここに本文。
:::
::: en
## Heading for editing
Body text here.
:::

::: frame scene=room font=bold time=07:41 filter=skin sceneId=filter-scene caption:ja="ここにキャプション" caption:en="Caption here"
:::

::: filters on=skin
:::

::: note
ここに、フィルターについての注意書き。
:::

:::


::: plate

::: eyebrow
Export
:::

::: ja
## 書き出すところの見出し
ここに本文。
:::
::: en
## Heading for export
Body text here.
:::

<!-- つないで一本にする図。[ 時刻, 日本語, 英語 ] -->
::: joiner result:ja="ここに結果の一行" result:en="The result, in one line"
[
  ["07:12", "キャプション 1", "Caption 1"],
  ["07:41", "キャプション 2", "Caption 2"],
  ["08:26", "キャプション 3", "Caption 3"]
]
:::

:::


::: plate

::: eyebrow
Closed test
:::

::: ja
## いま試せます、の見出し
ここに本文。
:::
::: en
## You can try it now
Body text here.
:::

::: act href=/recaday/closed-test/
<span data-l="ja">参加のしかたを見る</span><span data-l="en">See how to join</span>
:::

:::


::: closing
::: ja
ここに、しめの一言。
:::
::: en
The closing line goes here.
:::
:::


::: footer
<span data-l="ja">写真 / 動画 ・ vlog ・ 日記 ・ ライフログ</span>
<span data-l="en">Video · vlog · diary · lifelog</span>
<span><a href="/">{{site.name}}</a></span>
:::

:::
