/*
  オートモザイクのテーマ。
  ==========================================================================
  **道具の見た目をそのまま持ってくる**（auto-mosaic/mobile/theme/index.ts）。

    白い地・真っ黒な線・**原色の青**（#0026e6）
    **角を丸めない**（D.radius = 0）
    書体は IBM Plex Sans JP（道具が同梱しているものと同じ）

  **角を丸めないのには理由がある。** これはモザイクの道具で、モザイクは
  四角いタイルの集まり。道具の形を、道具が作るものの形にそろえてある。
  1 か所でも丸めると、そこだけ別のアプリの顔になる。

  いまは準備中の一枚だけ。部品の一覧は content/_書き方.md にある。
*/

import { esc, unwrapP, head, social, socialRow, LANG_SCRIPT } from '../_lib.mjs';

/*
  しるし。**道具のアイコンと同じ組み**（mobile/assets/icon-512.png）。
  黒い四角の中に、青・白・黒・青のタイルが 4 つ。

  **図として置く**（絵を貼らない）。どの大きさでも縁がぼけないし、
  この見た目は線がぼけた時点で別物になる。
*/
const MARK = `<svg class="mark" viewBox="0 0 100 100" role="img" aria-label="auto mosaic">
  <rect x="14" y="14" width="72" height="72" fill="currentColor"/>
  <rect x="19.5" y="19.5" width="28" height="28" fill="var(--key)"/>
  <rect x="52"   y="19.5" width="28" height="28" fill="var(--paper)"/>
  <rect x="52"   y="52"   width="28" height="28" fill="var(--key)"/>
</svg>`;

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
${js ? `<script src="${js}" defer></script>` : ''}
</body>
</html>
`;
  },

  blocks: {
    /*
      準備中の一枚。**しるしと、名前と、一言だけ。**
      配れるものがまだ無いので、置くものを増やさない。
      増やすと「もう使えるのか」と思わせてしまう。
    */
    standby: ({ inner }) => `<main class="standby">
  ${MARK}
  <p class="brand">auto mosaic</p>
${socialRow(inner)}
</main>`,

    /* 言葉。**両方を組んでおいて、片方を伏せる**（伏せるのは頭の script が決める） */
    ja: ({ inner }) => `<div data-l="ja">\n${inner}\n</div>`,
    en: ({ inner }) => `<div data-l="en">\n${inner}\n</div>`,

    note: ({ inner }) => `<p class="note">${unwrapP(inner)}</p>`,

    /* 社の口。行き先は site.json の accounts に置く */
    youtube:   (a) => social('youtube', a),
    instagram: (a) => social('instagram', a),
  },
};
