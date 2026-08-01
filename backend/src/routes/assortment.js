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

module.exports = router;
