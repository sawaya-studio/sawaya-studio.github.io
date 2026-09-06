# sawayaworks.github.io

公開ページ。`content/` の `.md` を書くと、頁ができます。

```
node tools/build.mjs            作り直す
node tools/build.mjs --watch    直したら、そのつど作り直す
node tools/serve.mjs            http://127.0.0.1:5199/ で見る
```

**書き方は [content/_書き方.md](content/_書き方.md) にあります。**

---

## 頁

| `/` | sawaya studio | `content/index.md` ／ テーマ `works` |
| `/recaday/` | recaday の紹介 | `content/recaday/index.md` ／ テーマ `recaday` |
| `/recaday/closed-test/` | クローズドテストの案内 | **手で書いた頁**（作り直しの対象外） |
| `/telop-studio/` | テロップスタジオの紹介 | `content/telop-studio/index.md` ／ テーマ `telop` |

`/recaday/closed-test/` だけは `content/` を持ちません。
[recaday の側](https://github.com/SawayaWorks/recaday) の `store/closed-test.html` を
そのまま持ってきたもので、**中身は変えていません**。変えたのは 3 つだけです。

1. `doctype` / `charset` / `viewport` を足した（**無いと携帯で 980px 幅に縮んで出る**）
2. 絵を base64 から実ファイルへ（581KB → 23KB）
3. 空を `/assets/sky.js` の読み込みに

---

## 並び

```
content/        ← 中身（.md）。**ここだけ書けばよい**
themes/         ← 見た目と部品
  recaday/  telop/  works/
    style.css     見た目 →  assets/<テーマ>.css へ書き出される
    page.js       動くところ →  assets/<テーマ>.js へ（注記だけなら置かない）
    theme.mjs     頁の外枠と、::: で呼べる部品
  _lib.mjs      テーマが共通で使う小道具
tools/
  build.mjs     .md → .html
  md.mjs        小さな Markdown
  serve.mjs     手元で見るためのサーバ
assets/         ← 頁をまたいで使う重いもの
  sky.js        うしろの空（recaday アプリの SKSL を WebGL へ写したもの）
  clouds.js     その雲。**頁の中に抱えている**（下記）
  clouds.png    その元（tools/sky/bake.py が焼いた 1 枚）。**消さないこと**
  fonts/        時刻の書体。**使う字だけに絞ってある**（1〜5KB）
site.json       ← site の名前と URL。**名前を変えるときはここだけ**
```

`content/` の並びが、そのまま URL になります。`_` で始まる `.md` は頁になりません。

**css と js は、テーマごとに 1 本ずつ `assets/` へ書き出します**（`assets/telop.css` など）。
頁はそれを読むだけで、中に埋めません。名前のうしろに付く `?v=` は中身から作った印で、
**直したのに古いものが出る**のを防ぎます。

ひとつだけ、頁に直に書いている script があります。recaday の頁の
**「日本語と英語のどちらで出すか」を決めるところ**です。**組み上がる前に決める必要がある**ので、
別ファイルにすると、最初の一瞬だけもう片方が見えてしまいます。

---

## 雲を、頁の中に抱えている理由

**頁のファイルを直接開く（file://）と、Chrome は別ファイルの画像を「よそから来たもの」
として扱います。** よその画像は WebGL のテクスチャに載せられないので、雲の濃さが一定になり、
しきい値を越えず、**雲が一枚も出ない空**になります。空と太陽は出るので、一見それらしく
見えてしまうのが厄介なところです。

だから雲は `assets/clouds.js` に抱えてあります。**`clouds.png` を直に読ませないこと。**
元の closed-test の頁も、同じ理由で頁の中に埋めていました。

雲を差し替えるときは、`assets/clouds.png` を置き換えてから焼き直します。

```
node tools/bake-clouds.mjs
```

---

## 素材の出どころ

| 空・雲・ロゴ・時計の書体 | [recaday](https://github.com/SawayaWorks/recaday) から |
| テロップスタジオの組み | 「昭和レトロポップ見本帳」（ロゴを決めるための下調べ）から |
| 看板の書体 | 851ゴチカクット（作者: 8:51:22 pm）。改造・再配布可・商用可 |
| 見出しの書体 | RocknRoll One（SIL OFL）。見本帳が本命に挙げたもの |
| 時計の書体 | どれも SIL OFL。ライセンス文は `assets/fonts/OFL-*.txt` |

**書体は、頁に出てくる字だけに絞ってあります**（`pyftsubset`）。
RocknRoll One は日本語ぶんで 950KB ありますが、絞ると 12KB です。

見出しに新しい字を使ったら、絞り直してください。

```
node tools/build.mjs
node tools/subset-fonts.mjs
```

**足りない字があるときは `node tools/build.mjs` が教えてくれます**
（そこだけ別の書体で出てしまい、黙って起こると気づけないため）。
