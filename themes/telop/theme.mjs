/*
  テロップスタジオのテーマ。
  ==========================================================================
  道具そのもの（plot-studio の ui/public/index.html）から、
  **色も寸法も作法もそのまま引いている。**

    ・地は方眼紙。画像は持たない、1px の線を敷き詰めるだけ
    ・**緑は押せるものだけ。** 飾りに緑を使うと、押せる色が意味を失う
    ・**オレンジは押せないものだけ。** 飾り・数字・見出しの影
    ・**押せるものは黒で囲う。** 原色どうしのあいだに黒を1本
    ・**影はぼかさない。** ずらした面を1枚置くだけ

  道具の側を直したら、style.css も合わせること。値は
  ui/public/index.html ／ mobile/theme/index.ts ／ tools/gen-icons.mjs と
  **同じ4か所め**にあたる。
*/

import { esc, unwrapP, classifyList, dataScript, head } from '../_lib.mjs';

export default {
  shell({ page, body, css, js }) {
    return `<!doctype html>
<html lang="${page.lang ?? 'ja'}">
<head>
${head({ page, css })}
</head>
<body>
${body}
<script>
${js}</script>
</body>
</html>
`;
  },

  blocks: {
    /* 上の帯。ロゴは緑の箱に白い字、オレンジの硬い影、黒の縁 */
    topbar({ attrs }) {
      return `<header>
  <span class="brand">${esc(attrs.brand || 'テロップスタジオ')}</span>
  ${attrs.lead ? `<span class="quiet">${esc(attrs.lead)}</span>` : ''}
  <span class="grow"></span>
  ${attrs.pill ? `<span class="pill">${esc(attrs.pill)}</span>` : ''}
</header>`;
    },

    /* 骨格 */
    main:    ({ inner }) => `<main>\n${inner}\n</main>`,
    section: ({ attrs, inner }) =>
      `<section${attrs.id ? ` id="${esc(attrs.id)}"` : ''}${attrs.class ? ` class="${esc(attrs.class)}"` : ''}>\n${inner}\n</section>`,
    hero:    ({ attrs, inner }) => `<section class="hero"${attrs.id ? ` id="${esc(attrs.id)}"` : ''}>\n${inner}\n</section>`,

    /* 見出しの上の小さな行。菱形は道具の .chead::before と同じ */
    eyebrow: ({ inner }) => `<p class="eyebrow">${unwrapP(inner)}</p>`,
    lead:    ({ inner }) => `<p class="lead">${unwrapP(inner)}</p>`,
    note:    ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,

    /* 札の並び。**オレンジ＝押せない** */
    chips: ({ inner }) => classifyList(inner, 'chips'),

    /* 押す口。**緑＝押せる。黒で囲って、ぼかさない影を敷く** */
    cta: ({ inner }) => `<div class="cta">\n${inner}\n</div>`,
    btn({ attrs, inner }) {
      const cls = ['btn', attrs.ghost ? 'ghost' : '', attrs.class].filter(Boolean).join(' ');
      const out = /^https?:/.test(attrs.href || '');
      return `<a class="${cls}" href="${esc(attrs.href || '#')}"${out ? ' target="_blank" rel="noopener"' : ''}>${unwrapP(inner)}</a>`;
    },

    /* 紙のカード */
    cols: ({ inner }) => `<div class="cols">\n${inner}\n</div>`,
    card: ({ inner }) => `<div class="card">\n${inner}\n</div>`,

    /* 表。**中の Markdown の表に名前を付けて、横に巻けるようにする**
       （狭い画面で頁ごと横に伸びないように） */
    spec: ({ inner }) =>
      `<div class="scroller">\n${inner.replace('<table>', '<table class="tbl">')}\n</div>`,

    /* ============================================================
       さわれる画面。**説明を読ませるより、押させたほうが速い。**
       行の一覧も右の画面も、道具の側と同じ組み・同じ色で作ってある。

       中身は JSON。
       [
         {"kind":"speech","at":"0:00.4","who":0,"text":"えー、今日はですね","cut":true},
         {"kind":"gap","at":"0:02.1","len":1.9},
         {"kind":"telop","at":"0:11.0","text":"ここは、しゃべってない所"},
         {"kind":"se","at":"0:12.4","file":"ぽん.wav"}
       ]
       ============================================================ */
    editor({ attrs, data = [] }) {
      // speakers="わたし:#2fa45f, ゲスト:#f2913c"
      const speakers = String(attrs.speakers || 'わたし:#2fa45f, ゲスト:#f2913c')
        .split(',').map((s) => {
          const i = s.lastIndexOf(':');
          return { name: s.slice(0, i).trim(), color: s.slice(i + 1).trim() };
        });
      return `<div class="demo">
  <div class="rows" id="rows"></div>
  <div class="side">
    <div class="screen">
      <div class="chead">${esc(attrs.title || '画面')} <span class="quiet" id="stamp"></span></div>
      <div id="stage">
        <div class="scene"></div>
        <span class="hand">${esc(attrs.hand || 'つまんで動かせます')}</span>
        <div id="tl" class="sel" tabindex="0" role="button"
             aria-label="テロップ。つまんで動かせます"></div>
      </div>
      <div class="posgrid" id="posgrid" role="group" aria-label="テロップを置く場所"></div>
    </div>
    ${attrs.note ? `<p class="note" style="margin-top:10px">${esc(attrs.note)}</p>` : ''}
  </div>
</div>
${dataScript('editor-rows', { rows: data, speakers, pos: Number(attrs.pos ?? 7) })}`;
    },

    /* これから。now= で「いまここ」を指す（1 から数える）
       [ ["Android 版", "いま作っているところ。"], … ] */
    road({ attrs, data = [] }) {
      const now = Number(attrs.now ?? 0);
      return `<ol class="road">
${data.map(([title, body], i) =>
  `  <li${i + 1 === now ? ' class="now"' : ''}>
    <span class="n">${i + 1}</span>
    <span><b>${esc(title)}</b><span>${esc(body)}</span></span>
  </li>`).join('\n')}
</ol>`;
    },

    footer: ({ inner }) => `<footer>\n  <div class="footin">\n${inner}\n  </div>\n</footer>`,
  },
};
