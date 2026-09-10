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
import { charsOf } from './pagetext.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
  絞る書体の一覧。

  from  … 元の書体（手元にあるもの）
  to    … 置き先
  pages … どの頁の字を拾うか
  extra … 頁に出てこなくても必ず入れる字
*/
const ASCII = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SOLOG = 'E:/claude_workspace/solog/assets/fonts';

const JOBS = [
  {
    name: 'RocknRoll One',
    from: 'E:/claude_workspace/plot-studio/node_modules/@fontsource/rocknroll-one/files/rocknroll-one-japanese-400-normal.woff2',
    to: 'assets/fonts/RocknRollOne-Regular.woff2',
    pages: ['telop-studio/index.html'],
    // 章の丸に入る数字と矢印
    extra: ASCII + '→・',
  },
  {
    /*
      recaday のキャプションの書体。**時刻の「丸ゴシック」もこれ。**

      キャプションは頁に書いた字がそのまま出るので、**頁ごと拾う。**
      ::: player が置く JSON の中の字も出るが、そこは `<script type="application/json">`
      なので、visibleText では拾えない。**だから JSON も足して数える。**
    */
    name: 'M PLUS 1p',
    from: `${SOLOG}/MPLUS1p-Bold.ttf`,
    to: 'assets/fonts/MPLUS1p-Bold.woff2',
    pages: ['recaday/index.html'],
    withJson: true,
    extra: ASCII + ':',
  },
  {
    /*
      sawaya studio の欧字（Saira、SIL OFL）。**この頁だけで使う。**

      **日本語は入っていない書体**なので、名乗り・節の名前・走る場所といった
      欧字の札にだけ掛かる。日本語の見出しと本文は system のゴシックのまま。

      元をこの site の中（tools/fonts-src/）に置いているのは、
      **ほかの書体と違って、手元のどこにも無いから**（recaday と plot-studio から
      借りているものは、あちらにある）。Google Fonts から取ってきた latin の 1 本で、
      100〜900 の可変軸を持っている。

      頁ぜんぶの字を渡すが、**日本語は Saira に無いので、そのまま落ちる。**
    */
    name: 'Saira',
    from: 'tools/fonts-src/Saira-latin.woff2',
    to: 'assets/fonts/Saira-Variable.woff2',
    pages: ['index.html'],
    extra: ASCII + '/→・()、。',
  },
  {
    /*
      sawaya studio の日本語（M PLUS 1、SIL OFL）。**この頁だけ。**

      Saira と組ませるために選んだ。角ばった幾何学的な骨格が Saira の顔に近く、
      同じく**可変 1 本**（100〜900）で太さが揃う。
      recaday のキャプションが M PLUS 1p（同じ M+ の系列）なので、
      **site の日本語が 2 系統に散らない。**

      並べる順は css で「Saira → M PLUS 1」。
      **Saira には日本語が入っていない**ので、欧字は Saira、日本語は M PLUS 1 に
      自然と分かれる。切り替える書き分けは要らない。

      元（4.2MB）は重いので git に入れていない。無ければ tools/get-fonts.mjs が取ってくる。
    */
    name: "M PLUS 1",
    from: "tools/fonts-src/MPLUS1[wght].ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/mplus1/MPLUS1%5Bwght%5D.ttf",
    to: "assets/fonts/MPLUS1-Variable.woff2",
    pages: ["index.html"],
    extra: ASCII,
  },
  {
    /*
      オートモザイクの書体（IBM Plex Sans JP、SIL OFL）。**この頁だけ。**

      道具が同梱しているものと同じ（auto-mosaic/mobile/theme/index.ts の FONT.bold）。
      **端末の書体に任せない**のは道具の側の決めごとで、頁もそれに合わせる。
      元は 4.5MB あるので、頁に出る字だけに絞る。
    */
    name: 'IBM Plex Sans JP',
    from: 'E:/claude_workspace/auto-mosaic/mobile/node_modules/@expo-google-fonts/ibm-plex-sans-jp/700Bold/IBMPlexSansJP_700Bold.ttf',
    to: 'assets/fonts/IBMPlexSansJP-Bold.woff2',
    pages: ['auto-mosaic/index.html'],
    extra: ASCII,
  },
  {
    /*
      看板の書体（851ゴチカクット）。**看板に出る字だけ。**
      頁ぜんぶを拾うと、本文の字まで入って重くなる（本文には使わない書体）。
      だから class="brand" の中だけを見る。
    */
    name: '851ゴチカクット',
    from: 'E:/claude_workspace/plot-studio/mobile/assets/fonts/851Gkktt.ttf',
    to: 'assets/fonts/851Gkktt-logo.woff2',
    pages: ['telop-studio/index.html', 'index.html'],
    classes: ['brand'],
    extra: '',
  },
  /*
    時刻の書体（丸ゴシック以外の 5 つ）。
    **数字とコロンと AM/PM しか出ない**ので、頁を見に行く必要がない。
    アプリ側もそう決めてある（時刻が受け持つのは数字とコロンと AM/PM だけ）。
  */
  ...[
    ['JetBrains Mono', 'JetBrainsMono-ExtraBold'],
    ['IBM Plex Mono', 'IBMPlexMono-Light'],
    ['Space Mono', 'SpaceMono-Bold'],
    ['Share Tech Mono', 'ShareTechMono-Regular'],
    ['Cutive Mono', 'CutiveMono-Regular'],
  ].map(([name, file]) => ({
    name,
    from: `${SOLOG}/${file}.ttf`,
    to: `assets/fonts/${file}.woff2`,
    pages: [],
    extra: '0123456789:APM',
  })),
];

