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
      style.css   その頁の見た目
      page.js     その頁を動かすもの
      theme.mjs   頁の外枠と、::: で呼べる部品

  style.css と page.js は、**テーマごとに 1 本ずつ /assets/ へ書き出す**
  （assets/recaday.css など）。頁はそれを読むだけ。

  page.js は、中身が注記だけのときは読みこまない（空のファイルを取りに行かせない）。

  作らないもの
  --------------------------------------------------------------------------
  recaday/closed-test/ は**手で作った頁のまま**。ここでは触らない。
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { render } from './md.mjs';
import { charsOf } from './pagetext.mjs';

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


/** 注記と空白しか無いか（空の js を読みこませないため） */
function isEmptyJs(js) {
  return !js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').trim();
}

async function loadTheme(name) {
  const dir = path.join(THEMES, name);
  if (!fs.existsSync(dir)) throw new Error(`テーマ "${name}" が themes/ に無い`);
  // --watch で読み直せるように、毎回ちがう名前で読む
  const mod = await import(pathToFileURL(path.join(dir, 'theme.mjs')).href + '?t=' + Date.now());
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '');

  // テーマの見た目と動きは、**頁に埋めずに /assets/ へ 1 本ずつ書き出す**
  /*
    書くときは根から（/assets/fonts/… ）。出すときは、**その css の場所からの道**に直す。

    **css の中の道は、頁からではなく css の置き場所から数えられる。**
    css は assets/ に置くので、/assets/fonts/x は fonts/x になる。
    根のままにしておくと、頁をそのまま開いた（file://）ときにドライブの根を
    見にいって、**書体がぜんぶ system のゴシックに落ちる**（黙って起こる）。
    `url(#…)` は頁の中の図を指しているので、ここを通らない（引用符が無い）。
  */
  const css = read('style.css')
    .replace(/(url\(")\/assets\//g, '$1')
    .replace(/(url\(")\/(?!\/)/g, '$1../');
  const js = read('page.js');
  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `assets/${name}.css`), css);

  // 注記だけの page.js は、**置かないし読ませない。**
  // 空のファイルを site に残すと、あとで「これは何だ」と探すことになる
  const jsPath = path.join(ROOT, `assets/${name}.js`);
  const empty = isEmptyJs(js);
  if (empty) { if (fs.existsSync(jsPath)) fs.rmSync(jsPath); }
  else fs.writeFileSync(jsPath, js);

  /*
    **名前のうしろに ?v= を付けないこと。**

    直したのに古いものが出るのを防げるが、頁をそのまま開いた（file://）ときに
    問い合わせの付いた道を読めない環境がある。そこで読めないと css がまるごと
    落ちて、**頁が素のまま**になる。得より損のほうが大きい。

    手元で見るあいだは tools/serve.mjs が「貯めるな」と言っているので困らない。
    公開したあと古いものが出たときは、Ctrl+Shift+R で読み直せばよい。
  */
  return {
    ...mod.default,
    name,
    css: `/assets/${name}.css`,
    js: empty ? '' : `/assets/${name}.js`,
  };
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
  checkLinks(made);
  checkFonts();
  return made;
}

/*
  指した先が本当にあるか数える。
  ==========================================================================
  **書体や絵が見つからないことは、黙って起こる。**
  ブラウザは何も言わずに system の書体へ落とすし、空は雲なしで描かれる。
  一度それで気づけなかったので（css を外へ出したとき、中の道を直し忘れた）、
  作り直すたびにここで数える。

  見るのは、頁の src / href と、css の中の url("…")。
  外を指すもの（https: mailto: data: #…）は数えない。
*/
const HAND_MADE = ['recaday/closed-test/index.html'];   // 手で書いた頁も見る

function checkLinks(made) {
  const bad = [];

  const look = (file, text, re) => {
    const dir = path.dirname(path.join(ROOT, file));
    for (const m of text.matchAll(re)) {
      const href = m[1].split(/[?#]/)[0];
      if (!href || /^(https?:|mailto:|data:|#|\/\/)/.test(href)) continue;
      /*
        **根から書いた道が残っていたら、それ自体が間違い。**
        HTTP では通ってしまうので「ファイルはある」では見つけられない。
        頁をそのまま開いた（file://）ときだけ壊れて、しかも黙って壊れる。
      */
      if (href.startsWith('/')) { bad.push(`${file} → ${m[1]}（根から書いた道が残っている）`); continue; }
      if (!fs.existsSync(path.resolve(dir, href))) bad.push(`${file} → ${m[1]}（そこに無い）`);
    }
  };

  for (const f of [...made.map((r) => r.outRel), ...HAND_MADE]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    look(f, fs.readFileSync(p, 'utf8'), /\s(?:src|href)="([^"]*)"/g);
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'assets')).filter((n) => n.endsWith('.css'))) {
    look(`assets/${f}`, fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'), /url\("([^"]*)"\)/g);
  }

  if (bad.length) {
    console.log(`\n× 指した先が無いものが ${bad.length} 件あります:`);
    for (const b of bad) console.log(`    ${b}`);
    console.log('  **黙って起こります。**書体は system のものに落ち、絵は出ません。');
    process.exitCode = 1;
  }
}

/*
  絞った書体に、足りない字が無いか見る。
  ==========================================================================
  見出しの書体は「その頁に出てくる字だけ」に絞って置いてある（tools/subset-fonts.mjs）。
  **見出しに新しい字を足すと、そこだけ別の書体で出る。**
  黙って起こると気づけないので、作り直すたびにここで数える。
*/
function checkFonts() {
  const manifest = path.join(ROOT, 'assets/fonts/_subsets.json');
  if (!fs.existsSync(manifest)) return;

  let told = false;
  for (const job of JSON.parse(fs.readFileSync(manifest, 'utf8'))) {
    const list = path.join(ROOT, job.chars);
    if (!fs.existsSync(list)) continue;
    const have = new Set(fs.readFileSync(list, 'utf8'));

    const missing = new Set();
    for (const rel of job.pages) {
      const p = path.join(ROOT, rel);
      if (!fs.existsSync(p)) continue;
      // **絞ったときと同じ拾い方をする**（tools/pagetext.mjs の 1 本を共有）
      for (const ch of charsOf(fs.readFileSync(p, 'utf8'), job)) {
        if (!have.has(ch)) missing.add(ch);
      }
    }
    if (missing.size) {
      console.log(`\n! ${job.name} に無い字が ${missing.size} 個あります: ${[...missing].join('')}`);
      told = true;
    }
  }
  if (told) {
    console.log('  **そこだけ別の書体で出ます**（黙って起こります）。絞り直してください:');
    console.log('    node tools/subset-fonts.mjs');
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
