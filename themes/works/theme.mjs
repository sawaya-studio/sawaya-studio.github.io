/*
  Sawaya Studio のテーマ。

  **見た目はまだ決まっていない。**（コンセプトとデザインは別途相談）
  いまは中身を置ける形だけ用意してある。決まったら style.css を差し替える。
*/

import { esc, unwrapP, classifyList, head } from '../_lib.mjs';

export default {
  shell({ page, body, css, js }) {
    return `<!doctype html>
<html lang="${page.lang ?? 'ja'}">
<head>
${head({ page, css })}
</head>
<body>
${body}
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

    /* 作った道具の一覧。中身は JSON で
       [ ["recaday", "/recaday/", "時刻が焼き込まれた vlog", "iOS / Android", "#F2D357"], … ]
         名前 / 行き先 / 一行の説明 / 走る場所 / その道具の色 */
    works({ data = [] }) {
      return `<ul class="works">
${data.map(([name, href, desc, meta, tint]) =>
  `  <li class="work"${tint ? ` style="--tint:${esc(tint)}"` : ''}>
    <h3><a href="${esc(href)}">${esc(name)}</a></h3>
    <p>${esc(desc)}</p>
    ${meta ? `<div class="meta">${esc(meta)}</div>` : ''}
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
