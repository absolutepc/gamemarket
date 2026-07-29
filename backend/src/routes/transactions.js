const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { strictLimiter, validate } = require('../middleware/security');

const PLATFORM_FEE_PERCENT = 0.075; // 7.5%
const AUTO_RELEASE_HOURS = 72;

// Create transaction (buy listing)
router.post('/',
  authenticate(),
  strictLimiter,
  [body('listing_id').isUUID()],
  validate,
  async (req, res) => {
    const { listing_id } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: listings } = await client.query(
        "SELECT * FROM listings WHERE id=$1 AND status='active' FOR UPDATE",
        [listing_id]
      );
      const listing = listings[0];
      if (!listing) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Listing not found or unavailable' });
      }
      if (listing.seller_id === req.user.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot buy your own listing' });
      }

      const buyerBalance = parseFloat(req.user.balance);
      const price = parseFloat(listing.price);
      if (buyerBalance < price) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const fee = parseFloat((price * PLATFORM_FEE_PERCENT).toFixed(2));
      const sellerReceives = parseFloat((price - fee).toFixed(2));
      const autoRelease = new Date(Date.now() + AUTO_RELEASE_HOURS * 3600000);

      // Deduct from buyer
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id=$2',
        [price, req.user.id]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
         SELECT $1, 'escrow_hold', $2, balance, 'Purchase escrow hold', $3 FROM users WHERE id=$1`,
        [req.user.id, -price, listing_id]
      );

      // Freeze seller's future payout
      await client.query(
        'UPDATE users SET frozen_balance = frozen_balance + $1 WHERE id=$2',
        [sellerReceives, listing.seller_id]
      );

      // Mark listing as sold
      await client.query(
        "UPDATE listings SET status='sold' WHERE id=$1",
        [listing_id]
      );

      const { rows } = await client.query(
        `INSERT INTO transactions
           (listing_id, buyer_id, seller_id, amount, platform_fee, seller_receives, status, auto_release_at)
         VALUES ($1,$2,$3,$4,$5,$6,'awaiting_delivery',$7)
         RETURNING *`,
        [listing_id, req.user.id, listing.seller_id, price, fee, sellerReceives, autoRelease]
      );

      // System message
      await client.query(
        `INSERT INTO messages (transaction_id, sender_id, content, is_system)
         VALUES ($1,$2,'Сделка создана. Продавец должен передать товар.', TRUE)`,
        [rows[0].id, req.user.id]
      );

      // Notify seller
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,'new_sale','Новая продажа!',$2,$3)`,
        [listing.seller_id, `Ваш лот "${listing.title}" куплен`, JSON.stringify({ transaction_id: rows[0].id })]
      );

      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

