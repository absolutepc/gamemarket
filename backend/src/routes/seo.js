const router = require('express').Router();
const pool = require('../config/database');
const gameLandings = require('../data/gameLandings.json');

const OFFER_PATH_BY_TYPE = {
  subscription: 'subscriptions',
  donate: 'donate',
  account: 'accounts',
  item: 'items',
  topup: 'topup',
  keys: 'keys',
  other: 'other',
  currency: 'currency',
  game_account: 'game-accounts',
  boosting: 'boosting',
  services: 'services',
  skins: 'skins',
  games: 'games',
  media: 'media',
  rental: 'rental',
  mods: 'mods',
  design: 'design',
  training: 'training',
};

const LISTINGS_SITEMAP_LIMIT = 45000;
const SELLERS_SITEMAP_LIMIT = 20000;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function siteBase() {
  return (process.env.FRONTEND_URL || 'https://lootz.ru').replace(/\/$/, '');
}

function apiBase(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  if (host) return `${proto}://${host}/api`;
  return `${siteBase()}/api`;
}

function normKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildLandingIndex() {
  const byKey = new Map();
  for (const g of gameLandings) {
    const section = g.section || (g.kind === 'app' ? 'apps' : 'games');
    const entry = { ...g, section };
    const keys = [normKey(g.name), normKey(g.search)].filter(Boolean);
    for (const key of keys) {
      if (!byKey.has(key)) byKey.set(key, entry);
    }
  }
  const sortedKeys = [...byKey.keys()].sort((a, b) => b.length - a.length);
  return { byKey, sortedKeys };
}

function matchLanding(gameName, index) {
  const q = normKey(gameName);
  if (!q) return null;
  if (index.byKey.has(q)) return index.byKey.get(q);
  for (const key of index.sortedKeys) {
    if (key.length < 3) continue;
    if (q.includes(key) || key.includes(q)) return index.byKey.get(key);
  }
  return null;
}

function urlsetXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

function sendXml(res, body) {
  res.type('application/xml').send(body);
}

