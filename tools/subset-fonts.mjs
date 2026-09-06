/*
  見出しの書体を、頁に出てくる字だけに絞る。
  ==========================================================================
      node tools/build.mjs          先に頁を作ってから
      node tools/subset-fonts.mjs   これを走らせる

  RocknRoll One（SIL OFL）は日本語ぶんだけで 950KB ある。
  **1 枚の頁のためにそれを配るのは重すぎる**ので、その頁に実際に出てくる字だけを
  抜いて置く（たいてい 20〜40KB になる）。

  絞った字の一覧は assets/fonts/RocknRollOne-Regular.chars.txt に残す。
  **build.mjs はそれを見て、足りない字があれば教えてくれる。**
  見出しに新しい字を使ったら、これをもう一度走らせること。

  要るもの
    py -3.14 -m pip install fonttools brotli
    plot-studio の node_modules（元の書体がそこにある）
*/

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
  絞る書体の一覧。

  from  … 元の書体（手元にあるもの）
  to    … 置き先
  pages … どの頁の字を拾うか
  extra … 頁に出てこなくても必ず入れる字
*/
const JOBS = [
  {
    name: 'RocknRoll One',
    from: 'E:/claude_workspace/plot-studio/node_modules/@fontsource/rocknroll-one/files/rocknroll-one-japanese-400-normal.woff2',
    to: 'assets/fonts/RocknRollOne-Regular.woff2',
    pages: ['telop-studio/index.html'],
    // 章の丸に入る数字と矢印、英字と数字ひとそろい
    extra: '0123456789→ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz・',
  },
];

/** 頁から、目に見える字だけを取り出す（style と script の中は数えない） */
function visibleText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
}

let failed = false;

for (const job of JOBS) {
  if (!fs.existsSync(job.from)) {
    console.error(`× ${job.name} の元が無い:\n  ${job.from}`);
    failed = true;
    continue;
  }

  const chars = new Set(job.extra);
  for (const rel of job.pages) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      console.error(`× ${rel} が無い。先に node tools/build.mjs を走らせること`);
      failed = true;
      continue;
    }
    for (const ch of visibleText(fs.readFileSync(p, 'utf8'))) {
      // 空白と改行は要らない
      if (!/\s/.test(ch)) chars.add(ch);
    }
  }

  const text = [...chars].sort().join('');
  const out = path.join(ROOT, job.to);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  try {
    execFileSync('py', [
      '-3.14', '-m', 'fontTools.subset', job.from,
      `--text=${text}`,
      `--output-file=${out}`,
      '--flavor=woff2',
      '--layout-features=',
      '--no-hinting',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    console.error(`× ${job.name} を絞れなかった。fonttools が要る:`);
    console.error('  py -3.14 -m pip install fonttools brotli');
    failed = true;
    continue;
  }

  fs.writeFileSync(out.replace(/\.woff2$/, '.chars.txt'), text);
  console.log(`${job.to}  ${(fs.statSync(out).size / 1024).toFixed(1)} KB  （${chars.size} 字）`);
}

if (failed) process.exitCode = 1;
