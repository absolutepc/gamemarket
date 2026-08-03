const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');
const {
  submitFoundersApplication,
  getMyFoundersApplication,
  getPlatformStats,
} = require('../services/founders');

router.get('/status', apiLimiter, async (_req, res) => {
  try {
    const stats = await getPlatformStats(pool);
    res.json(stats.founders || stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить статус Founders' });
  }
});

router.get('/my-application', authenticate(), apiLimiter, async (req, res) => {
  try {
    const application = await getMyFoundersApplication(pool, req.user.id);
    const stats = await getPlatformStats(pool);
    res.json({
      application,
      founders: stats.founders,
      is_founding_seller: !!req.user.is_founding_seller,
      founding_seller_number: req.user.founding_seller_number || null,
      account_type: req.user.account_type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить заявку' });
  }
});

router.post(
  '/apply',
  authenticate(),
  strictLimiter,
  [
    body('message').optional({ nullable: true }).isString().isLength({ max: 1000 }),
    body('device_fingerprint').optional({ nullable: true }).isString().isLength({ min: 16, max: 128 }),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await submitFoundersApplication(pool, req.user, {
        message: req.body.message,
        fingerprint: req.body.device_fingerprint,
        ip: req.ip,
      });

      if (result.already_pending) {
        return res.json(result);
      }
      if (!result.ok) {
        const statusByCode = {
          ALREADY_FOUNDER: 400,
          SELLER_REQUIRED: 400,
          SOLD_OUT: 409,
          INVALID_EMAIL: 400,
          IDENTITY_USED: 409,
          ALREADY_APPROVED: 400,
        };
        return res.status(statusByCode[result.code] || 400).json({
          error: result.error,
          code: result.code,
        });
      }
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Не удалось подать заявку' });
    }
  }
);

module.exports = router;
