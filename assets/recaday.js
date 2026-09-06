/*
  recaday の頁を動かすところ。

  **部品が無い頁でも落ちないこと。** .md にその ::: を書かなければ
  要素は出てこないので、どれも「あれば動かす」形にしてある。
*/
(function () {
  'use strict';

  /* ---------- 言葉の切り替え。押したら覚える ---------- */
  var titleEl = document.querySelector('meta[name="title-en"]');
  var TITLE = { ja: document.title, en: titleEl ? titleEl.content : document.title };
  var buttons = document.querySelectorAll('.lang button');

  function applyLang(lang) {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang;
    document.title = TITLE[lang] || TITLE.ja;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.set === lang));
    });
    langWatchers.forEach(function (fn) { fn(lang); });
  }
  var langWatchers = [];
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      applyLang(b.dataset.set);
      try { localStorage.setItem('recaday-lang', b.dataset.set); } catch (e) { /* 覚えないだけ */ }
    });
  });

  /* ---------- どちらか片方だけを押させる口 ---------- */
  function pickGroup(sel, onPick) {
    var group = document.querySelectorAll(sel);
    group.forEach(function (b) {
      b.addEventListener('click', function () {
        group.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        onPick(b);
      });
    });
  }

  /* 時刻の書体。**枠（.burn）ごと差し替える。**
     大文字の高さと行の高さは枠が持っていて、キャプションの位置もそこから決まる */
  var burns = document.querySelectorAll('.burn');
  pickGroup('.pick--font', function (b) {
    burns.forEach(function (n) { n.dataset.font = b.dataset.font; });
  });

  /* フィルター。掛ける先は data-scene-id、無ければ #filter-scene */
  pickGroup('.pick--filter', function (b) {
    var scene = document.getElementById('filter-scene');
    if (!scene) return;
    scene.className = scene.className.replace(/filter-\w+/, 'filter-' + b.dataset.filter);
  });

  /* ---------- 焼き込みの見本を流す ----------
     クリップは頁の中の JSON（::: player が置いたもの）から読む。
     時刻は「撮影開始の実時刻 + 再生位置」。**アプリの数え方と同じ。**
     分が変わるところを見せたいので、ここでは早送りにしてある。 */
  var src = document.getElementById('demo-clips');
  if (src) {
    var CLIPS = JSON.parse(src.textContent);
    var SPEED = 20;
    var DUR = 3.5;                              // 1 クリップぶんの見せ時間（秒）
    var TOTAL = CLIPS.length * DUR;

    var clockEl = document.getElementById('demo-clock');
    var capEl = document.getElementById('demo-caption');
    var sceneEl = document.getElementById('demo-scene');
    var stampEl = document.getElementById('demo-stamp');
    var playEl = document.getElementById('demo-play');
    var iconEl = document.getElementById('demo-icon-path');
    var segs = document.querySelectorAll('.track .seg span');

    var hhmm = function (sec) {
      var h = Math.floor(sec / 3600) % 24;
      var m = Math.floor(sec / 60) % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    };

    var at = 0;
    var show = function (pos) {
      var i = Math.min(CLIPS.length - 1, Math.floor(pos / DUR));
      var t = pos - i * DUR;
      var c = CLIPS[i];
      var stamp = hhmm(c.start + t * SPEED);
      clockEl.textContent = stamp;
      stampEl.textContent = stamp;
      capEl.textContent = document.documentElement.dataset.lang === 'ja' ? c.ja : c.en;
      sceneEl.className = 'scene scene--' + c.scene + ' filter-skin';
      for (var k = 0; k < segs.length; k++) {
        segs[k].style.width = (k < i ? 100 : k > i ? 0 : Math.min(100, (t / DUR) * 100)) + '%';
      }
    };

    var playing = false, raf = 0, base = 0;
    var frame = function (now) {
      if (!playing) return;
      at = (now - base) / 1000;
      if (at >= TOTAL) { at = 0; base = now; }
      show(at);
      raf = requestAnimationFrame(frame);
    };
    var setPlaying = function (on) {
      playing = on;
      iconEl.setAttribute('d', on ? 'M7 5h3v14H7zM14 5h3v14h-3z' : 'M8 5v14l11-7z');
      playEl.setAttribute('aria-label', on ? 'Pause' : 'Play');
      if (on) { base = performance.now() - at * 1000; raf = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(raf); }
    };
    playEl.addEventListener('click', function () { setPlaying(!playing); });

    show(0);
    // 言葉を変えたらキャプションも差し替える。**流している最中でも合う**
    langWatchers.push(function () { show(at); });

    // 見えている間だけ動かす。**画面の外で回し続けない**
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting && playing) setPlaying(false); });
      }, { threshold: 0.15 }).observe(document.getElementById('demo-frame'));
    }
  }

  applyLang(document.documentElement.dataset.lang);
})();
