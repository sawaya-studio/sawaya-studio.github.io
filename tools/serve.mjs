/*
  手元で見るためだけの静的サーバ。

      node tools/serve.mjs        →  http://127.0.0.1:5199/

  GitHub Pages と同じく、末尾が / の所は index.html に落とす。
  **中身を作るのはここではない**（node tools/build.mjs のほう）。
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

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
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
    res.writeHead(200, {
      'content-type': TYPE[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT + '/'));
