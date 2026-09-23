---
theme: recaday
lang: ja
title: recaday
# ここは検索結果と SNS に出る一行。**「準備中です。」のままにしないこと。**
description: >
  一日を短く撮りためて、一本の vlog にするアプリ。撮った時刻がそのまま映像に
  焼き込まれるので、時間を調べて入れる必要はありません。
image: /assets/cards/recaday-1200x630.png
imageW: 1200
imageH: 630
imageAlt: RECADAY — record a day
icon: /assets/recaday-icon.png
---

<!--
  recaday の頁。**流れは 3 つ。話が増えたら板を足す。**

  流れは 3 つ。
    1. 名前だけの 1 画面（::: hero）
    2. 焼いた 1 本を、黙って流す（::: video）
    3. 「こんなアプリです」と説明する（::: body の中の板）

  **先に見せて、あとから説明する。** 説明を先に置くと、読む頁になる。
  動画で伝わってしまうことは、下で言い直さないこと。

  **日本語と英語は、両方を書いておく。** どちらを出すかは、見る人の端末の
  言葉の設定で自動で決まる（切り替えの札は出さない）。

  ・作り直すのは  node tools/build.mjs        （見ながら書くなら --watch）
  ・使える部品の一覧は content/_書き方.md
  ・字を足したら  node tools/subset-fonts.mjs
-->


<!-- ========== 1. 名前だけの 1 画面 ==========
     「↓」の行き先は、すぐ下の動画（#take）。**#read にしないこと。**
     body を指すと、押した人が動画を飛び越してしまう。 -->

::: hero href=#take label:ja="どんなアプリ？" label:en="What it is"
:::


<!-- ========== 2. 焼いた 1 本 ==========
     **枠も名札も出ない。消音で、繰り返し流れる。**
     file は assets/videos/ の下に置く。
     poster= を足すと、読み込むまでのあいだ、その 1 枚が出る。 -->

::: video id=take src="/assets/videos/recaday_縦動画テスト_20260909-032219.mp4"
:::


<!-- ========== 3. 説明 ==========
     ここから下が「こんなアプリです」。**1 つの話につき、板 1 枚。**
     話が増えたら板を足し、要らない板は丸ごと消す。 -->

::: body

<!-- つかみ。**いちばん言いたい一行を、ここに 1 つだけ。**
     動画を見たばかりの人が、ここで「何のアプリか」を言葉で受け取る。 -->
::: plate class=read

::: eyebrow
Record a day! Make a vlog!
:::

::: ja
# 簡単に vlog が作れるアプリです！
このページで流れている動画のような vlog を簡単に作れます。
時間を自分で調べて入れる必要はありません！
:::
::: en
# Making a vlog, the easy way.
You can make a vlog like the one playing on this page.
No need to look up the time and type it in yourself.
:::

:::


<!-- しめ。**押す口は、頁にこれ 1 つだけ。**
     まだ誰でも入れるわけではないので、行き先は closed test の案内。 -->
::: plate class=read

::: eyebrow
Closed test
:::

::: ja
## Android 向け closed test 実施中です！
下記 URL からアクセスして、ぜひ試してみてください！
:::
::: en
## Closed testing is open for Android
Follow the link below to join and give it a try.
:::

::: act href=/recaday/closed-test/
<span data-l="ja">参加のしかたを見る</span><span data-l="en">See how to join</span>
:::

:::



::: footer
<span data-l="ja">写真 / 動画 ・ vlog ・ 日記 ・ ライフログ</span>
<span data-l="en">Video · vlog · diary · lifelog</span>
<span data-l="ja"><a href="/recaday/support/">サポート</a> ・ <a href="/recaday/privacy/">プライバシーポリシー</a></span>
<span data-l="en"><a href="/recaday/support/">Support</a> · <a href="/recaday/privacy/">Privacy</a></span>
<span><a href="/">{{site.name}}</a></span>
:::

:::
