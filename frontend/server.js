const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const YANDEX_VERIFICATION = String(process.env.YANDEX_VERIFICATION || '').trim();

const app = express();
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const indexHtmlTemplate = fs.readFileSync(indexPath, 'utf8');

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildIndexHtml() {
  let html = indexHtmlTemplate;
  if (YANDEX_VERIFICATION && !/name=["']yandex-verification["']/i.test(html)) {
    const meta = `    <meta name="yandex-verification" content="${escapeAttr(YANDEX_VERIFICATION)}" />\n`;
    html = html.replace(/<\/head>/i, `${meta}  </head>`);
  }
  return html;
}

const indexHtml = buildIndexHtml();

const apiProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  secure: true,
});

const wsProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  secure: true,
});

app.use('/api', apiProxy);
app.use('/socket.io', wsProxy);

app.use(express.static(distDir, {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else if (/\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('html').send(indexHtml);
});

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/socket.io')) {
    wsProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend listening on 0.0.0.0:${PORT}`);
  console.log(`Proxying API/WebSocket to ${BACKEND_URL}`);
  if (YANDEX_VERIFICATION) {
    console.log('Yandex Webmaster verification meta enabled');
  }
});
