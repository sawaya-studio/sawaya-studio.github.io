/*
  sawaya studio のテーマ。

  **見た目はまだ決まっていない。**（コンセプトとデザインは別途相談）
  いまは中身を置ける形だけ用意してある。決まったら style.css を差し替える。
*/

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { esc, unwrapP, classifyList, head, bi, LANG_SCRIPT } from '../_lib.mjs';
// 日本語の字詰め。**約物は枠の半分しか墨が無い**ので、そこを詰める
import { kernText } from '../../tools/kerning.mjs';

/*
  札の顔。
  ==========================================================================
  **どの札も、組み方は 1 つだけ。**

      うしろ … その道具の「地」。見ただけでどの道具か分かるもの
      まんなか … その道具のロゴ

  **アプリの画面は持ちこまない。** 行や札やボタンを並べると、
  ここが小さな取扱説明になってしまう。ここで見せたいのは中身ではなく、
  **その道具がどんな顔をしているか**だけ。

  地も字も、その道具の中で使っている値をそのまま持ってきている。
  形は style.css の .face--* 側にある。ここは中身だけ。
*/
const FACE = {
  /*
    うしろ … 7:00 の空と、流れる雲
    まんなか … ワードマーク

    **空は本物を敷く。** アプリの SkyBackdrop.tsx を写した /assets/sky.js が、
    closed-test の頁と同じ雲（tools/sky/bake.py が焼いた 1 枚）を引いて描く。
    CSS の縞で真似ていたことがあるが、**縞は雲にならない。**

    ワードマークは tools/social/instagram.py の logo_lockup が焼いた 1 枚を
    そのまま置いている（インスタの投稿と同じ組み）。**CSS で組み直さないこと。**
    あちらは字間を「ロゴのインク幅の 94%」になるまで描いて測って詰め直し、
    2 段の重心も光学中心へ寄せている。web で近い値を手で入れると必ず食い違う。
  */
  recaday: () => '<canvas data-sky></canvas>' +
    '<img class="lockup" src="/assets/recaday-lockup.png" width="1658" height="536" alt="">',

  /*
    うしろ … 方眼紙
    まんなか … 看板（緑の箱に白い字、オレンジのぼかさない影、黒の縁）
  */
  telop: () => '<div class="brand">テロップスタジオ</div>',

  /*
    うしろ … 白い紙
    まんなか … タイル 4 つのしるし

    値は道具の theme/index.ts から（白・黒・原色の青 #0026e6）。
    **角を丸めないこと。** この道具が作るのは四角いタイルで、
    道具の形もそれにそろえてある。1 か所でも丸めると別のアプリの顔になる。
  */
  mosaic: () => '<svg class="tiles" viewBox="0 0 100 100" aria-hidden="true">'
    + '<rect x="14" y="14" width="72" height="72" fill="#000000"/>'
    + '<rect x="19.5" y="19.5" width="28" height="28" fill="#0026e6"/>'
    + '<rect x="52" y="19.5" width="28" height="28" fill="#ffffff"/>'
    + '<rect x="52" y="52" width="28" height="28" fill="#0026e6"/>'
    + '</svg>',

  // まだ顔を持たない道具。色だけ置く
  plain: () => '<i></i>',
};

