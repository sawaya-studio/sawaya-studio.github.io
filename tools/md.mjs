/*
  小さな Markdown。
  ==========================================================================
  この site のためだけのもの。**何でも通る Markdown ではない。**
  外から持ってこないのは、ページの中身が「文章＋この site 独自の部品」で
  できていて、そこの受け渡しを他人の実装に合わせたくないから。

  書けるもの
  --------------------------------------------------------------------------
    # 見出し                     h1〜h6
    ふつうの段落                  p
    - 箇条書き / 1. 番号つき      ul / ol（2 字下げで入れ子）
    > 引用                       blockquote
    ---                          hr
    | 表 | です |                 table（2 行目が |---| なら見出し行）
    ```                          pre > code
    <div>…</div>                 生の HTML はそのまま通す

    **太字** *斜体* `字面` [名前](行き先) ![説明](絵) ~~消し~~

  入れ物と部品
  --------------------------------------------------------------------------
    ::: 名前 属性=値 属性="間の空いた値" .クラス #id
    中身（Markdown のまま書ける）
    :::

  属性の名前に `:ja` / `:en` を付けると、言葉ごとの値になる。

    ::: frame time=07:41 caption:ja="始発、まだ静か" caption:en="First train"
    :::

  「名前」がテーマの部品として登録されていればそれが呼ばれ、
  無ければ `<div class="名前">` になる。入れ子にできる。

  **中身が [ か { で始まっていたら、文章ではなく「値」として読む。**
  部品に並びを渡したいときはこちら（JSON）。

    ::: player
    [
      ["07:12:40", "dawn", "始発、まだ静か", "First train"]
    ]
    :::

    ::: plate
    ::: ja
    # 一日を、時刻ごと残す。
    :::
    ::: en
    # Keep the day, hour by hour.
    :::
    :::

  ja / en は、この site では「片方を伏せる」ための印（data-l）になる。
  **両方を組んでおいて片方を伏せる。** 後から字を差し替える作りだと、
  最初の一瞬だけもう片方が見える。
*/

/* ---------- 属性 ---------- */

/**
 * `scene=dawn time="07:41" .big #top flag` を読む。
 * 値に空白が要るときだけ引用符で囲む。
 */
export function parseAttrs(src) {
  const attrs = {};
  const classes = [];
  // 名前に : を許してある。**言葉ごとの値**（caption:ja / caption:en）のため
  const re = /([.#]?[A-Za-z_][\w:-]*)(?:=("([^"]*)"|'([^']*)'|[^\s]+))?/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[1];
    const val = m[3] ?? m[4] ?? m[2];
    if (key[0] === '.') { classes.push(key.slice(1)); continue; }
    if (key[0] === '#') { attrs.id = key.slice(1); continue; }
    attrs[key] = val === undefined ? true : val;
  }
  if (classes.length) attrs.class = [attrs.class, ...classes].filter(Boolean).join(' ');
  return attrs;
}

/** 属性を HTML に戻す。**値は必ずくくる**（空白や引用符が入っていても壊れないように） */
export function attrsToHtml(attrs, skip = []) {
  return Object.entries(attrs)
    .filter(([k, v]) => v !== false && v != null && !skip.includes(k))
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(String(v))}"`))
    .join('');
}

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 字の中 ---------- */

/**
 * 段落の中。**生の HTML はそのまま通す**（部品を手で書きたいときのため）。
 * だから中身は信用できるものに限る。ここは自分で書く .md しか通らない。
 */
