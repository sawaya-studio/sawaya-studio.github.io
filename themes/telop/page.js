/*
  テロップスタジオの頁を動かすところ。

  **道具の app.js と同じ考え方で作ってある。**
    ・状態は 1 か所（S）に置いて、書き換えたら draw() で描き直す
    ・行の一覧と右の画面は、**同じ状態を見ている**。だから片方を直すと両方動く
    ・**位置は数字で決めない。** つまんで動かした所を、見取り図が追いかける

  道具そのものはこれよりずっと多くのことをするが、
  「行を直すと画面が変わる」という手ざわりだけは、ここで同じにしてある。

  **その ::: を .md に書かなければ、ここは何もしない。**
*/
(function () {
  'use strict';

  var src = document.getElementById('editor-rows');
  if (!src) return;
  var cfg = JSON.parse(src.textContent);

  /* 出す場所。**9か所。** 道具の PosGrid と同じ並び */
  var POS = [
    { x: 0.10, y: 0.10, ax: 'left',   ay: 'top'    },
    { x: 0.50, y: 0.10, ax: 'center', ay: 'top'    },
    { x: 0.90, y: 0.10, ax: 'right',  ay: 'top'    },
    { x: 0.10, y: 0.50, ax: 'left',   ay: 'middle' },
    { x: 0.50, y: 0.50, ax: 'center', ay: 'middle' },
    { x: 0.90, y: 0.50, ax: 'right',  ay: 'middle' },
    { x: 0.10, y: 0.91, ax: 'left',   ay: 'bottom' },
    { x: 0.50, y: 0.91, ax: 'center', ay: 'bottom' },
    { x: 0.90, y: 0.91, ax: 'right',  ay: 'bottom' }
  ];

  var SPEAKERS = cfg.speakers;
  var S = {
    rows: cfg.rows,
    sel: cfg.rows.findIndex(function (r) { return r.kind === 'speech' && !r.cut; }),
    pos: cfg.pos,
    minGap: 1.0   // これより長い無音を「長い」として色を変える
  };
  if (S.sel < 0) S.sel = 0;

  var KIND_NAME = { speech: 'セリフ', gap: '無音', telop: 'テロップ', text: '文字', se: '効果音', bgm: 'BGM' };

  var rowsEl = document.getElementById('rows');
  var tl = document.getElementById('tl');
  var stage = document.getElementById('stage');
  var grid = document.getElementById('posgrid');
  var stamp = document.getElementById('stamp');

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.setAttribute('style', attrs[k]);
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /* 切る / 戻す。**消さずに、線を引くだけ。**
     消すと、どこを切ったのか分からなくなって戻せない */
  function cutBtn(r, i) {
    return el('button', {
      type: 'button',
      class: 'mini danger' + (r.cut ? ' on' : ''),
      title: r.cut ? 'カットをやめる' : 'この行を落とす',
      'aria-pressed': String(!!r.cut),
      onclick: function (e) { e.stopPropagation(); r.cut = !r.cut; S.sel = i; draw(); }
    }, ['×']);
  }

  function drawRows() {
    rowsEl.textContent = '';
    S.rows.forEach(function (r, i) {
      var cls = ['row', r.kind];
      if (i === S.sel) cls.push('sel');
      if (r.cut) cls.push('cut');
      if (r.kind === 'gap' && r.len >= S.minGap) cls.push('long');

      var gut = [
        el('span', { class: 'grip', 'aria-hidden': 'true' }, ['⣿']),
        el('span', { class: 'at' }, [r.at || '']),
        el('span', { class: 'kind ' + r.kind }, [KIND_NAME[r.kind] || r.kind]),
        el('span', { class: 'bar' })
      ];
      if (r.kind === 'speech' && SPEAKERS[r.who]) {
        gut.push(el('span', { class: 'who' }, [
          el('i', { style: 'background:' + SPEAKERS[r.who].color }), SPEAKERS[r.who].name
        ]));
      }

      var body = [];
      var tools = [];

      if (r.kind === 'speech') {
        body.push(el('span', { class: 'txt' }, [r.text]));
        // 誰が喋ったか。**押すと入れ替わる。字の色もいっしょに変わる**
        tools.push(el('span', { class: 'sw', role: 'group', 'aria-label': '誰が喋ったか' },
          SPEAKERS.map(function (s, k) {
            return el('button', {
              type: 'button', title: s.name, 'aria-label': s.name,
              'aria-pressed': String(r.who === k),
              style: 'background:' + s.color,
              onclick: function (e) { e.stopPropagation(); r.who = k; S.sel = i; draw(); }
            });
          })));
      } else if (r.kind === 'gap') {
        // 無音の長さを、そのまま棒の長さで見せる。**数字より速く分かる**
        body.push(el('span', { class: 'lenbar', style: 'width:' + Math.min(180, 8 + r.len * 26) + 'px' }));
        body.push(el('span', { class: 'hint' }, ['無音' + (r.cut ? '（カットしています）' : '')]));
        body.push(el('span', { class: 'hint', style: 'flex:none' }, [r.len.toFixed(1) + ' 秒']));
      } else if (r.kind === 'telop' || r.kind === 'text') {
        body.push(el('span', { class: 'txt' }, [r.text]));
      } else if (r.kind === 'se' || r.kind === 'bgm') {
        body.push(el('span', { class: 'hint' }, [(r.file || '') + (r.hint ? ' ・ ' + r.hint : '')]));
      }
      tools.push(cutBtn(r, i));

      rowsEl.appendChild(el('div', {
        class: cls.join(' '),
        onmousedown: function (e) {
          if (e.target.closest('button')) return;
          S.sel = i; draw();
        }
      }, [el('div', { class: 'gutter' }, gut)].concat(body).concat([el('div', { class: 'tools' }, tools)])));
    });
  }

  function drawScreen() {
    var r = S.rows[S.sel] || S.rows[0];
    var p = POS[S.pos];

    tl.textContent = r.kind === 'gap' ? '（無音）'
      : r.kind === 'se' || r.kind === 'bgm' ? '（音）'
      : (r.text || '');
    tl.style.color = (r.kind === 'speech' && SPEAKERS[r.who]) ? SPEAKERS[r.who].color : '#ffffff';
    tl.style.opacity = r.cut ? '0.35' : '1';
    stamp.textContent = r.at || '';

    // 置いた所。**縦横それぞれ、寄せる向きも合わせて動かす**
    tl.style.left = (p.x * 100) + '%';
    tl.style.top = (p.y * 100) + '%';
    tl.style.bottom = 'auto';
    tl.style.transform = 'translate(' +
      (p.ax === 'left' ? '0' : p.ax === 'right' ? '-100%' : '-50%') + ',' +
      (p.ay === 'top' ? '0' : p.ay === 'bottom' ? '-100%' : '-50%') + ')';
    tl.style.textAlign = p.ax;

    grid.querySelectorAll('button').forEach(function (b, k) {
      b.setAttribute('aria-pressed', String(k === S.pos));
    });
  }

  function draw() { drawRows(); drawScreen(); }

  POS.forEach(function (p, k) {
    grid.appendChild(el('button', {
      type: 'button',
      'aria-label': '場所 ' + (k + 1),
      'aria-pressed': String(k === S.pos),
      onclick: function () { S.pos = k; draw(); }
    }));
  });

  /* つまんで動かす。**いちばん近い所へ落ちる。**
     どこにでも置けるようにすると、次に開いたとき数ピクセルずれて見える */
  var dragging = false;
  function pickNearest(cx, cy) {
    var box = stage.getBoundingClientRect();
    var x = (cx - box.left) / box.width;
    var y = (cy - box.top) / box.height;
    var best = 0, bestD = Infinity;
    POS.forEach(function (p, k) {
      var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bestD) { bestD = d; best = k; }
    });
    if (best !== S.pos) { S.pos = best; draw(); }
  }
  tl.addEventListener('pointerdown', function (e) {
    dragging = true;
    tl.classList.add('grabbing');
    tl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  tl.addEventListener('pointermove', function (e) { if (dragging) pickNearest(e.clientX, e.clientY); });
  tl.addEventListener('pointerup', function () { dragging = false; tl.classList.remove('grabbing'); });
  tl.addEventListener('pointercancel', function () { dragging = false; tl.classList.remove('grabbing'); });
  // 指が使えないときのために、矢印でも動かせるようにしておく
  tl.addEventListener('keydown', function (e) {
    var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (d == null) return;
    e.preventDefault();
    S.pos = Math.max(0, Math.min(8, S.pos + d));
    draw();
  });

  draw();
})();
