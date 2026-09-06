/*
  recaday のテーマ。
  ==========================================================================
  closed-test の頁と同じ組み。**色はアプリの src/theme.ts と src/lib/skyTable.ts から。**
  うしろは WebGL の空（/assets/sky.js）で、7:00 の朝に止めてある。

  見た目は style.css、動くところは page.js。ここにあるのは
    shell   … 頁の外枠
    blocks  … .md の ::: から呼べる部品

  部品の一覧は content/_書き方.md にある。
*/

import { t, has, esc, unwrapP, classifyList, dataScript, head } from '../_lib.mjs';

/* 焼き込みの枠。**比率はアプリと同じ**（src/theme.ts の clockStyle / CLOCK_FONTS）。
   ここでは書体の名前だけを扱う。実際の数値は style.css の .burn[data-font] に置いてある */
const FONTS = ['bold', 'thin', 'retro', 'digital', 'serif', 'round'];
const FONT_LABEL = {
  bold: 'JetBrains Mono', thin: 'IBM Plex Mono', retro: 'Space Mono',
  digital: 'Share Tech Mono', serif: 'Cutive Mono', round: 'M PLUS 1p',
};
const FILTERS = ['none', 'skin', 'vivid', 'bright', 'sepia', 'mono', 'bold', 'binary'];
const FILTER_LABEL = {
  none:  ['なし', 'None'],   skin:   ['肌', 'Skin'],       vivid: ['鮮やか', 'Vivid'],
  bright:['明るく', 'Bright'], sepia: ['セピア', 'Sepia'],  mono:  ['白黒', 'Mono'],
  bold:  ['2色', 'Duotone'],  binary:['2値', 'Binary'],
};

/** 焼き込みの中身（時刻とキャプション） */
function burn(attrs, { caption = '' } = {}) {
  const font = attrs.font || 'bold';
  return `<div class="burn" data-font="${esc(font)}">
  <div class="clock">${esc(attrs.time || '07:41')}</div>${caption ? `\n  ${caption}` : ''}
</div>`;
}

function captionHtml(attrs) {
  if (!has(attrs, 'caption')) return '';
  return t(attrs, 'caption', { tag: 'div', cls: 'caption' }) ||
    `<div class="caption">${esc(attrs.caption)}</div>`;
}