export function inline(s) {
  return s
    // 先に取り分ける：`字面` の中では他の記号を効かせない
    .replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      (_, alt, src, title) => `<img src="${src}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ''}>`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, t, href, title) => {
      // 外に出るリンクだけ、別の窓で開く印を付ける
      const out = /^https?:\/\//.test(href);
      return `<a href="${href}"${title ? ` title="${esc(title)}"` : ''}` +
             `${out ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // 行末の 2 つの空白 → 改行
    .replace(/ {2}$/gm, '<br>');
}

/* ---------- 塊 ---------- */

const CONTAINER = /^:::+\s*(.*)$/;

/**
 * .md を HTML にする。
 *
 * @param {string} src
 * @param {{blocks?: Record<string, (attrs, inner, ctx) => string>, ctx?: any}} opts
 *   blocks … 入れ物の名前ごとの組み立て方（テーマが持つ）
 *   ctx   … blocks へそのまま渡されるもの（頁の front matter など）
 */
export function render(src, opts = {}) {
  const blocks = opts.blocks ?? {};
  const ctx = opts.ctx ?? {};
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  return block(lines, 0, lines.length, blocks, ctx);
}

function block(lines, from, to, blocks, ctx) {
  const out = [];
  let i = from;

  while (i < to) {
    const line = lines[i];

    // 空行
    if (!line.trim()) { i++; continue; }

    // ---- 入れ物 / 部品 ----
    const cm = line.match(CONTAINER);
    if (cm) {
      const head = cm[1].trim();
      if (!head) { i++; continue; }  // 閉じだけが来た（対応が崩れている）ときは読み飛ばす
      const name = head.split(/\s+/)[0];
      const attrs = parseAttrs(head.slice(name.length));
      // 対応する閉じを探す。**同じ名前の入れ子を数えること**
      let depth = 1, j = i + 1;
      while (j < to) {
        const m2 = lines[j].match(CONTAINER);
        if (m2) { if (m2[1].trim()) depth++; else if (--depth === 0) break; }
        j++;
      }
      const end = Math.min(j, to);
      const raw = lines.slice(i + 1, end).join('\n');
      // 中身が [ か { で始まっていれば、**部品へ渡す値**として読む（文章ではない）。
      // ただし {{site.name}} のような差し込みは値ではない
      const looksData = /^\s*[[{]/.test(raw) && !/^\s*\{\{/.test(raw);
      const inner = looksData ? '' : block(lines, i + 1, end, blocks, ctx);
      let data = null;
      if (looksData) {
        try { data = JSON.parse(raw); }
        catch (e) { throw new Error(`::: ${name} の中の値が読めない: ${e.message}\n${raw}`); }
      }
      out.push(blocks[name]
        ? blocks[name]({ attrs, inner, data, raw, ctx })
        : `<div class="${[name, attrs.class].filter(Boolean).join(' ')}"` +
          `${attrsToHtml(attrs, ['class'])}>\n${inner}\n</div>`);
      i = j + 1;
      continue;
    }

    // ---- ``` で囲った字面 ----
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      let j = i + 1;
      while (j < to && !/^```/.test(lines[j])) j++;
      const code = lines.slice(i + 1, j).join('\n');
      out.push(`<pre${lang ? ` class="lang-${lang}"` : ''}><code>${esc(code)}</code></pre>`);
      i = j + 1;
      continue;
    }

    // ---- 書き手あての覚え書き ----
    // `<!-- … -->` は**頁に出さずに捨てる**。生の HTML と同じ扱いにすると、
    // 閉じたあと空行を置き忘れたときに、次の ::: まで丸ごと飲みこんでしまう。
    if (/^<!--/.test(line)) {
      let j = i;
      while (j < to && !/-->/.test(lines[j])) j++;
      i = j + 1;
      continue;
    }

    // ---- 生の HTML ----
    // 行頭が < で始まる塊は、空行まで**そのまま**通す
    if (/^<[a-zA-Z!/]/.test(line)) {
      let j = i;
      while (j < to && lines[j].trim()) j++;
      out.push(lines.slice(i, j).join('\n'));
      i = j;
      continue;
    }

    // ---- 見出し ----
    const hm = line.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      const n = hm[1].length;
      out.push(`<h${n}>${inline(hm[2].trim())}</h${n}>`);
      i++;
      continue;
    }

    // ---- 罫 ----
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    // ---- 表 ----
    if (/^\|/.test(line) && i + 1 < to && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      let j = i + 2;
      while (j < to && /^\|/.test(lines[j])) j++;
      out.push(table(lines.slice(i, j)));
      i = j;
      continue;
    }
    // 見出し行を持たない表（1 列目が見出しになる）
    if (/^\|/.test(line)) {
      let j = i;
      while (j < to && /^\|/.test(lines[j])) j++;
      out.push(table(lines.slice(i, j), false));
      i = j;
      continue;
    }

    // ---- 引用 ----
    if (/^>\s?/.test(line)) {
      let j = i;
      while (j < to && /^>\s?/.test(lines[j])) j++;
      const inner = block(lines.slice(i, j).map((l) => l.replace(/^>\s?/, '')), 0, j - i, blocks, ctx);
      out.push(`<blockquote>\n${inner}\n</blockquote>`);
      i = j;
      continue;
    }

    // ---- 箇条書き ----
    const lm = line.match(/^(\s*)([-*+]|\d+\.)\s+/);
    if (lm) {
      const [html, next] = list(lines, i, to, lm[1].length, blocks, ctx);
      out.push(html);
      i = next;
      continue;
    }

    // ---- 段落 ----
    let j = i;
    while (j < to && lines[j].trim() &&
           !CONTAINER.test(lines[j]) &&
           !/^(#{1,6}\s|```|>|\||<[a-zA-Z!/])/.test(lines[j]) &&
           !/^\s*([-*+]|\d+\.)\s+/.test(lines[j]) &&
           !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[j])) j++;
    if (j === i) j = i + 1;   // 念のため。ここで止まると無限に回る
    out.push(`<p>${inline(lines.slice(i, j).join('\n').trim())}</p>`);
    i = j;
  }

  return out.join('\n');
}

