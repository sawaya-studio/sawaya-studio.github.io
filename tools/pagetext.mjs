/*
  頁から「その書体で出る字」を拾う。
  ==========================================================================
  **絞るときと、足りているか数えるときで、同じ拾い方をすること。**
  ここが 2 か所にあると、いつかずれて「絞ったのに足りない」が黙って起こる。

  だから tools/subset-fonts.mjs（絞る）と tools/build.mjs（数える）は、
  どちらもこの 1 本を使う。
*/

/** 目に見える字だけ（style と script と注記の中は数えない） */
export function visibleText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
}

/**
 * その書体で出る字を数える。
 *
 * @param {string} html   出来上がった頁
 * @param {{classes?: string[], withJson?: boolean}} how
 *   classes  … その class の中だけを見る（本文には使わない書体のため）
 *   withJson … 頁に置いた値も見る（::: player のキャプションなど、
 *              あとで JS が字として出すもの。visibleText では拾えない）
 */
export function charsOf(html, how = {}) {
  let text = how.classes
    ? how.classes.flatMap((c) => [...html.matchAll(
        new RegExp(`<[^>]*class="[^"]*\\b${c}\\b[^"]*"[^>]*>([^<]*)<`, 'g'))]
        .map((m) => m[1])).join(' ')
    : visibleText(html);

  if (how.withJson) {
    for (const m of html.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
      text += ' ' + m[1].replace(/\\u003c/g, '<');
    }
  }

  const out = new Set();
  for (const ch of text) if (!/\s/.test(ch)) out.add(ch);
  return out;
}
