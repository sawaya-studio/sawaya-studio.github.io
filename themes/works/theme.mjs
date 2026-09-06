/*
  Sawaya Studio のテーマ。

  **見た目はまだ決まっていない。**（コンセプトとデザインは別途相談）
  いまは中身を置ける形だけ用意してある。決まったら style.css を差し替える。
*/

import { esc, unwrapP, classifyList, head } from '../_lib.mjs';

/*
  札の顔。**どれも、その道具の中で使っている値をそのまま持ってきている。**
  形は style.css の .face--* 側にある。ここは中身だけ。
*/
const FACE = {
  /*
    7:00 の空と、まんなかに焼き込まれた時刻。それだけで recaday だと分かる。

    **空は本物を敷く。** アプリの SkyBackdrop.tsx を写した /assets/sky.js が、
    closed-test の頁と同じ雲（tools/sky/bake.py が焼いた 1 枚）を引いて描く。
    ここを CSS の縞で真似ていたことがあるが、**縞は雲にならない。**
  */
  recaday: () => '<canvas data-sky data-clouds="/assets/clouds.png"></canvas>' +
                 '<div class="clock">07:41</div>',

  // 方眼紙と、緑の看板と、台本の行。**字は読ませない。行があることだけ分かればよい**
  telop: () => `<div class="brand">テロップスタジオ</div>
    <div class="rows">
      <div class="row"><span class="kind speech">セリフ</span><span class="line mid"></span></div>
      <div class="row"><span class="kind gap">無音</span><span class="line short"></span></div>
      <div class="row"><span class="kind telop">テロップ</span><span class="line mid"></span></div>
    </div>`,

  // まだ顔を持たない道具。色だけ置く
  plain: () => '<i></i>',
};

export default {
  shell({ page, body, css, js }) {
    return `<!doctype html>
<html lang="${page.lang ?? 'ja'}">
<head>
${head({ page, css })}
</head>
<body>
${body}
<script src="/assets/sky.js" defer></script>
${js.trim() ? `<script>\n${js}</script>` : ''}
</body>
</html>
`;
  },

  blocks: {
    main:    ({ inner }) => `<main>\n${inner}\n</main>`,
    top:     ({ inner }) => `<section class="top">\n${inner}\n</section>`,
    section: ({ attrs, inner }) =>
      `<section${attrs.id ? ` id="${esc(attrs.id)}"` : ''}>\n${inner}\n</section>`,

    mark:    ({ inner }) => `<p class="mark">${unwrapP(inner)}</p>`,
    eyebrow: ({ inner }) => `<p class="eyebrow">${unwrapP(inner)}</p>`,
    note:    ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,
    chips:   ({ inner }) => classifyList(inner, 'chips'),

    /* ============================================================
       棚。**札そのものが、その道具の顔になる。**

       この頁は何かを言葉で説明しないので、
       「どんな道具か」は札の絵が受けもつ。

         [ 名前, 行き先, 顔, 走る場所 ]
           顔 … recaday / telop / plain

       **顔の中に説明の字を置かないこと。**
       置いた瞬間に、見せる頁ではなくなる。
       ============================================================ */
    shelf({ data = [] }) {
      return `<ul class="shelf">
${data.map(([name, href, face, meta, tint]) =>
  `  <li>
    <div class="face face--${esc(face || 'plain')}"${tint ? ` style="--tint:${esc(tint)}"` : ''} aria-hidden="true">${FACE[face] ? FACE[face]() : FACE.plain()}</div>
    <div class="name"><b><a href="${esc(href)}">${esc(name)}</a></b>${meta ? `<span>${esc(meta)}</span>` : ''}</div>
  </li>`).join('\n')}
</ul>`;
    },

    /* 連絡先。中身は JSON で [ ["GitHub", "https://github.com/SawayaWorks"], … ] */
    links({ data = [] }) {
      return `<ul class="links">
${data.map(([label, href, text]) =>
  `  <li><b>${esc(label)}</b><span><a href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(text ?? href.replace(/^mailto:/, ''))}</a></span></li>`).join('\n')}
</ul>`;
    },

    footer: ({ inner }) => `<footer>\n  <div class="footin">\n${inner}\n  </div>\n</footer>`,
  },
};
