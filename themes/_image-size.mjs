/*
  絵の大きさを、file の頭から読む。
  ==========================================================================
  **絵を置くときは、幅と高さを必ず出すこと。** 書かないと読み込むまで頁が
  詰まっていて、絵が届いた瞬間に下が飛ぶ。読んでいる途中だと目で追えない。

  人が手で写すと、いつか写し間違える。だから **file から読む。**
  読むのは頭の数十バイトだけで、絵そのものは展開しない。

      imageSize('/assets/recaday-icon.png')   →  { w: 180, h: 180 }
      読めなければ null（形式が違う・壊れている）

  道は根から書く（/assets/… ）。site の根はこの file の 1 つ上。

  分かるのは png / jpeg / gif / webp / svg。
  **avif と heic は読めない。** その 2 つを置くときだけ、w= と h= を手で書く。
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function imageSize(src) {
  const rel = String(src).split(/[?#]/)[0].replace(/^\/+/, '');
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;

  // ---- svg は字なので、そのまま読む ----
  if (/\.svg$/i.test(file)) {
    const t = fs.readFileSync(file, 'utf8').slice(0, 4096);
    const num = (re) => {
      const m = t.match(re);
      return m ? parseFloat(m[1]) : NaN;
    };
    // width="180" が px のときだけ使う。% や em は当てにならない
    let w = num(/\bwidth="([\d.]+)(?:px)?"/);
    let h = num(/\bheight="([\d.]+)(?:px)?"/);
    if (!(w > 0 && h > 0)) {
      const vb = t.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
      if (!vb) return null;
      w = parseFloat(vb[1]);
      h = parseFloat(vb[2]);
    }
    return w > 0 && h > 0 ? { w: Math.round(w), h: Math.round(h) } : null;
  }

  // ---- ほかは頭だけ ----
  // jpeg は EXIF の親指の絵を跨ぐことがあるので、少し多めに読む
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(262144);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  const b = buf.subarray(0, n);

  // png … 8 バイトの合図のうしろが IHDR（幅・高さの順、上位バイトが先）
  if (n > 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }

  // gif … 頭にそのまま入っている（下位バイトが先）
  if (n > 10 && b.toString('latin1', 0, 3) === 'GIF') {
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  }

  // webp … 中の入れ物が 3 通りある
  if (n > 30 && b.toString('latin1', 0, 4) === 'RIFF'
             && b.toString('latin1', 8, 12) === 'WEBP') {
    const kind = b.toString('latin1', 12, 16);
    if (kind === 'VP8 ') {
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
    if (kind === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') {
      const u24 = (o) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
      return { w: u24(24) + 1, h: u24(27) + 1 };
    }
    return null;
  }

  // jpeg … 印を順に飛ばして、大きさを持つ印（SOF）まで進む
  if (n > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < n) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i++; continue; }                       // 詰め物
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {   // 中身を持たない印
        i += 2;
        continue;
      }
      // SOF0..SOF15 のうち、c4（ハフマン表）c8（予約）cc（算術表）は違う
      const isSOF = marker >= 0xc0 && marker <= 0xcf
                 && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }

  return null;
}
