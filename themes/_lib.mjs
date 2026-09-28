/*
  テーマが共通で使う小道具。
*/

// 絵の大きさは file から読む（w= h= の写し間違いを無くすため）。中身は隣の file
export { imageSize } from './_image-size.mjs';

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 言葉ごとの値を組む。
 *
 *   t(attrs, 'caption')
 *     caption="そのまま"                    → そのまま
 *     caption:ja="始発" caption:en="First"  → <span data-l="ja">始発</span><span data-l="en">First</span>
 *
 * **両方を組んでおいて、片方を伏せる。** 読み込んでから字を差し替える作りにすると、
 * 最初の一瞬だけもう片方が見える。
 */
export function t(attrs, key, { tag = 'span', cls = '' } = {}) {
  const plain = attrs[key];
  const langs = Object.keys(attrs)
    .filter((k) => k.startsWith(key + ':'))
    .map((k) => k.slice(key.length + 1));
  if (!langs.length) return plain == null ? '' : esc(plain);
  const c = cls ? ` class="${cls}"` : '';
  return langs.map((l) => `<${tag} data-l="${l}"${c}>${esc(attrs[`${key}:${l}`])}</${tag}>`).join('');
}

/** その部品が言葉ごとの値を持っているか */
export function has(attrs, key) {
  return attrs[key] != null || Object.keys(attrs).some((k) => k.startsWith(key + ':'));
}

/** 段落 1 つだけの中身から `<p>` を外す。**見出しや札に段落を入れないため** */
export function unwrapP(html) {
  const m = html.trim().match(/^<p>([\s\S]*)<\/p>$/);
  return m && !m[1].includes('<p>') ? m[1] : html;
}

/** 中身のいちばん外にある ul / ol に、名前を付ける */
export function classifyList(html, cls) {
  return html.replace(/<(ul|ol)>/, `<$1 class="${cls}">`);
}

/** 部品へ渡した値を、頁の中へ置く（頁が動くときに読む） */
export function dataScript(id, value) {
  // </script> が値の中にあると頁が切れる。**必ず逃がすこと**
  return `<script type="application/json" id="${id}">` +
    JSON.stringify(value).replace(/</g, '\\u003c') + '</script>';
}

/** 共通の <head>。頁ごとに違うのは front matter で渡す。
    site の名前と URL は **site.json の 1 か所**にある（名前が変わってもそこだけ直す）。

    css は `/assets/<テーマ>.css?v=…` の形で渡ってくる。**頁の中に埋めない。**
    ?v= は中身から作った印で、直したときに古いものが residual で残らないようにするためのもの。 */
export function head({ page, css, extra = '' }) {
  const origin = page.site?.origin ?? '';
  const url = origin + page.url;
  const img = page.image ? origin + page.image : '';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title ?? '')}</title>
