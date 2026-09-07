/*
  テロップスタジオのテーマ。
  ==========================================================================
  **「昭和レトロポップ見本帳」の組みで作る。**
  （2026-08-26 のアーティファクト。この道具のロゴを決めるための下調べ）

  見た目は style.css。ここにあるのは
    shell   … 頁の外枠（上下の流れる帯を含む）
    blocks  … .md の ::: から呼べる部品

  **道具の画面は持ちこまない。** ここは道具の顔を見せる頁で、
  使い方を説明する頁ではない。行や札やボタンを並べると、
  頁が小さな取扱説明になってしまう。

  部品の一覧は content/_書き方.md にある。
*/

import { esc, unwrapP, classifyList, head, social, socialRow } from '../_lib.mjs';
// 属性に書いた **太字** や [名前](行き先) も効かせる（本文と同じ書き方でよいように）
import { inline } from '../../tools/md.mjs';

/** 流れる帯。**同じ字を 2 回続けること。** 半分だけ動かして繰り返すので、
    1 回ぶんだと途中で切れて隙間が出る */
function ticker(text) {
  const one = String(text).trim();
  if (!one) return '';
  const twice = esc(one + ' ・ ') .repeat(2);
  return `<div class="ticker" aria-hidden="true"><span>${twice}${twice}</span></div>`;
}

export default {
  shell({ page, body, css, js }) {
    return `<!doctype html>
<html lang="${page.lang ?? 'ja'}">
<head>
${head({ page, css })}
</head>
<body>
${ticker(page.tickerTop ?? '')}
${body}
${ticker(page.tickerBottom ?? page.tickerTop ?? '')}
${js ? `<script src="${js}" defer></script>` : ''}
</body>
</html>
`;
  },

  blocks: {
    /* ---------- 骨格 ---------- */
    main: ({ inner }) => `<div class="wrap">\n${inner}\n</div>`,

    /* 上の帯（頁の名札）。**シールのように貼りつく** */
    topbar({ attrs }) {
      return `<div class="topbar">
  <span class="brand brand--sm">${esc(attrs.brand || 'テロップスタジオ')}</span>
  ${attrs.lead ? `<span class="quiet">${esc(attrs.lead)}</span>` : ''}
  <span class="grow"></span>
  ${attrs.pill ? `<span class="pill">${esc(attrs.pill)}</span>` : ''}
</div>`;
    },

    /*
      準備中の頁。**画面いっぱいに、看板と一言だけ。**
      配れるものがまだ無いので、置くものを増やさない。
      増やすと「もう使えるのか」と思わせてしまう。
    */
    standby: ({ inner }) => `<div class="standby">
${socialRow(inner)}
</div>`,

    /* 社の口。行き先は site.json の accounts に置く（content/_書き方.md 参照） */
    youtube:   (a) => social('youtube', a),
    instagram: (a) => social('instagram', a),


    /* 表紙。中に ::: eyebrow / # 見出し / ::: lede を置く */
    cover: ({ inner }) => `<header>\n${inner}\n</header>`,

    /* 章。**丸番号を付ける。** n を省くと、ただの節になる
       ::: chapter n=1 title="何でできているか" */
    chapter({ attrs, inner }) {
      const t = attrs.title ? `<h2>${attrs.n ? `<span class="num">${esc(attrs.n)}</span>` : ''}${esc(attrs.title)}</h2>` : '';
      return `<section${attrs.id ? ` id="${esc(attrs.id)}"` : ''}>\n${t}\n${inner}\n</section>`;
    },

    /* ---------- 字 ---------- */
    eyebrow: ({ inner }) => `<p><span class="eyebrow">${unwrapP(inner)}</span></p>`,
    lede:    ({ inner }) => `<p class="lede">${unwrapP(inner)}</p>`,
    note:    ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,
    label:   ({ inner }) => `<p class="label">${unwrapP(inner)}</p>`,
    cap:     ({ inner }) => `<p class="cap">${unwrapP(inner)}</p>`,

    /* ---------- 紙 ---------- */
    grid: ({ attrs, inner }) =>
      `<div class="grid g${esc(attrs.cols || 2)}">\n${inner}\n</div>`,
    card: ({ inner }) => `<div class="card">\n${inner}\n</div>`,

    /* 札の並び。中身は JSON で
       [ ["端末の中だけ", "ok"], ["まだ配っていません", "hm"], ["アカウント不要"] ]
       ok = 緑（できること） / hm = からし色（ただし書き） / 省略 = 地の色 */
    tags({ data = [] }) {
      return `<ul class="tags">
${data.map(([text, kind]) =>
  `  <li><span class="tag${kind ? ' ' + esc(kind) : ''}">${esc(text)}</span></li>`).join('\n')}
</ul>`;
    },

    /* 見せ台。中身を大きく置いて、下に「なぜ」を書く。
       ::: showcase why="**A・いまの延長**<br>…" */
    showcase({ attrs, inner }) {
      return `<div class="showcase">
  <div class="stage">
${inner}
  </div>
  ${attrs.why ? `<p class="why">${inline(attrs.why)}</p>` : ''}
</div>`;
    },

    /* 看板そのもの。大きく置きたいときに */
    brand({ attrs }) {
      const name = esc(attrs.name || 'テロップスタジオ');
      const en = attrs.en ? `\n    <span class="en">${esc(attrs.en)}</span>` : '';
      return `<span class="brand brand--${esc(attrs.size || 'lg')}">${name}</span>${en}`;
    },

    /* ---------- 押す口 ---------- */
    cta: ({ inner }) => `<div class="cta">\n${inner}\n</div>`,
    btn({ attrs, inner }) {
      const cls = ['btn', attrs.ghost ? 'ghost' : '', attrs.class].filter(Boolean).join(' ');
      const out = /^https?:/.test(attrs.href || '');
      return `<a class="${cls}" href="${esc(attrs.href || '#')}"${out ? ' target="_blank" rel="noopener"' : ''}>${unwrapP(inner)}</a>`;
    },

    /* 表。**狭い画面で横に巻けるようにする**（頁ごと横に伸びないように） */
    spec: ({ inner }) =>
      `<div class="scroller">\n${inner.replace('<table>', '<table class="tbl">')}\n</div>`,

    /* これから。now= が「いまここ」（1 から数える）
       [ ["Android 版", "ここに説明。"], … ] */
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

    /* しめ。**緑の箱に白い字。** 見本帳の最後と同じ */
    close: ({ attrs, inner }) =>
      `<div class="close">\n${attrs.title ? `<h2><span class="num">→</span>${esc(attrs.title)}</h2>\n` : ''}${inner}\n</div>`,

    footer: ({ inner }) => `<footer>\n  <div class="footin">\n${inner}\n  </div>\n</footer>`,
  },
};