// Get my transactions
router.get('/my', authenticate(), async (req, res) => {
  const { role = 'buyer', page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * 20;
  const field = role === 'seller' ? 'seller_id' : 'buyer_id';
  const { rows } = await pool.query(
    `SELECT t.*, l.title AS listing_title, l.images AS listing_images,
            bu.username AS buyer_username, su.username AS seller_username
     FROM transactions t
     JOIN listings l ON l.id = t.listing_id
     JOIN users bu ON bu.id = t.buyer_id
     JOIN users su ON su.id = t.seller_id
     WHERE t.${field} = $1
     ORDER BY t.created_at DESC
     LIMIT 20 OFFSET $2`,
    [req.user.id, offset]
  );
  res.json(rows);
});

// Get single transaction
router.get('/:id', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, l.title AS listing_title, l.description AS listing_description,
            l.images AS listing_images, l.delivery_method,
            bu.username AS buyer_username, bu.avatar_url AS buyer_avatar,
            su.username AS seller_username, su.avatar_url AS seller_avatar
     FROM transactions t
     JOIN listings l ON l.id = t.listing_id
     JOIN users bu ON bu.id = t.buyer_id
     JOIN users su ON su.id = t.seller_id
     WHERE t.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const tx = rows[0];
  if (tx.buyer_id !== req.user.id && tx.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { rows: msgs } = await pool.query(
    `SELECT m.*, u.username AS sender_username, u.avatar_url AS sender_avatar
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.transaction_id=$1 ORDER BY m.created_at ASC`,
    [req.params.id]
  );
  res.json({ ...tx, messages: msgs });
});

// Seller marks delivered
router.post('/:id/deliver', authenticate(), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='awaiting_delivery' FOR UPDATE",
      [req.params.id]
    );
    const tx = rows[0];
    if (!tx) return res.status(404).json({ error: 'Transaction not found or wrong status' });
    if (tx.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { delivery_data } = req.body;
    await client.query(
      `UPDATE transactions SET status='awaiting_confirmation', seller_delivered_at=NOW(),
       delivery_data=$2, updated_at=NOW() WHERE id=$1`,
      [req.params.id, JSON.stringify(delivery_data || {})]
    );
    await client.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,'Продавец передал товар. Подтвердите получение.', TRUE)`,
      [req.params.id, req.user.id]
    );
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'delivery','Товар отправлен','Продавец передал товар. Подтвердите получение.',$2)`,
      [tx.buyer_id, JSON.stringify({ transaction_id: req.params.id })]
    );
    await client.query('COMMIT');
    res.json({ message: 'Marked as delivered' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Buyer confirms receipt -> release escrow
router.post('/:id/confirm', authenticate(), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='awaiting_confirmation' FOR UPDATE",
      [req.params.id]
    );
    const tx = rows[0];
    if (!tx) return res.status(404).json({ error: 'Transaction not found or wrong status' });
    if (tx.buyer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    // Release escrow to seller
    await client.query(
      `UPDATE users SET
         balance = balance + $1,
         frozen_balance = frozen_balance - $1,
         sales_count = sales_count + 1
       WHERE id=$2`,
      [tx.seller_receives, tx.seller_id]
    );
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
       SELECT $1, 'sale_credit', $2, balance, 'Sale proceeds released', $3 FROM users WHERE id=$1`,
      [tx.seller_id, tx.seller_receives, tx.id]
    );
    await client.query(
      `UPDATE transactions SET status='completed', buyer_confirmed_at=NOW(),
       escrow_released_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [req.params.id]
    );
    await client.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,'Покупатель подтвердил получение. Сделка завершена!', TRUE)`,
      [req.params.id, req.user.id]
    );
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'sale_complete','Сделка завершена!','Покупатель подтвердил получение. Средства зачислены на ваш счёт.',$2)`,
      [tx.seller_id, JSON.stringify({ transaction_id: req.params.id })]
    );
    await client.query('COMMIT');
    res.json({ message: 'Transaction completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Open dispute
router.post('/:id/dispute',
  authenticate(),
  [
    body('reason').isIn(['not_received', 'not_as_described', 'fraud', 'other']),
    body('description').trim().isLength({ min: 20, max: 2000 }),
  ],
  validate,
  async (req, res) => {
    const { rows: txRows } = await pool.query(
      "SELECT * FROM transactions WHERE id=$1 AND status IN ('awaiting_delivery','awaiting_confirmation')",
      [req.params.id]
    );
    const tx = txRows[0];
    if (!tx) return res.status(404).json({ error: 'Transaction not eligible for dispute' });
    if (tx.buyer_id !== req.user.id && tx.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { rows } = await pool.query(
      `INSERT INTO disputes (transaction_id, opened_by, reason, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, req.body.reason, req.body.description]
    );
    await pool.query(
      "UPDATE transactions SET status='disputed', updated_at=NOW() WHERE id=$1",
      [req.params.id]
    );
    res.status(201).json(rows[0]);
  }
);

// Cancel transaction
router.post('/:id/cancel', authenticate(), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='awaiting_delivery' FOR UPDATE",
      [req.params.id]
    );
    const tx = rows[0];
    if (!tx) return res.status(404).json({ error: 'Cannot cancel at this stage' });
    if (tx.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Refund buyer
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id=$2',
      [tx.amount, tx.buyer_id]
    );
    await client.query(
      'UPDATE users SET frozen_balance = frozen_balance - $1 WHERE id=$2',
      [tx.seller_receives, tx.seller_id]
    );
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
       SELECT $1, 'refund', $2, balance, 'Transaction cancelled - refund', $3 FROM users WHERE id=$1`,
      [tx.buyer_id, tx.amount, tx.id]
    );
    await client.query(
      "UPDATE listings SET status='active' WHERE id=$1",
      [tx.listing_id]
    );
    await client.query(
      `UPDATE transactions SET status='cancelled', cancelled_at=NOW(),
       cancel_reason=$2, updated_at=NOW() WHERE id=$1`,
      [req.params.id, req.body.reason || 'Cancelled by buyer']
    );
    await client.query('COMMIT');
    res.json({ message: 'Transaction cancelled, funds refunded' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;