${page.titleEn ? `<meta name="title-en" content="${esc(page.titleEn)}">` : ''}
${page.description ? `<meta name="description" content="${esc(page.description)}">` : ''}
<meta property="og:title" content="${esc(page.ogTitle ?? page.title ?? '')}">
${page.ogDescription || page.description ? `<meta property="og:description" content="${esc(page.ogDescription ?? page.description)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${img}">` + (page.imageW && page.imageH ? `
<meta property="og:image:width" content="${page.imageW}">
<meta property="og:image:height" content="${page.imageH}">` : '') + (page.imageAlt ? `
<meta property="og:image:alt" content="${esc(page.imageAlt)}">` : '') + `
<meta name="twitter:card" content="${page.twitterCard ?? 'summary_large_image'}">` : ''}
${page.icon ? `<link rel="icon" href="${page.icon}">\n<link rel="apple-touch-icon" href="${page.appleIcon ?? page.icon}">` : ''}
<link rel="canonical" href="${url}">
${extra}
<link rel="stylesheet" href="${css}">`;
}

/*
  社の口（YouTube / Instagram）。
  ==========================================================================
  **行き先は site.json の accounts に置く。** .md には

      ::: youtube
      :::

  と書くだけでよい。どの道具の口を出すかは、頁の theme で決まる。

  **まだ持っていない口は、site.json を空のままにしておく。**
  そうすれば頁に出ない。持ったときに site.json へ 1 行書けば出る。
  .md の側を消して回る必要がない。

  出ないときは、**なぜ出ないかを組み上がった頁に残す**（黙って消えないこと）。
*/
const SOCIAL_LABEL = { youtube: 'YouTube', instagram: 'Instagram' };

export function social(kind, { attrs = {}, ctx = {} }) {
  const url = attrs.href || ctx?.site?.accounts?.[ctx.theme]?.[kind] || '';
  if (!url) return `<!-- ${kind}: site.json の accounts.${ctx.theme ?? '?'} に行き先がありません -->`;
  const label = attrs.label || SOCIAL_LABEL[kind] || kind;
  return `<a class="social social--${kind}" href="${esc(url)}"`
    + ` target="_blank" rel="noopener">${esc(label)}</a>`;
}

/*
  並んだ社の口を、1 本の行にまとめる。
  ::: youtube と ::: instagram は別々の部品なので、そのまま置くと縦に積まれる。
  **2 つ以上あるときは横に並べる。** 縦に積むと、button が 2 つある画面に見えて、
  「準備中の頁」から「何かさせたい頁」に変わってしまう。
*/
export function socialRow(html) {
  const links = String(html).match(/<a class="social[\s\S]*?<\/a>/g);
  if (!links || links.length < 2) return html;
  let first = true;
  return String(html).replace(/<a class="social[\s\S]*?<\/a>/g, () => {
    if (!first) return '';
    first = false;
    return `<div class="socials">${links.join('')}</div>`;
  });
}

/*
  言葉の出し分け。**端末の設定で、自動で切り替える。**
  ==========================================================================
  頁には日本語と英語の**両方を組んでおいて、片方を伏せる。**
  あとから字を差し替える作りにすると、**最初の一瞬だけもう片方が見える。**

  だから、伏せるほうを決めるのは `<head>` の中（頁が組み上がる前）。
  その数行しか要らないので、外の file にはしない。

  切り替えの札は出さない。**端末の言葉の設定に従う。**
  日本語の設定なら日本語、それ以外は英語。
  （closed test の頁だけは、人の手で選べる札を持っている。あちらは
    「日本語の端末で英語の案内を見たい」が実際に起きる頁なので）

  script が動かなかったときは、**頁の lang のまま出る**
  （`<html data-lang>` を先に書いておく）。
*/
export const LANG_SCRIPT = `<script>
(function () {
  var l = (navigator.language || 'en').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en';
  document.documentElement.dataset.lang = l;
  document.documentElement.lang = l;
  // 頁の名前も入れ替える（tab とブックマークに出るもの）
  var m = document.querySelector('meta[name="title-en"]');
  if (l === 'en' && m && m.content) document.title = m.content;
})();
</script>`;

/** 片方を伏せる決まり。**各テーマの style.css の頭に入れる** */
export const LANG_CSS = `/* 言葉の出し分け（themes/_lib.mjs の LANG_SCRIPT が決める） */
:root[data-lang="ja"] [data-l="en"],
:root[data-lang="en"] [data-l="ja"] { display: none !important; }`;

/*
  値の中の言葉。**[ja, en] と書いてあれば、両方を組んで片方を伏せる。**

  棚や連絡先は JSON で渡すので、::: ja / ::: en では包めない。
  かわりに、字のところに 2 つ並べて書けるようにしてある。

      ["recaday", "/recaday/", "recaday", ["Android (iOS 対応予定)", "Android (iOS soon)"]]

  ただの字なら、そのまま出る（両方に同じものが出る）。
*/
export function bi(v) {
  if (Array.isArray(v)) {
    return `<span data-l="ja">${esc(v[0] ?? '')}</span>`
      + `<span data-l="en">${esc(v[1] ?? v[0] ?? '')}</span>`;
  }
  return esc(v ?? '');
}

/*
  ストアの黒い札（App Store など）。
  ==========================================================================
  **札の形は Apple の札をそのまま写す**（黒地・白字・細い灰の縁）。
  見た目は themes/_badges.css にあり、build がどのテーマの css にも足す。
  大きさは --badge で決まる（札の高さはその 3 倍）。

  **札は横に並ぶように作ってある。** Google Play の札が来たら、
  BADGES に 1 つ足せば、同じ高さで隣に並ぶ。

      badges([["app-store", "https://apps.apple.com/app/id…"]])
      badges([["app-store", ["https://apps.apple.com/jp/app/…", "https://apps.apple.com/app/…"]]])
*/
const BADGES = {
  'app-store': {
    logo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`,
    ja: '<b>App Store</b><small>からダウンロード</small>',
    en: '<small>Download on the</small><b>App Store</b>',
  },
};

export function badges(list = []) {
  /* 行き先は、ただの URL か、[日本語のとき, 英語のとき] の 2 つ。
     **札は言葉ごとに 1 枚ずつ組み、片方を伏せる**（字も行き先も言葉で変わるので） */
  const items = list.filter(([kind]) => BADGES[kind]).flatMap(([kind, href]) => {
    const b = BADGES[kind];
    const [ja, en] = Array.isArray(href) ? [href[0], href[1] ?? href[0]] : [href, href];
    return [['ja', ja], ['en', en]].map(([l, to]) =>
      `<a class="badge badge--${kind}" data-l="${l}" href="${esc(to)}" target="_blank" rel="noopener">`
      + `${b.logo}<span>${b[l]}</span></a>`);
  });
  return items.length ? `<div class="badges">${items.join('')}</div>` : '';
}