export default {
  /* ---------- 頁の外枠 ---------- */
  shell({ page, body, css, js }) {
    return `<!doctype html>
<html lang="${page.lang ?? 'ja'}">
<head>
${head({ page, css })}

<script>
/*
  どちらの言葉で出すかを、**組み上がる前に**決める。
  あとから差し替える作りだと、最初の一瞬だけもう片方が見える。
  貯め場が使えない環境（私用の窓など）でも落ちないように、触るのは try の中。
*/
(function () {
  var saved = null;
  try { saved = localStorage.getItem('recaday-lang'); } catch (e) { /* 貯め場が無いだけ */ }
  var lang = saved || ((navigator.language || 'en').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en');
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
})();
</script>
</head>
<body>

<div class="lang" role="group" aria-label="Language">
  <button type="button" data-set="ja">日本語</button>
  <button type="button" data-set="en">English</button>
</div>

<canvas id="sky" data-clouds="/assets/clouds.png" aria-hidden="true"></canvas>

<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <defs>
    <!-- 2色: 明るさだけ残して、暗部→中間→明部に 3 色を置く（src/filters.ts の bold と同じ考え方） -->
    <filter id="duotone-bold" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0.05 1.00 0.92"/>
        <feFuncG type="table" tableValues="0.15 0.42 1.00"/>
        <feFuncB type="table" tableValues="0.00 0.00 0.28"/>
      </feComponentTransfer>
    </filter>
    <!-- 2値: しきい値 0.46 のあたりで白と黒に分ける -->
    <filter id="binary" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0 0 0 0 0.06 0.94 1 1 1 1 1"/>
        <feFuncG type="table" tableValues="0 0 0 0 0.06 0.94 1 1 1 1 1"/>
        <feFuncB type="table" tableValues="0 0 0 0 0.06 0.94 1 1 1 1 1"/>
      </feComponentTransfer>
    </filter>
  </defs>
</svg>

<main>
${body}
</main>

<script src="/assets/sky.js" defer></script>

<script>
${js}</script>

</body>
</html>
`;
  },

  /* ---------- ::: で呼べる部品 ---------- */
  blocks: {
    /* 名前だけで 1 画面。ワードマークは焼いた 1 枚をそのまま置く。
       **CSS で組み直さないこと**（字間も 2 段の重心も、あちらで測って詰めてある） */
    hero({ attrs }) {
      return `<section class="hero">
  <img class="lockup" src="/assets/recaday-lockup.png" width="1658" height="536" alt="recaday — record a day">
  <a class="more" href="${esc(attrs.href || '#read')}">
    ${t(attrs, 'label') || '<span data-l="ja">どんなアプリか</span><span data-l="en">What it is</span>'}
    <span aria-hidden="true">↓</span>
  </a>
</section>`;
    },

    /* 読むところの入れ物。ガラスの板はこの中に並べる */
    body({ attrs, inner }) {
      return `<div class="body" id="${esc(attrs.id || 'read')}">\n${inner}\n</div>`;
    },

    /* ガラスの板。塗りは薄く、縁は強く */
    plate({ attrs, inner }) {
      const cls = ['plate', attrs.class].filter(Boolean).join(' ');
      return `<section class="${cls}">\n${inner}\n</section>`;
    },

    /* 言葉。**両方を組んでおいて、片方を伏せる** */
    ja: ({ inner }) => `<div data-l="ja">\n${inner}\n</div>`,
    en: ({ inner }) => `<div data-l="en">\n${inner}\n</div>`,

    /* 小見出し */
    eyebrow: ({ inner }) => `<p class="eyebrow">${unwrapP(inner)}</p>`,
    note:    ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,

    /* 印つきの箇条書き / 札の並び。**中の - をそのまま使う** */
    tick:  ({ inner }) => classifyList(inner, 'tick'),
    chips: ({ inner }) => classifyList(inner, 'chips'),

    /* 2 列 */
    cols: ({ inner }) => `<div class="cols">\n${inner}\n</div>`,

    /* 焼き込みの枠 1 枚。
       ::: frame scene=dawn font=bold time=07:41 filter=skin caption:ja=… caption:en=… */
    frame({ attrs }) {
      const scene = attrs.scene || 'dawn';
      const filter = attrs.filter || 'skin';
      return `<div class="frame"${attrs.id ? ` id="${esc(attrs.id)}"` : ''}>
  <div class="scene scene--${esc(scene)} filter-${esc(filter)}"${attrs.sceneId ? ` id="${esc(attrs.sceneId)}"` : ''}></div>
  ${burn(attrs, { caption: captionHtml(attrs) })}
</div>`;
    },

    /* カメラ画面の見立て（縦） */
    phone({ attrs }) {
      const chip = (side, key) => has(attrs, key)
        ? `\n  <span class="phone-chip phone-chip--${side}">${t(attrs, key)}</span>` : '';
      return `<div class="phone">
  <div class="scene scene--${esc(attrs.scene || 'park')} filter-${esc(attrs.filter || 'skin')}"></div>
  <div class="guide"></div>
  ${burn(attrs)}${chip('l', 'left')}${chip('r', 'right')}
  <div class="shutter"><i></i></div>
</div>`;
    },

    /* 焼き込みの見本を流す。中身は JSON で
       [ ["07:12:40", "dawn", "始発、まだ静か", "First train"], … ] */
    player({ data = [] }) {
      const clips = data.map(([time, scene, ja, en]) => {
        const [h, m, s] = String(time).split(':').map(Number);
        return { start: h * 3600 + m * 60 + (s || 0), scene, ja, en: en ?? ja };
      });
      const segs = clips.map(() => '<div class="seg" style="flex:1"><span></span></div>').join('');
      return `<div class="frame" id="demo-frame">
  <div class="scene scene--${esc(clips[0]?.scene ?? 'dawn')} filter-skin" id="demo-scene"></div>
  <div class="burn" data-font="bold" id="demo-burn">
    <div class="clock" id="demo-clock">--:--</div>
    <div class="caption" id="demo-caption"></div>
  </div>
</div>
<div class="player">
  <button class="play" id="demo-play" type="button" aria-label="Play">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" id="demo-icon-path"/></svg>
  </button>
  <div class="track" aria-hidden="true">${segs}</div>
  <span class="stamp" id="demo-stamp">--:--</span>
</div>
${dataScript('demo-clips', clips)}`;
    },

    /* 時刻の書体を選ぶ口。**枠ごと差し替わる** */
    fonts({ attrs }) {
      const list = attrs.only ? String(attrs.only).split(',') : FONTS;
      return `<div class="picker" role="group" aria-label="Clock typeface">
${list.map((f, i) => `  <button class="pick pick--font" data-font="${f}" aria-pressed="${i === 0}" type="button">${FONT_LABEL[f] ?? f}</button>`).join('\n')}
</div>`;
    },

    /* フィルターを選ぶ口 */
    filters({ attrs }) {
      const on = attrs.on || 'skin';
      const list = attrs.only ? String(attrs.only).split(',') : FILTERS;
      return `<div class="picker" role="group" aria-label="Filter">
${list.map((f) => {
  const [ja, en] = FILTER_LABEL[f] ?? [f, f];
  return `  <button class="pick pick--filter" data-filter="${f}" aria-pressed="${f === on}" type="button"><span data-l="ja">${ja}</span><span data-l="en">${en}</span></button>`;
}).join('\n')}
</div>`;
    },

    /* 書き出しの図。中身は JSON で
       [ ["07:12", "始発、まだ静か", "First train"], … ] と、最後に結果の一行 */
    joiner({ data = [], attrs }) {
      const clips = data.map(([time, ja, en]) =>
        `  <div class="clip"><b>${esc(time)}</b>` +
        `<span data-l="ja">${esc(ja)}</span><span data-l="en">${esc(en ?? ja)}</span></div>`).join('\n');
      return `<div class="joiner">
${clips}
  <div class="arrow" aria-hidden="true">↓</div>
  ${t(attrs, 'result', { tag: 'div', cls: 'result' }) || `<div class="result">${esc(attrs.result ?? '')}</div>`}
</div>`;
    },

    /* 押す口 */
    act({ attrs, inner }) {
      return `<a class="act" href="${esc(attrs.href || '#')}"${/^https?:/.test(attrs.href || '') ? ' target="_blank" rel="noopener"' : ''}>${unwrapP(inner)}</a>`;
    },

    /* しめ */
    closing: ({ inner }) => `<section class="plate closing">\n${inner}\n</section>`,

    /* 下の帯 */
    footer: ({ inner }) => `<footer>\n${inner}\n</footer>`,
  },
};
