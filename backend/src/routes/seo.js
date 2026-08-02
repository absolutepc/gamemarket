const router = require('express').Router();
const pool = require('../config/database');
const gameLandings = require('../data/gameLandings.json');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.get('/sitemap.xml', async (req, res) => {
  const siteUrl = (process.env.FRONTEND_URL || 'https://lootz.ru').replace(/\/$/, '');

  try {
    const { rows } = await pool.query(
      `SELECT id, updated_at, created_at
       FROM listings
       WHERE status = 'active'
       ORDER BY updated_at DESC
       LIMIT 5000`
    );

    const staticPages = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/catalog', changefreq: 'hourly', priority: '0.9' },
      { path: '/apps', changefreq: 'daily', priority: '0.85' },
      { path: '/rules', changefreq: 'monthly', priority: '0.6' },
      { path: '/faq', changefreq: 'monthly', priority: '0.6' },
      { path: '/support', changefreq: 'monthly', priority: '0.6' },
      { path: '/terms-of-sale', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
      { path: '/user-agreement', changefreq: 'monthly', priority: '0.5' },
    ];

    const now = new Date().toISOString();
    const urls = [
      ...staticPages.map((p) => ({
        loc: `${siteUrl}${p.path || '/'}`,
        lastmod: now,
        changefreq: p.changefreq,
        priority: p.priority,
      })),
      ...gameLandings.map((g) => ({
        loc: `${siteUrl}/${g.section || (g.kind === 'app' ? 'apps' : 'games')}/${g.slug}`,
        lastmod: now,
        changefreq: 'daily',
        priority: '0.8',
      })),
      ...rows.map((row) => ({
        loc: `${siteUrl}/listings/${row.id}`,
        lastmod: new Date(row.updated_at || row.created_at).toISOString(),
        changefreq: 'daily',
        priority: '0.7',
      })),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
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

    res.type('application/xml').send(body);
  } catch (err) {
    res.status(500).type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
});

module.exports = router;
