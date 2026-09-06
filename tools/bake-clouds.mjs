/*
  雲を、頁の中に抱えられる形にする。
  ==========================================================================
      node tools/bake-clouds.mjs

  assets/clouds.png  →  assets/clouds.js（base64 で抱えたもの）

  **なぜ .png のまま読ませないか。**
  頁のファイルを直接開く（file://）と、Chrome は別ファイルの画像を
  「よそから来たもの」として扱う。よその画像は WebGL のテクスチャに載せられないので、
  雲の濃さが一定になり、しきい値を越えず、**雲が一枚も出ない空**になる
  （空と太陽だけ出るので、一見それらしく見えてしまう）。
  頁の中に抱えた絵なら、その扱いを受けない。
  **元の closed-test の頁も、同じ理由で頁の中に埋めていた。**

  雲を差し替えるときは、assets/clouds.png を置き換えてからこれを走らせる。
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/clouds.png');
const OUT = path.join(ROOT, 'assets/clouds.js');

const png = fs.readFileSync(SRC);
// 512x512 でないと、シェーダの TEXS / TEX（128 / 512）と食い違う
const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
if (w !== 512 || h !== 512) {
  console.error(`× 雲は 512x512 でなければならない（いまは ${w}x${h}）。`);
  console.error('  シェーダの TEX = 512.0 と、bake.py の TEX / UNITS に合わせること。');
  process.exit(1);
}

fs.writeFileSync(OUT, `/*
  焼いた雲、1 枚。**tools/bake-clouds.mjs が作ったもの。手で直さないこと。**

  中身は assets/clouds.png と同じもの（recaday の tools/sky/bake.py が焼いたもの）を、
  そのまま base64 で抱えている。**なぜそうするかは tools/bake-clouds.mjs に書いてある。**
*/
window.RECADAY_CLOUDS = "data:image/png;base64,${png.toString('base64')}";
`);

console.log(`${path.relative(ROOT, OUT)}  ${(fs.statSync(OUT).size / 1024 | 0)} KB  （元 ${w}x${h}）`);
