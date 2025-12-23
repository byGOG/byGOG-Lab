// Minimal static server without external deps
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5173;
const root = path.resolve(__dirname, '..');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(root, reqPath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, 'Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = types[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    // Basic Cache-Control policy: hashed assets immutable, HTML no-cache, JSON short TTL
    const isHashed = /\.[0-9a-f]{8}\.(?:css|js)$/.test(filePath);
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (isHashed) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.json') {
      res.setHeader('Cache-Control', 'public, max-age=300');
    } else if (ext === '.css' || ext === '.js' || ext === '.svg') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Serving on http://localhost:${port}`);
});