/** 箇条書き。**2 字下げで入れ子**にできる */
function list(lines, from, to, indent, blocks, ctx) {
  const first = lines[from].match(/^(\s*)([-*+]|\d+\.)\s+/);
  const ordered = /\d/.test(first[2]);
  const items = [];
  let i = from;

  while (i < to) {
    const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (!m || m[1].length < indent) break;
    if (m[1].length > indent) break;   // 入れ子は下でまとめて拾う

    // この項目の続き（下げ幅がもっと深い行と、間の空行のあとの続き）
    let j = i + 1;
    while (j < to) {
      const nm = lines[j].match(/^(\s*)([-*+]|\d+\.)\s+/);
      if (nm && nm[1].length <= indent) break;
      if (!lines[j].trim()) {
        // 空行のあとが同じ段の項目なら、そこで切れる
        let k = j + 1;
        while (k < to && !lines[k].trim()) k++;
        const km = k < to ? lines[k].match(/^(\s*)/) : null;
        if (k >= to || (km && km[1].length <= indent)) break;
      } else if (!/^\s/.test(lines[j])) break;
      j++;
    }

    const body = [m[3], ...lines.slice(i + 1, j).map((l) => l.slice(indent + 2))];
    const inner = block(body, 0, body.length, blocks, ctx);
    // 1 段落だけなら <p> を外す。**箇条書きが行間で膨らまないように**
    const one = inner.match(/^<p>([\s\S]*)<\/p>$/);
    items.push(`<li>${one && !one[1].includes('<p>') ? one[1] : `\n${inner}\n`}</li>`);
    i = j;
  }

  const tag = ordered ? 'ol' : 'ul';
  return [`<${tag}>\n${items.join('\n')}\n</${tag}>`, i];
}

function table(rows, hasHead = true) {
  const cells = (l) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const out = ['<table>'];
  if (hasHead) {
    out.push('<thead><tr>' + cells(rows[0]).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead>');
    rows = rows.slice(2);
  }
  out.push('<tbody>');
  for (const r of rows) {
    // 見出し行が無い表は、**1 列目を見出しにする**（README の「| 何 | 説明 |」の形）
    const cs = cells(r);
    out.push('<tr>' + cs.map((c, k) =>
      !hasHead && k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>');
  }
  out.push('</tbody></table>');
  return out.join('\n');
}
