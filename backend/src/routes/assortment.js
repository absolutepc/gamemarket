const router = require('express').Router();
const pool = require('../config/database');

/** Public: list of hidden assortment keys (normalized names). */
router.get('/hidden', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT item_key, name FROM assortment_hidden ORDER BY name ASC`
  );
  res.json({
    keys: rows.map((r) => r.item_key),
    items: rows.map((r) => ({ key: r.item_key, name: r.name })),
  });
});

/**
 * Popular games/services by active listings + completed sales.
 * Used to order the home carousel after the pinned block.
 */
router.get('/popular', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         l.game AS name,
         COUNT(*)::int AS listings,
         COALESCE(SUM(l.views_count), 0)::int AS views,
         COUNT(t.id) FILTER (
           WHERE t.status IN ('completed', 'released', 'awaiting_confirmation')
         )::int AS sales
       FROM listings l
       LEFT JOIN transactions t ON t.listing_id = l.id
       WHERE l.game IS NOT NULL
         AND btrim(l.game) <> ''
         AND l.status IN ('active', 'reserved', 'sold')
       GROUP BY l.game
       HAVING COUNT(*) > 0
       ORDER BY sales DESC, listings DESC, views DESC, l.game ASC
       LIMIT 200`
    );
    res.json({
      names: rows.map((r) => r.name),
      items: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, names: [], items: [] });
  }
});

module.exports = router;
