/*
  うしろの空。
  --------------------------------------------------------------------------
  recaday アプリの src/components/SkyBackdrop.tsx の SKSL を、そのまま WebGL へ
  写したもの。雲のテクスチャも同じ 1 枚（tools/sky/bake.py が焼いたもの）。
  もとは closed-test の頁に直に埋めてあったもので、**中身は変えていない。**
  変えたのは雲の出どころだけ（頁に埋めた base64 → canvas の data-clouds）。

  **ここで大気の積分を回さないこと。** 散乱はすでに焼いてある。

  使い方
    <script src="/assets/clouds.js" defer></script>   ← 先に読む（雲の絵）
    <canvas id="sky" aria-hidden="true"></canvas>
    <script src="/assets/sky.js" defer></script>

  **画面いっぱいの 1 枚とは限らない。** data-sky を付けた canvas にも同じものが掛かる
  （トップの札の中など）。#sky と [data-sky] の両方を拾って、1 枚ずつ同じものを回す。
    <canvas data-sky aria-hidden="true"></canvas>

  色は skyTable.ts の 7:00（朝）の行で止めてある。**この site はずっと朝。**
  描けない環境では何もしない。地の色（--sky-fallback）が残るだけで、読むぶんには困らない。
*/
(function () {

/* 1 枚ぶん。**中身は元のまま。** 変えたのは「どの canvas に掛けるか」だけ */
function mount(canvas) {
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
  if (!gl) return; // 描けなければ地の色のまま。読むぶんには困らない

  var VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform sampler2D uClouds;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec3 uZenith, uMid, uHorizon, uLit, uShadow, uSun;',
    'uniform vec2 uSunPos;',
    'uniform float uGlow;',

    // テクスチャ 1 単位あたりの画素数。bake.py の TEX / UNITS（512 / 4）と揃えること
    'const float TEXS = 128.0;',
    'const float TEX = 512.0;',
    'const float HORIZON = 0.995;',
    'const float DIST_CLAMP = 16.0;',
    'const float FADE_FROM = 0.32;',
    'const float RT_CELL = 4.5;',
    'const float RT_JITTER = 4.0;',
    'const float CLOUD_MEAN = 0.506;',
    'const float OCT2_ROT = 0.9;',

    'vec2 rot(vec2 p, float a) {',
    '  float c = cos(a); float s = sin(a);',
    '  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);',
    '}',

    'vec2 tileHash(vec2 c) {',
    '  float a = sin(c.x * 127.1 + c.y * 311.7) * 43758.5453;',
    '  float b = sin(c.x * 269.5 + c.y * 183.3) * 43758.5453;',
    '  return fract(vec2(a, b));',
    '}',

    // 升目ごとにずらして引き、隣と混ぜる。まっすぐ敷くと縦の筋が出る
    'float tiled(vec2 p) {',
    '  vec2 f = p / RT_CELL;',
    '  vec2 i = floor(f);',
    '  vec2 t = f - i;',
    '  t = t * t * (3.0 - 2.0 * t);',
    '  float acc = 0.0;',
    '  float w2 = 0.0;',
    '  for (int dy = 0; dy < 2; dy++) {',
    '    for (int dx = 0; dx < 2; dx++) {',
    '      vec2 d = vec2(float(dx), float(dy));',
    '      float w = mix(1.0 - t.x, t.x, d.x) * mix(1.0 - t.y, t.y, d.y);',
    '      vec2 o = tileHash(i + d) * RT_JITTER;',
    '      acc += w * texture2D(uClouds, (p + o) * TEXS / TEX).r;',
    '      w2 += w * w;',
    '    }',
    '  }',
    '  return CLOUD_MEAN + (acc - CLOUD_MEAN) * inversesqrt(max(w2, 1e-6));',
    '}',

    'float density(vec2 p) {',
    '  float a = tiled(p);',
    '  float b = tiled(rot(p, OCT2_ROT) * 0.41 + vec2(37.0, 11.0));',
    '  return a * 0.62 + b * 0.38;',
    '}',

    'void main() {',
    // Skia は左上原点、WebGL は左下原点。**ここで返すこと**
    '  vec2 uv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;',
    '  float aspect = uRes.x / uRes.y;',
    '  vec3 col = uv.y < 0.5 ? mix(uZenith, uMid, uv.y * 2.0)',
    '                        : mix(uMid, uHorizon, (uv.y - 0.5) * 2.0);',
    // 太陽のにじみ。広い散乱と、芯の白
    '  float d = length((uv - uSunPos) * vec2(aspect, 1.0));',
    '  col = mix(col, uSun, exp(-d * 3.2) * uGlow);',
    '  col = mix(col, vec3(1.0), exp(-d * 26.0) * uGlow);',
    // 雲。地平に収束する平面へ投影してタイルを引く
    '  float dy = max(HORIZON - uv.y, 0.006);',
    '  float dist = min(1.0 / dy, DIST_CLAMP);',
    '  vec2 cp = vec2((uv.x - 0.5) * dist, dist) * 2.30',
    '          + vec2(uTime * 0.150, uTime * 0.030);',
    '  float dens = density(cp);',
    // 陰影は太陽の位置に追従する（焼いた絵そのものは動かない）
    '  vec2 toSun = normalize(vec2(uSunPos.x - uv.x, uv.y - uSunPos.y) + vec2(1e-5));',
    '  float dens2 = density(cp + toSun * 0.08 * dist);',
    '  float lit = clamp((dens - dens2) * 3.2 + 0.5, 0.0, 1.0);',
    '  float cover = smoothstep(0.530, 0.645, dens)',
    '              * (1.0 - smoothstep(DIST_CLAMP * FADE_FROM, DIST_CLAMP * 0.99, dist));',
    '  col = mix(col, mix(uShadow, uLit, lit), cover * 0.90);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  function hex(h) {
    return [
      parseInt(h.slice(1, 3), 16) / 255,
      parseInt(h.slice(3, 5), 16) / 255,
      parseInt(h.slice(5, 7), 16) / 255
    ];
  }
  // src/lib/skyTable.ts の h = 7.0（朝）の行
  var SKY = {
    zenith: '#5D8197', mid: '#7097AD', horizon: '#CAC4A8',
    lit: '#FFFFFE', shadow: '#ADC1CD', sun: '#FFFFFF',
    sunU: 0.1667, sunV: 0.6737, glow: 0.85
  };
  var u = {};
  ['uClouds', 'uRes', 'uTime', 'uZenith', 'uMid', 'uHorizon', 'uLit', 'uShadow',
   'uSun', 'uSunPos', 'uGlow'].forEach(function (n) {
    u[n] = gl.getUniformLocation(prog, n);
  });
  gl.uniform3fv(u.uZenith, hex(SKY.zenith));
  gl.uniform3fv(u.uMid, hex(SKY.mid));
  gl.uniform3fv(u.uHorizon, hex(SKY.horizon));
  gl.uniform3fv(u.uLit, hex(SKY.lit));
  gl.uniform3fv(u.uShadow, hex(SKY.shadow));
  gl.uniform3fv(u.uSun, hex(SKY.sun));
  gl.uniform2f(u.uSunPos, SKY.sunU, SKY.sunV);
  gl.uniform1f(u.uGlow, SKY.glow);

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 1x1 の灰で埋めておく。雲が届くまでのあいだ、空だけが出る
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([129, 129, 129, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  /*
    **補間を入れないこと（最近傍のまま）。**
    地平の近くでは大きく引き伸ばされるので、テクセルが四角い塊として出る。
    これは残すと決めた見た目で、この空の持ち味になっている（アプリ側も同じ）。
  */
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.uniform1i(u.uClouds, 0);

  // 画素は詰めすぎない。画面ぜんぶを塗り直す絵なので、そのまま電池に効く
  var MAX_DPR = 1.5;
  var w = 0, h = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    var nw = Math.round(canvas.clientWidth * dpr);
    var nh = Math.round(canvas.clientHeight * dpr);
    if (nw === w && nh === h) return false;
    w = nw; h = nh;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.uRes, w, h);
    return true;
  }

  var last = 0;
  function draw(t) {
    gl.uniform1f(u.uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var clouds = new Image();
  clouds.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, clouds);
    draw(last);
  };
  /*
    雲の出どころ。**既定は頁に抱えた 1 枚**（assets/clouds.js が置く data: の絵）。

    **.png を直に読ませないこと。** ファイルを直接開いた（file://）とき、
    Chrome は別ファイルの画像を「よそから来たもの」として扱い、
    WebGL のテクスチャに載せられない。すると雲の濃さが一定になり、
    しきい値を越えず、**雲が一枚も出ない空**になる（空と太陽だけ出る）。
    data-clouds は、置き場を変えたいときのための逃げ道。
  */
  clouds.src = canvas.dataset.clouds || window.RECADAY_CLOUDS || 'clouds.png';

  var TIME_SCALE = 0.5;
  var FRAME_MS = 50; // 20 回 / 秒。雲はゆっくり流れるだけなので足りる
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resize();
  draw(0);
  window.addEventListener('resize', function () {
    if (resize()) draw(last);
  });

  if (!still) {
    var start = performance.now();
    var prev = -1;
    (function loop(now) {
      requestAnimationFrame(loop);
      var tick = Math.floor((now - start) / FRAME_MS);
      if (tick === prev) return; // 刻んだ値が変わったときだけ描き直す
      prev = tick;
      resize();
      last = (tick * FRAME_MS) / 1000 * TIME_SCALE;
      draw(last);
    })(start);
  }
}

document.querySelectorAll('#sky, [data-sky]').forEach(mount);
})();
