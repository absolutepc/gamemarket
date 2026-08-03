const router = require('express').Router();
const { getPlatformStats } = require('../services/founders');
const { apiLimiter } = require('../middleware/security');
const pool = require('../config/database');

router.get('/platform', apiLimiter, async (req, res) => {
  const stats = await getPlatformStats(pool);
  res.json(stats);
});

module.exports = router;
