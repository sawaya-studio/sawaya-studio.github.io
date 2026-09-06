/*
  日本語の字詰め。
  ==========================================================================
  **日本語の約物は、四角い枠の中に半分しか描かれていない。**
  「。」も「（」も 1 文字ぶんの幅を持っていて、残り半分は空白。
  そのまま並べると、句読点や括弧のところだけ穴が空いて見える。

  欧文の書体はこれを `palt`（proportional alternates）という機能で持っているが、
  **M PLUS 1 は持っていない**（元の書体を調べた。kern はある）。
  だから、どこをどれだけ詰めるかをここで決める。

  やっていること
  --------------------------------------------------------------------------
    1. **約物を詰める**
         開き括弧「（     … 墨は右半分にある → **左**を詰める
         閉じ括弧」）。、  … 墨は左半分にある → **右**を詰める
         中点・：；        … 墨は真ん中にある → **両方**を半分ずつ詰める
    2. **約物が続いたら、詰めを重ねない**
       「」。のように並ぶと、詰めが足し算になって字がくっつく。
       間はどちらか一方だけにする
    3. **和文と欧文のあいだに、わずかな空きを入れる**（四分アキの半分ほど）
       「recaday を作る」の「y」と「を」は、そのままだとぶつかって見える

  **数値は em で持つこと。** px で持つと、文字サイズを変えたときだけ詰めが崩れる。
*/

/** 開き括弧。墨は右半分 → 左を詰める */
const OPEN = '「『（〔［｛〈《【〖〘〚“‘';
/** 閉じ括弧と句読点。墨は左半分 → 右を詰める */
const CLOSE = '」』）〕］｝〉》】〗〙〛”’、。，．';
/** 中点類。墨は真ん中 → 両方を半分ずつ */
const MIDDLE = '・：；‥…';
/** 感嘆・疑問。うしろに字が続くときだけ、少し詰める */
const BANG = '！？';

/** 和文（欧文と数字ではない、空白でもないもの） */
const isJa = (c) => c && !/[\x20-\x7E]/.test(c) && !/\s/.test(c);
/** 欧文と数字 */
const isLatin = (c) => c && /[0-9A-Za-z]/.test(c);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 1 行ぶんを組む。返るのは HTML。
 *
 * @param {string} line
 * @param {{trim?: number, wa?: number}} opts
 *   trim … 約物 1 つぶんの詰め（em）。既定 0.5 は「半分空いている」ぶん
 *   wa   … 和文と欧文のあいだの空き（em）
 */
export function kernLine(line, opts = {}) {
  const TRIM = opts.trim ?? 0.5;
  const WA = opts.wa ?? 0.08;
  const chars = [...line];
  const out = [];

  // 各文字の、左と右をどれだけ詰めるか
  const L = new Array(chars.length).fill(0);
  const R = new Array(chars.length).fill(0);

  chars.forEach((c, i) => {
    if (OPEN.includes(c)) L[i] = TRIM;
    else if (CLOSE.includes(c)) R[i] = TRIM;
    else if (MIDDLE.includes(c)) { L[i] = TRIM / 2; R[i] = TRIM / 2; }
    else if (BANG.includes(c) && i < chars.length - 1) R[i] = TRIM / 2;
  });

  /*
    **約物が続いたら、詰めを重ねない。**
    「」。と並ぶと、右の詰めと左の詰めが同じすき間に効いて字がくっつく。
    間の 1 か所につき、大きいほうだけを残す。
  */
  for (let i = 0; i + 1 < chars.length; i++) {
    if (R[i] > 0 && L[i + 1] > 0) {
      const keep = Math.max(R[i], L[i + 1]);
      R[i] = keep;
      L[i + 1] = 0;
    }
  }

  // 和文と欧文のあいだ
  const gap = new Array(chars.length).fill(0);
  for (let i = 0; i + 1 < chars.length; i++) {
    const a = chars[i], b = chars[i + 1];
    const across = (isJa(a) && isLatin(b)) || (isLatin(a) && isJa(b));
    // 約物のとなりでは入れない（そこはもう詰めている）
    const near = R[i] > 0 || L[i + 1] > 0 || OPEN.includes(a) || CLOSE.includes(b);
    if (across && !near) gap[i] = WA;
  }

  chars.forEach((c, i) => {
    const style = [];
    if (L[i]) style.push(`margin-left:-${L[i]}em`);
    if (R[i] + gap[i]) {
      const v = R[i] - gap[i];   // 詰めと空きは同じ向きなので、足し引きは 1 つにまとめる
      style.push(`margin-right:${v > 0 ? '-' : ''}${Math.abs(v)}em`);
    }
    out.push(style.length ? `<span style="${style.join(';')}">${esc(c)}</span>` : esc(c));
  });

  return out.join('');
}

/** 何行かをまとめて組む。行の切れ目は <br> */
export function kernText(text, opts) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => kernLine(l, opts))
    .join('<br>\n');
}