export default {
  shell({ page, body, css, js }) {
    const lang = page.lang ?? 'ja';
    return `<!doctype html>
<html lang="${lang}" data-lang="${lang}">
<head>
${head({ page, css })}
${LANG_SCRIPT}
</head>
<body>
${body}
<script src="/assets/clouds.js" defer></script>
<script src="/assets/sky.js" defer></script>
${js ? `<script src="${js}" defer></script>` : ''}
</body>
</html>
`;
  },

  blocks: {
    main:    ({ inner }) => `<main>\n${inner}\n</main>`,

    /* 言葉。**両方を組んでおいて、片方を伏せる**（決めるのは頭の script） */
    ja: ({ inner }) => `<div data-l="ja">\n${inner}\n</div>`,
    en: ({ inner }) => `<div data-l="en">\n${inner}\n</div>`,
    top:     ({ inner }) => `<section class="top">\n${inner}\n</section>`,
    section: ({ attrs, inner }) =>
      `<section${attrs.id ? ` id="${esc(attrs.id)}"` : ''}>\n${inner}\n</section>`,

    /*
      名乗り。**焼いた 1 枚を、そのまま置く。**

      css の letter-spacing は「全部の字のうしろに同じ幅を足す」ことしかできない。
      ロゴは対ごとに詰めるものなので、tools/make-logo.py で測って詰めて、
      図（svg）にしてある。書体が読めなかったときに別の顔で出ることもない。

      色は currentColor なので、置いた所の字の色になる。
    */
    logo() {
      const p = fileURLToPath(new URL('../../assets/sawaya-studio.svg', import.meta.url));
      return `<p class="logo">${fs.readFileSync(p, 'utf8').trim()}</p>`;
    },

    /*
      キャッチコピー。**字詰めは自動でやる。**

      日本語の約物（。、「」（）・）は、四角い枠の中に半分しか墨が無い。
      そのまま並べると、そこだけ穴が空いて見える。
      どこをどれだけ詰めるかは tools/kerning.mjs にある。

      **書くのは字だけでよい。** 行を分けたいところで改行する。
        ::: catch
        ちょっとだけおしゃれに
        ちょっとだけたのしく
        :::

      as= で見出しの段を選べる（既定は h1。頁に見出しが 1 つ要るので）。
      **中で Markdown は効かない。** 1 字ずつ組み直すので、字だけを渡すこと。
    */
    catch: ({ attrs, raw }) => {
      const tag = /^h[1-6]$/.test(attrs.as || '') ? attrs.as : (attrs.as === 'p' ? 'p' : 'h1');
      return `<${tag} class="catch">${kernText(raw)}</${tag}>`;
    },

    /* キャッチの下に置く一行。**同じ字詰めを掛ける** */
    lead: ({ raw }) => `<p class="lead">${kernText(raw)}</p>`,

    mark:    ({ inner }) => `<p class="mark">${unwrapP(inner)}</p>`,
    eyebrow: ({ inner }) => `<p class="eyebrow">${unwrapP(inner)}</p>`,
    note:    ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,
    chips:   ({ inner }) => classifyList(inner, 'chips'),

    /* ============================================================
       棚。**札そのものが、その道具の顔になる。**

       この頁は何かを言葉で説明しないので、
       「どんな道具か」は札の絵が受けもつ。

         [ 名前, 行き先, 顔, 走る場所, ほかの行き先 ]
           顔 … recaday / telop / plain
           ほかの行き先 … [ ["Instagram", "https://…"], … ]（省いてよい）

       **ほかの行き先は、札そのものより上に置く。** 札は「どこを押しても飛ぶ」
       ようにしてあるので、上に出さないと、そこを押しても札のほうへ飛ぶ。

       **顔の中に説明の字を置かないこと。**
       置いた瞬間に、見せる頁ではなくなる。
       ============================================================ */
    shelf({ data = [] }) {
      return `<ul class="shelf">
${data.map(([name, href, face, meta, links]) =>
  `  <li>
    <div class="face face--${esc(face || 'plain')}" aria-hidden="true">${FACE[face] ? FACE[face]() : FACE.plain()}</div>
    <div class="name"><b><a href="${esc(href)}">${bi(name)}</a></b>${meta ? `<span>${bi(meta)}</span>` : ''}</div>${
    Array.isArray(links) && links.length ? `
    <div class="more">${links.map(([label, to]) =>
      `<a href="${esc(to)}"${/^https?:/.test(to) ? ' target="_blank" rel="noopener"' : ''}>${bi(label)}</a>`).join('')}</div>` : ''}
  </li>`).join('\n')}
</ul>`;
    },

    /* 連絡先。中身は JSON で [ ["GitHub", "https://github.com/sawaya-studio"], … ]

       **行き先が住所の形をしていない行は、押せない字として出す。**
       メールは「kento.sawaya at gmail.com」のように崩して書くことがある。
       それを href に入れると、押しても飛べない壊れた link になるうえ、
       崩して書いた意味（拾わせない）も無くなる。だから字としてだけ置く。 */
    links({ data = [] }) {
      const LINKABLE = /^(https?:|mailto:|tel:|\/|#)/;
      return `<ul class="links">
${data.map(([label, href, text]) => {
  const shown = esc(text ?? String(href).replace(/^mailto:/, ''));
  const body = LINKABLE.test(href)
    ? `<a href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${shown}</a>`
    : shown;
  return `  <li><b>${bi(label)}</b><span>${body}</span></li>`;
}).join('\n')}
</ul>`;
    },

    footer: ({ inner }) => `<footer>\n  <div class="footin">\n${inner}\n  </div>\n</footer>`,
  },
};
