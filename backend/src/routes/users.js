const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');

router.get('/me/wallet-history', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM wallet_transactions WHERE user_id=$1
     ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
});

router.get('/me/listings', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, c.name AS category_name, c.slug AS category_slug
     FROM listings l
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE l.seller_id=$1 AND l.status != 'deleted'
     ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

router.put('/me/profile',
  authenticate(),
  [
    body('bio').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('avatar_url').optional({ nullable: true }).custom((v) => {
      if (v === null || v === '' || v === undefined) return true;
      try {
        const u = new URL(v);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    }),
  ],
  validate,
  async (req, res) => {
    const bio = req.body.bio !== undefined ? (req.body.bio || null) : undefined;
    const avatarUrl = req.body.avatar_url !== undefined
      ? (req.body.avatar_url || null)
      : undefined;

    const fields = [];
    const values = [];
    let i = 1;
    if (bio !== undefined) {
      fields.push(`bio=$${i++}`);
      values.push(bio);
    }
    if (avatarUrl !== undefined) {
      fields.push(`avatar_url=$${i++}`);
      values.push(avatarUrl);
    }
    if (!fields.length) {
      return res.json({
        id: req.user.id,
        username: req.user.username,
        bio: req.user.bio,
        avatar_url: req.user.avatar_url,
      });
    }
    fields.push('updated_at=NOW()');
    values.push(req.user.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id=$${i}
       RETURNING id, username, bio, avatar_url, auth_provider`,
      values
    );
    res.json(rows[0]);
  }
);

router.post('/me/deposit',
  authenticate(),
  strictLimiter,
  [body('amount').isFloat({ min: 100, max: 100000 })],
  validate,
  async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const { rows } = await pool.query(
      `UPDATE users SET balance = balance + $1 WHERE id=$2 RETURNING balance, frozen_balance`,
      [amount, req.user.id]
    );
    await pool.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
       VALUES ($1,'deposit',$2,$3,'Balance deposit')`,
      [req.user.id, amount, rows[0].balance]
    );
    res.json({ balance: rows[0].balance, frozen_balance: rows[0].frozen_balance });
  }
);

router.post('/me/withdraw',
  authenticate(),
  strictLimiter,
  [
    body('amount').isFloat({ min: 100, max: 100000 }),
    body('method').isIn(['card', 'sbp', 'crypto']),
    body('details').trim().isLength({ min: 4, max: 200 }),
  ],
  validate,
  async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const { method, details } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'SELECT balance FROM users WHERE id=$1 FOR UPDATE',
        [req.user.id]
      );
      if (parseFloat(rows[0].balance) < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      const { rows: updated } = await client.query(
        `UPDATE users SET balance = balance - $1 WHERE id=$2
         RETURNING balance, frozen_balance`,
        [amount, req.user.id]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
         VALUES ($1,'withdrawal',$2,$3,$4)`,
        [req.user.id, -amount, updated[0].balance, `Withdrawal via ${method}: ${details}`]
      );
      await client.query('COMMIT');
      res.json({
        balance: updated[0].balance,
        frozen_balance: updated[0].frozen_balance,
        message: 'Withdrawal requested',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.get('/me/notifications', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id=$1
     ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/me/notifications/read-all', authenticate(), async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'All notifications marked as read' });
});

router.post('/reviews',
  authenticate(),
  strictLimiter,
  [
    body('transaction_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    const { transaction_id, rating, comment } = req.body;
    const { rows: txRows } = await pool.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='completed'",
      [transaction_id]
    );
    const tx = txRows[0];
    if (!tx) return res.status(404).json({ error: 'Transaction not found or not completed' });
    if (tx.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only buyer can leave review' });

    const reviewed_id = tx.seller_id;
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE transaction_id=$1 AND reviewer_id=$2',
      [transaction_id, req.user.id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Review already submitted' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO reviews (transaction_id, reviewer_id, reviewed_id, rating, comment) VALUES ($1,$2,$3,$4,$5)',
        [transaction_id, req.user.id, reviewed_id, rating, comment || null]
      );
      await client.query(
        `UPDATE users SET
           rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewed_id=$1),
           reviews_count = reviews_count + 1
         WHERE id=$1`,
        [reviewed_id]
      );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Review submitted' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.get('/:username', apiLimiter, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, username, avatar_url, bio, rating, reviews_count, sales_count,
            COALESCE(purchases_count, 0) AS purchases_count, created_at, is_verified
     FROM users WHERE username=$1 AND is_banned=FALSE`,
    [req.params.username]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  const user = rows[0];

  const [listingsRes, reviewsRes, dealsRes] = await Promise.all([
    pool.query(
      `SELECT id, title, price, original_price, discount_percent, currency, images,
              listing_type, game, delivery_method, status, created_at, views_count
       FROM listings WHERE seller_id=$1 AND status='active'
       ORDER BY created_at DESC LIMIT 24`,
      [user.id]
    ),
    pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.username AS reviewer_username, u.avatar_url AS reviewer_avatar
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewed_id=$1
       ORDER BY r.created_at DESC LIMIT 20`,
      [user.id]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS deals_count
       FROM transactions
       WHERE (buyer_id=$1 OR seller_id=$1) AND status='completed'`,
      [user.id]
    ),
  ]);

  res.json({
    ...user,
    rating: parseFloat(user.rating) || 0,
    reviews_count: user.reviews_count || 0,
    sales_count: user.sales_count || 0,
    purchases_count: user.purchases_count || 0,
    deals_count: dealsRes.rows[0].deals_count || 0,
    listings: listingsRes.rows,
    reviews: reviewsRes.rows,
  });
});

router.post('/reviews',
  authenticate(),
  strictLimiter,
  [
    body('transaction_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    const { transaction_id, rating, comment } = req.body;
    const { rows: txRows } = await pool.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='completed'",
      [transaction_id]
    );
    const tx = txRows[0];
    if (!tx) return res.status(404).json({ error: 'Transaction not found or not completed' });
    if (tx.buyer_id !== req.user.id) return res.status(403).json({ error: 'Only buyer can leave review' });

    const reviewed_id = tx.seller_id;
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE transaction_id=$1 AND reviewer_id=$2',
      [transaction_id, req.user.id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Review already submitted' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO reviews (transaction_id, reviewer_id, reviewed_id, rating, comment) VALUES ($1,$2,$3,$4,$5)',
        [transaction_id, req.user.id, reviewed_id, rating, comment || null]
      );
      await client.query(
        `UPDATE users SET
           rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewed_id=$1),
           reviews_count = reviews_count + 1
         WHERE id=$1`,
        [reviewed_id]
      );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Review submitted' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.post('/:id/ban', authenticate(), requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE users SET is_banned=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'User banned' });
});

module.exports = router;
