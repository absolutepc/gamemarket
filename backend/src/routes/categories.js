const router = require('express').Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, COUNT(l.id) AS listings_count
     FROM categories c
     LEFT JOIN listings l ON l.category_id = c.id AND l.status='active'
     WHERE c.parent_id IS NULL
     GROUP BY c.id
     ORDER BY c.sort_order`
  );
  res.json(rows);
});

module.exports = router;
