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
  onProxyReq(proxyReq, req) {
    // Preserve public host so backend absolute URLs (sitemaps, redirects) stay on www.lootz.ru
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host) {
      proxyReq.setHeader('X-Forwarded-Host', host);
    }
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    proxyReq.setHeader('X-Forwarded-Proto', proto);
  },
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
      return;
    }
    // Assortment logos are updated in place (same filename) — do not mark immutable
    if (filePath.includes(`${path.sep}assortment${path.sep}`) && /\.png$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      return;
    }
    if (/\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/i.test(filePath)) {
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
