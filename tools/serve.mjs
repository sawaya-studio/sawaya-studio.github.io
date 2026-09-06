/*
  手元で見るためだけの静的サーバ。

      node tools/serve.mjs        →  http://127.0.0.1:5199/

  GitHub Pages と同じく、末尾が / の所は index.html に落とす。
  **中身を作るのはここではない**（node tools/build.mjs のほう）。

  **出来上がったものが変わったら、ブラウザを読み直させる。**
  build --watch は作り直すところまでしかしないので、これが無いと
  「保存したのに変わらない」と見える（実際は変わっているが、画面が古いだけ）。

  **これは手元で見るときだけのもの。** 頁に足す小さな script は、
  ここが返すときに差しこんでいるだけで、**出来上がったファイルには入らない。**
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const TYPE = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/* ============================================================
   変わったら読み直させる
   ============================================================ */

const waiting = new Set();          // 待っているブラウザ
let timer = null;

/*
  **出来上がったものだけを見る。**
  content/ と themes/ は build --watch が見ているので、こちらで数えると
  作り直しの前に読み直してしまい、古い画面が出る。
*/
fs.watch(ROOT, { recursive: true }, (_, name) => {
  if (!name) return;
  const p = name.replace(/\\/g, '/');
  if (/^(\.git|node_modules|content|themes|tools)\//.test(p)) return;
  if (!/\.(html|css|js|svg|png|woff2)$/.test(p)) return;

  // 1 回の作り直しで何度も呼ばれるので、少しためてから 1 回だけ知らせる
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const res of waiting) res.write('data: reload\n\n');
  }, 150);
});

/** 頁の終わりに差しこむ小さな script。**出来上がったファイルには入らない** */
const RELOAD = `
<script>
/* 手元で見るときだけのもの（tools/serve.mjs が差しこんでいる）。
   つながりが切れたら、少し待って繋ぎ直す（サーバを立て直したときのため）。 */
(function () {
  var open = function () {
    var es = new EventSource('/__reload');
    es.onmessage = function () { location.reload(); };
    es.onerror = function () { es.close(); setTimeout(open, 1000); };
  };
  open();
})();
</script>
`;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  if (p === '/__reload') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    res.write('\n');
    waiting.add(res);
    req.on('close', () => waiting.delete(res));
    return;
  }

  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) {
      const alt = file + '.html';
      return fs.readFile(alt, (e2, b2) => {
        if (e2) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + p); return; }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(b2);
      });
    }
    // **貯めさせない。** 作り直したのに古いものが出ると、直したつもりで直っていない
    const type = TYPE[path.extname(file)] || 'application/octet-stream';
    const body = type.startsWith('text/html')
      ? Buffer.from(buf.toString('utf8').replace(/<\/body>/i, RELOAD + '</body>'))
      : buf;
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
  });
})
  .on('error', (e) => {
    // **すでに立ち上がっているだけ、のことが多い。**
    // 積み上がった英語の記録を出しても、何をすればよいか分からないので、
    // その場でやることだけを言う
    if (e.code === 'EADDRINUSE') {
      console.error(`\n  ${PORT} 番はもう使われています。`);
      console.error('  たいていは、前に立ち上げたサーバがまだ動いています。');
      console.error(`  そのまま http://127.0.0.1:${PORT}/ を開いてください。\n`);
      console.error('  止めたいときは、その窓で Ctrl+C。窓が見つからないときは');
      console.error(`    Windows … netstat -ano | findstr :${PORT}   で番号を見て  taskkill /F /PID <番号>`);
      console.error(`    Mac     … lsof -ti :${PORT} | xargs kill\n`);
      process.exit(1);
    }
    throw e;
  })
  .listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT + '/'));