let failed = false;

for (const job of JOBS) {
  const from = path.isAbsolute(job.from) || /^[A-Za-z]:/.test(job.from)
    ? job.from : path.join(ROOT, job.from);
  // **重い元は git に入れていない**（M PLUS 1 は 4.2MB）。無ければ取ってくる
  if (!fs.existsSync(from) && job.url) {
    console.log(`  ${job.name} の元を取ってきます…`);
    fs.mkdirSync(path.dirname(from), { recursive: true });
    try {
      execFileSync('curl', ['-sL', '--max-time', '120', '-o', from, job.url], { stdio: 'inherit' });
    } catch (e) { /* 下で「無い」と言う */ }
  }
  if (!fs.existsSync(from)) {
    console.error(`× ${job.name} の元が無い:\n  ${from}`);
    if (job.url) console.error(`  取ってくる先: ${job.url}`);
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
    const html = fs.readFileSync(p, 'utf8');
    for (const ch of charsOf(html, job)) chars.add(ch);
  }

  const text = [...chars].sort().join('');
  const out = path.join(ROOT, job.to);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  try {
    execFileSync('py', [
      '-3.14', '-m', 'fontTools.subset', from,
      `--text=${text}`,
      `--output-file=${out}`,
      '--flavor=woff2',
      // **kern を捨てないこと。** 落とすと、書体が持っている字組みが消えて
      // 「A」と「V」のような対が離れたままになる。palt は持っている書体だけ効く
      '--layout-features=kern,palt,liga,clig',
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

/*
  何をどう拾ったかを残す。
  **build.mjs はこれを見て、まったく同じ拾い方で「足りているか」を数える。**
  ここに書いておかないと、絞り方と数え方がずれて、黙って字が欠ける。
*/
fs.writeFileSync(path.join(ROOT, 'assets/fonts/_subsets.json'),
  JSON.stringify(JOBS.map((j) => ({
    name: j.name,
    chars: j.to.replace(/\.woff2$/, '.chars.txt'),
    pages: j.pages,
    classes: j.classes ?? null,
    withJson: !!j.withJson,
  })), null, 2) + '\n');

if (failed) process.exitCode = 1;
