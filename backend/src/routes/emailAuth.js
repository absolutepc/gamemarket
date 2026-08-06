const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authLimiter, validate } = require('../middleware/security');
const { issueVerificationCode, verifyCode } = require('../services/emailVerification');

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    account_type: user.account_type || 'buyer',
    account_type_chosen: user.account_type_chosen !== false,
    needs_account_type: user.account_type_chosen === false,
    is_founding_seller: Boolean(user.is_founding_seller),
    founding_seller_number: user.founding_seller_number || null,
    balance: user.balance,
    avatar_url: user.avatar_url,
    rating: user.rating,
    sales_count: user.sales_count,
    auth_provider: user.auth_provider || 'email',
    is_verified: Boolean(user.is_verified),
    email_notifications: user.email_notifications !== false,
  };
}

router.post('/verify-email',
  authenticate(),
  authLimiter,
  [body('code').trim().isLength({ min: 6, max: 6 }).matches(/^\d{6}$/)],
  validate,
  async (req, res) => {
    const result = await verifyCode(req.user.id, req.body.code);
    if (!result.ok) {
      const map = {
        invalid_format: { status: 400, error: 'Введите 6-значный код' },
        no_code: { status: 400, error: 'Код не найден. Запросите новый.' },
        expired: { status: 400, error: 'Код истёк. Запросите новый.' },
        too_many_attempts: { status: 429, error: 'Слишком много попыток. Запросите новый код.' },
        wrong_code: { status: 400, error: 'Неверный код' },
        user_not_found: { status: 404, error: 'Пользователь не найден' },
      };
      const m = map[result.error] || { status: 400, error: 'Не удалось подтвердить email' };
      return res.status(m.status).json({ error: m.error, code: result.error });
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    res.json({ message: 'Email подтверждён', user: publicUser(rows[0] || { ...req.user, is_verified: true }) });
  }
);

router.post('/resend-verification',
  authenticate(),
  authLimiter,
  async (req, res) => {
    if (req.user.is_verified) {
      return res.json({ message: 'Email уже подтверждён', already: true });
    }
    const result = await issueVerificationCode(req.user.id);
    if (!result.ok) {
      if (result.error === 'cooldown') {
        return res.status(429).json({
          error: 'Подождите перед повторной отправкой',
          code: 'cooldown',
          cooldown_ms: result.cooldownMs,
        });
      }
      if (result.error === 'already_verified') {
        return res.json({ message: 'Email уже подтверждён', already: true });
      }
      return res.status(400).json({ error: 'Не удалось отправить код', code: result.error });
    }
    res.json({ message: 'Код отправлен на email', expires_at: result.expiresAt });
  }
);

module.exports = router;
