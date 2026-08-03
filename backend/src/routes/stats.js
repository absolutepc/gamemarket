const router = require('express').Router();
const { getPlatformStats } = require('../services/founders');
const { apiLimiter } = require('../middleware/security');
const pool = require('../config/database');

router.get('/platform', apiLimiter, async (req, res) => {
  try {
    const stats = await getPlatformStats(pool);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Не удалось загрузить статистику',
      buyers_count: 0,
      sellers_count: 0,
      users_total: 0,
      founders: {
        joined: 0,
        limit: 100,
        remaining: 100,
        open: true,
        pending_applications: 0,
      },
    });
  }
});

module.exports = router;
