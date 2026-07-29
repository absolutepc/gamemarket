const router = require('express').Router();
const pool = require('../config/database');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.get('/sitemap.xml', async (req, res) => {
  const siteUrl = (process.env.FRONTEND_URL || 'https://gamemarket-production-92a3.up.railway.app').replace(/\/$/, '');

  try {
    const { rows } = await pool.query(
      `SELECT id, updated_at, created_at
       FROM listings
       WHERE status = 'active'
       ORDER BY updated_at DESC
       LIMIT 5000`
    );

    const staticPages = ['', '/catalog', '/rules', '/faq', '/support'];
    const urls = [
      ...staticPages.map((path, i) => ({
        loc: `${siteUrl}${path || '/'}`,
        lastmod: new Date().toISOString(),
        changefreq: path === '/catalog' ? 'hourly' : path === '' ? 'daily' : 'monthly',
        priority: path === '' ? '1.0' : path === '/catalog' ? '0.9' : '0.6',
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
