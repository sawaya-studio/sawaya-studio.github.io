/*
  テーマが共通で使う小道具。
*/

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
${page.description ? `<meta name="description" content="${esc(page.description)}">` : ''}
<meta property="og:title" content="${esc(page.ogTitle ?? page.title ?? '')}">
${page.ogDescription || page.description ? `<meta property="og:description" content="${esc(page.ogDescription ?? page.description)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${img}">\n<meta name="twitter:card" content="${page.twitterCard ?? 'summary_large_image'}">` : ''}
${page.icon ? `<link rel="icon" href="${page.icon}">\n<link rel="apple-touch-icon" href="${page.appleIcon ?? page.icon}">` : ''}
<link rel="canonical" href="${url}">
${extra}
<link rel="stylesheet" href="${css}">`;
}