router.get('/sitemap.xml', (req, res) => {
  const base = apiBase(req);
  const now = new Date().toISOString();
  const maps = [
    'sitemap-static.xml',
    'sitemap-landings.xml',
    'sitemap-offers.xml',
    'sitemap-listings.xml',
    'sitemap-sellers.xml',
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${maps
  .map(
    (name) => `  <sitemap>
    <loc>${escapeXml(`${base}/${name}`)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
  sendXml(res, body);
});

router.get('/sitemap-static.xml', (req, res) => {
  const siteUrl = siteBase();
  const now = new Date().toISOString();
  const staticPages = [
    { path: '', changefreq: 'daily', priority: '1.0' },
    { path: '/catalog', changefreq: 'hourly', priority: '0.9' },
    { path: '/apps', changefreq: 'daily', priority: '0.85' },
    { path: '/about', changefreq: 'monthly', priority: '0.75' },
    { path: '/rules', changefreq: 'monthly', priority: '0.6' },
    { path: '/faq', changefreq: 'monthly', priority: '0.6' },
    { path: '/support', changefreq: 'monthly', priority: '0.6' },
    { path: '/terms-of-sale', changefreq: 'monthly', priority: '0.5' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
    { path: '/user-agreement', changefreq: 'monthly', priority: '0.5' },
  ];
  sendXml(
    res,
    urlsetXml(
      staticPages.map((p) => ({
        loc: `${siteUrl}${p.path || '/'}`,
        lastmod: now,
        changefreq: p.changefreq,
        priority: p.priority,
      }))
    )
  );
});

router.get('/sitemap-landings.xml', async (req, res) => {
  const siteUrl = siteBase();
  const now = new Date().toISOString();
  const index = buildLandingIndex();

  try {
    const { rows } = await pool.query(
      `SELECT game, MAX(updated_at) AS lastmod, COUNT(*)::int AS cnt
       FROM listings
       WHERE status = 'active' AND game IS NOT NULL AND BTRIM(game) <> ''
       GROUP BY game`
    );

    const lastmodBySlug = new Map();
    const countBySlug = new Map();
    for (const row of rows) {
      const landing = matchLanding(row.game, index);
      if (!landing) continue;
      const prevMod = lastmodBySlug.get(landing.slug);
      const mod = new Date(row.lastmod).toISOString();
      if (!prevMod || mod > prevMod) lastmodBySlug.set(landing.slug, mod);
      countBySlug.set(landing.slug, (countBySlug.get(landing.slug) || 0) + Number(row.cnt || 0));
    }

    const urls = gameLandings.map((g) => {
      const section = g.section || (g.kind === 'app' ? 'apps' : 'games');
      const cnt = countBySlug.get(g.slug) || 0;
      return {
        loc: `${siteUrl}/${section}/${g.slug}`,
        lastmod: lastmodBySlug.get(g.slug) || now,
        changefreq: 'daily',
        priority: cnt > 0 ? '0.85' : '0.7',
      };
    });

    sendXml(res, urlsetXml(urls));
  } catch (err) {
    sendXml(res, urlsetXml([]));
  }
});

router.get('/sitemap-offers.xml', async (req, res) => {
  const siteUrl = siteBase();
  const index = buildLandingIndex();

  try {
    const { rows } = await pool.query(
      `SELECT game, listing_type, MAX(updated_at) AS lastmod, COUNT(*)::int AS cnt
       FROM listings
       WHERE status = 'active'
         AND game IS NOT NULL AND BTRIM(game) <> ''
         AND listing_type IS NOT NULL AND BTRIM(listing_type) <> ''
       GROUP BY game, listing_type`
    );

    const urls = [];
    for (const row of rows) {
      if (!row.cnt) continue;
      const landing = matchLanding(row.game, index);
      const offerPath = OFFER_PATH_BY_TYPE[row.listing_type];
      if (!landing || !offerPath) continue;
      urls.push({
        loc: `${siteUrl}/${landing.section}/${landing.slug}/${offerPath}`,
        lastmod: new Date(row.lastmod).toISOString(),
        changefreq: 'daily',
        priority: '0.8',
      });
    }

    // Dedupe identical locs (multiple game strings mapping to one landing)
    const seen = new Set();
    const unique = [];
    for (const u of urls) {
      if (seen.has(u.loc)) continue;
      seen.add(u.loc);
      unique.push(u);
    }

    sendXml(res, urlsetXml(unique));
  } catch (err) {
    sendXml(res, urlsetXml([]));
  }
});

router.get('/sitemap-listings.xml', async (req, res) => {
  const siteUrl = siteBase();
  try {
    const { rows } = await pool.query(
      `SELECT id, updated_at, created_at
       FROM listings
       WHERE status = 'active'
       ORDER BY updated_at DESC
       LIMIT $1`,
      [LISTINGS_SITEMAP_LIMIT]
    );
    sendXml(
      res,
      urlsetXml(
        rows.map((row) => ({
          loc: `${siteUrl}/listings/${row.id}`,
          lastmod: new Date(row.updated_at || row.created_at).toISOString(),
          changefreq: 'daily',
          priority: '0.7',
        }))
      )
    );
  } catch (err) {
    sendXml(res, urlsetXml([]));
  }
});

router.get('/sitemap-sellers.xml', async (req, res) => {
  const siteUrl = siteBase();
  try {
    const { rows } = await pool.query(
      `SELECT u.username, MAX(l.updated_at) AS lastmod
       FROM users u
       JOIN listings l ON l.seller_id = u.id AND l.status = 'active'
       WHERE COALESCE(u.is_banned, FALSE) = FALSE
       GROUP BY u.username
       ORDER BY MAX(l.updated_at) DESC
       LIMIT $1`,
      [SELLERS_SITEMAP_LIMIT]
    );
    sendXml(
      res,
      urlsetXml(
        rows.map((row) => ({
          loc: `${siteUrl}/users/${encodeURIComponent(row.username)}`,
          lastmod: new Date(row.lastmod).toISOString(),
          changefreq: 'daily',
          priority: '0.55',
        }))
      )
    );
  } catch (err) {
    sendXml(res, urlsetXml([]));
  }
});

module.exports = router;
