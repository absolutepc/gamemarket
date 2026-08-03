const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');
const {
  getCurrentContest,
  publicContestView,
  getContestPublicStats,
  getMyContestParticipation,
} = require('../services/contest');

router.get('/current', apiLimiter, authenticate(false), async (req, res) => {
  try {
    const contest = await getCurrentContest(pool);
    if (!contest) return res.status(404).json({ error: 'Конкурс не найден' });
    const stats = await getContestPublicStats(pool, contest);
    const me = await getMyContestParticipation(pool, contest, req.user?.id);
    res.json({
      contest: publicContestView(contest),
      stats,
      me,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить конкурс' });
  }
});

module.exports = router;
