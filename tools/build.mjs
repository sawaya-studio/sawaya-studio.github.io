/*
  .md から頁を作る。
  ==========================================================================
      node tools/build.mjs          全部作り直す
      node tools/build.mjs --watch  .md / テーマを直したら作り直す

  content/ の下の .md が、そのままの並びで site の頁になる。

      content/index.md               →  /index.html
      content/recaday/index.md       →  /recaday/index.html
      content/telop-studio/index.md  →  /telop-studio/index.html

  頁の頭に front matter を置いて、どのテーマで組むかを書く。

      ---
      theme: recaday
      title: recaday — 時刻が焼き込まれた vlog
      description: …
      ---

  テーマは themes/<名前>/ にある。
      style.css   その頁の見た目（**丸ごと頁に埋める。**別ファイルにしない）
      page.js     その頁を動かすもの（同上）
      theme.mjs   頁の外枠と、::: で呼べる部品

  **css も js も、頁の中に埋めてしまう。** 頁は数枚しかなく、どれも 1 回読んで
  終わりなので、別ファイルにして往復を増やすより速い。共有するのは
  重いもの（空・雲・書体・絵）だけで、それは /assets/ に置いてある。

  作らないもの
  --------------------------------------------------------------------------
  recaday/closed-test/ は**手で作った頁のまま**。ここでは触らない。
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from './md.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const THEMES = path.join(ROOT, 'themes');

/* ---------- front matter ---------- */

/**
 * 頁の頭の `---` から `---` まで。**小さな YAML しか読まない。**
 *   key: 値
 *   key: [a, b, c]
 *   key: >          … 次の行から、下げてあるあいだ（長い文）
 * 入れ子は要らないので持たない。
 */
function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return [{}, src];
  const meta = {};
  const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val === '>' || val === '|') {
      const buf = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) buf.push(lines[++i].trim());
      val = buf.join(val === '>' ? ' ' : '\n');
    } else if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
    }
    meta[key] = val;
  }
  return [meta, src.slice(m[0].length)];
}

/* ---------- 走らせる ---------- */

const themeCache = new Map();
async function loadTheme(name) {
  const dir = path.join(THEMES, name);
  if (!fs.existsSync(dir)) throw new Error(`テーマ "${name}" が themes/ に無い`);
  // --watch で読み直せるように、毎回ちがう名前で読む
  const mod = await import(pathToFileURL(path.join(dir, 'theme.mjs')).href + '?t=' + Date.now());
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '');
  return { ...mod.default, css: read('style.css'), js: read('page.js'), name };
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md') && !e.name.startsWith('_')) out.push(p);
  }
  return out;
}

async function buildOne(file) {
  const src = fs.readFileSync(file, 'utf8');
  const [meta, body] = frontMatter(src);
  if (meta.draft) return null;

  const rel = path.relative(CONTENT, file).replace(/\\/g, '/');
  // index.md はその場所に、ほかは <名前>/index.html にして URL を短くする
  const outRel = rel === 'index.md'
    ? 'index.html'
    : rel.endsWith('/index.md')
      ? rel.replace(/index\.md$/, 'index.html')
      : rel.replace(/\.md$/, '/index.html');
  const url = '/' + outRel.replace(/index\.html$/, '');

  const theme = await loadTheme(meta.theme || 'works');
  // site の名前と URL は **site.json の 1 か所**にある。頁からは page.site で引く
  const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));
  const page = { ...meta, url, rel, outRel, site };
  const html = render(body, { blocks: theme.blocks ?? {}, ctx: page });
  let out = theme.shell({ page, body: html, css: theme.css, js: theme.js })
    // {{site.name}} / {{site.origin}} は、どこに書いても site.json の値になる。
    // **名前を変えるときに直すのは site.json だけ**にしておく
    .replace(/\{\{site\.(\w+)\}\}/g, (m, k) => (site[k] != null ? String(site[k]) : m));

  /*
    根から書いた道（/assets/… ）を、その頁からの道に直す。

    **頁をそのまま開いても出るようにするため。** 根から書いたままだと、
    file:// で開いたときにドライブの根を見にいって、空も書体も絵も出ない。
    書くときは根から（どの頁でも同じ字面で済む）、出すときは相対にする。

    site の外を指すもの（https://… ）と、canonical / og:url はここを通らない。
  */
  const depth = outRel.split('/').length - 1;
  const base = depth ? '../'.repeat(depth) : './';
  out = out
    .replace(/(\s(?:src|href|data-clouds)=")\/(?!\/)/g, `$1${base}`)
    .replace(/(url\(")\/(?!\/)/g, `$1${base}`);

  const dest = path.join(ROOT, outRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return { outRel, bytes: Buffer.byteLength(out) };
}

async function buildAll() {
  const files = walk(CONTENT);
  const made = [];
  for (const f of files) {
    try {
      const r = await buildOne(f);
      if (r) made.push(r);
    } catch (e) {
      console.error(`× ${path.relative(ROOT, f)}\n  ${e.message}`);
      process.exitCode = 1;
    }
  }
  for (const r of made) {
    console.log(`  ${r.outRel.padEnd(34)} ${(r.bytes / 1024).toFixed(1)} KB`);
  }
  console.log(`${made.length} 枚`);
  checkFonts();
  return made;
}

/*
  絞った書体に、足りない字が無いか見る。
  ==========================================================================
  見出しの書体は「その頁に出てくる字だけ」に絞って置いてある（tools/subset-fonts.mjs）。
  **見出しに新しい字を足すと、そこだけ別の書体で出る。**
  黙って起こると気づけないので、作り直すたびにここで数える。
*/
const FONT_CHECKS = [
  { page: 'telop-studio/index.html', chars: 'assets/fonts/RocknRollOne-Regular.chars.txt', font: 'RocknRoll One' },
];

function checkFonts() {
  for (const c of FONT_CHECKS) {
    const page = path.join(ROOT, c.page);
    const list = path.join(ROOT, c.chars);
    if (!fs.existsSync(page) || !fs.existsSync(list)) continue;
    const have = new Set(fs.readFileSync(list, 'utf8'));
    const html = fs.readFileSync(page, 'utf8')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;|&#\d+;/gi, ' ');
    const missing = new Set();
    for (const ch of html) if (!/\s/.test(ch) && !have.has(ch)) missing.add(ch);
    if (missing.size) {
      console.log(`\n! ${c.font} に無い字が ${missing.size} 個あります: ${[...missing].join('')}`);
      console.log('  そこだけ別の書体で出ます。絞り直してください:');
      console.log('    node tools/subset-fonts.mjs');
    }
  }
}

await buildAll();

if (process.argv.includes('--watch')) {
  console.log('見ています（content/ と themes/）。止めるのは Ctrl+C');
  let timer = null;
  const bump = () => {
    clearTimeout(timer);
    // 保存が 2 回起こることがあるので、少しためてから 1 回だけ作り直す
    timer = setTimeout(() => { console.log('---'); buildAll(); }, 120);
  };
  for (const d of [CONTENT, THEMES]) fs.watch(d, { recursive: true }, bump);
}
