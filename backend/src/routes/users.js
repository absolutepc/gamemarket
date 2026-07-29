const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');

// Get user profile
router.get('/:username', apiLimiter, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, username, avatar_url, bio, rating, reviews_count, sales_count, created_at
     FROM users WHERE username=$1 AND is_banned=FALSE`,
    [req.params.username]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  const user = rows[0];

  const { rows: listings } = await pool.query(
    `SELECT id, title, price, currency, images, listing_type, game, created_at
     FROM listings WHERE seller_id=$1 AND status='active'
     ORDER BY created_at DESC LIMIT 12`,
    [user.id]
  );
  const { rows: reviews } = await pool.query(
    `SELECT r.rating, r.comment, r.created_at, u.username AS reviewer_username, u.avatar_url AS reviewer_avatar
     FROM reviews r JOIN users u ON u.id = r.reviewer_id
     WHERE r.reviewed_id=$1
     ORDER BY r.created_at DESC LIMIT 10`,
    [user.id]
  );

  res.json({ ...user, listings, reviews });
});

// Update profile
router.put('/me/profile',
  authenticate(),
  [
    body('bio').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    const { bio } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET bio=$1, updated_at=NOW() WHERE id=$2 RETURNING id, username, bio, avatar_url',
      [bio || null, req.user.id]
    );
    res.json(rows[0]);
  }
);

// Deposit balance (simplified - in production integrate payment gateway)
router.post('/me/deposit',
  authenticate(),
  strictLimiter,
  [body('amount').isFloat({ min: 100, max: 100000 })],
  validate,
  async (req, res) => {
    const amount = parseFloat(req.body.amount);
    const { rows } = await pool.query(
      `UPDATE users SET balance = balance + $1 WHERE id=$2
       RETURNING balance`,
      [amount, req.user.id]
    );
    await pool.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
       VALUES ($1,'deposit',$2,$3,'Balance deposit')`,
      [req.user.id, amount, rows[0].balance]
    );
    res.json({ balance: rows[0].balance });
  }
);

// Get notifications
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

// Leave review
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

// Admin: ban user
router.post('/:id/ban', authenticate(), requireRole('admin'), async (req, res) => {
  await pool.query('UPDATE users SET is_banned=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'User banned' });
});

module.exports = router;
