const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { strictLimiter, validate } = require('../middleware/security');
const {
  PLATFORM_FEE_PERCENT,
  BUYER_CONFIRM_DAYS,
  SELLER_OFFLINE_CANCEL_HOURS,
  releaseEscrow,
  refundEscrow,
  canBuyerCancel,
} = require('../services/escrow');

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
      if (String(listing.seller_id) === String(req.user.id)) {
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

      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id=$2',
        [price, req.user.id]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
         SELECT $1, 'escrow_hold', $2, balance, 'Purchase escrow hold', $3 FROM users WHERE id=$1`,
        [req.user.id, -price, listing_id]
      );

      await client.query(
        'UPDATE users SET frozen_balance = frozen_balance + $1 WHERE id=$2',
        [sellerReceives, listing.seller_id]
      );

      const { rows } = await client.query(
        `INSERT INTO transactions
           (listing_id, buyer_id, seller_id, amount, platform_fee, seller_receives, status)
         VALUES ($1,$2,$3,$4,$5,$6,'awaiting_delivery')
         RETURNING *`,
        [listing_id, req.user.id, listing.seller_id, price, fee, sellerReceives]
      );

      await client.query(
        `INSERT INTO messages (transaction_id, sender_id, content, is_system)
         VALUES ($1,$2,$3, TRUE)`,
        [
          rows[0].id,
          req.user.id,
          `Сделка создана. Продавец должен передать товар. Отмена возможна, если продавец не появится в сети ${SELLER_OFFLINE_CANCEL_HOURS} ч.`,
        ]
      );

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

router.get('/:id', authenticate(), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, l.title AS listing_title, l.description AS listing_description,
            l.images AS listing_images, l.delivery_method,
            bu.username AS buyer_username, bu.avatar_url AS buyer_avatar,
            su.username AS seller_username, su.avatar_url AS seller_avatar,
            su.last_seen_at AS seller_last_seen_at
     FROM transactions t
     JOIN listings l ON l.id = t.listing_id
     JOIN users bu ON bu.id = t.buyer_id
     JOIN users su ON su.id = t.seller_id
     WHERE t.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const tx = rows[0];
  if (
    String(tx.buyer_id) !== String(req.user.id)
    && String(tx.seller_id) !== String(req.user.id)
    && req.user.role !== 'admin'
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const cancelInfo = canBuyerCancel(tx, tx.seller_last_seen_at);
  const [{ rows: msgs }, { rows: reviewRows }, { rows: disputeRows }] = await Promise.all([
    pool.query(
      `SELECT m.*, u.username AS sender_username, u.avatar_url AS sender_avatar
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.transaction_id=$1 ORDER BY m.created_at ASC`,
      [req.params.id]
    ),
    pool.query(
      'SELECT id, rating, comment, created_at FROM reviews WHERE transaction_id=$1 LIMIT 1',
      [req.params.id]
    ),
    pool.query(
      `SELECT d.*, u.username AS opened_by_username
       FROM disputes d JOIN users u ON u.id = d.opened_by
       WHERE d.transaction_id=$1
       ORDER BY d.created_at DESC LIMIT 1`,
      [req.params.id]
    ),
  ]);

  res.json({
    ...tx,
    messages: msgs,
    has_review: reviewRows.length > 0,
    review: reviewRows[0] || null,
    dispute: disputeRows[0] || null,
    can_cancel: cancelInfo.allowed && String(tx.buyer_id) === String(req.user.id),
    cancel_info: cancelInfo,
    confirm_deadline_at: tx.auto_release_at || null,
    buyer_confirm_days: BUYER_CONFIRM_DAYS,
    seller_offline_cancel_hours: SELLER_OFFLINE_CANCEL_HOURS,
  });
});

// Seller marks delivered → buyer has 7 days to confirm
router.post('/:id/deliver', authenticate(), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT * FROM transactions WHERE id=$1 AND status='awaiting_delivery' FOR UPDATE",
      [req.params.id]
    );
    const tx = rows[0];
    if (!tx) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found or wrong status' });
    }
    if (String(tx.seller_id) !== String(req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const autoRelease = new Date(Date.now() + BUYER_CONFIRM_DAYS * 86400000);
    const { delivery_data } = req.body;
    await client.query(
      `UPDATE transactions SET status='awaiting_confirmation', seller_delivered_at=NOW(),
       delivery_data=$2, auto_release_at=$3, updated_at=NOW() WHERE id=$1`,
      [req.params.id, JSON.stringify(delivery_data || {}), autoRelease]
    );
    await client.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,$3, TRUE)`,
      [
        req.params.id,
        req.user.id,
        `Продавец передал товар. Покупатель должен подтвердить получение в течение ${BUYER_CONFIRM_DAYS} дней, иначе средства уйдут продавцу автоматически.`,
      ]
    );
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'delivery','Товар отправлен',$2,$3)`,
      [
        tx.buyer_id,
        `Подтвердите получение в течение ${BUYER_CONFIRM_DAYS} дней`,
        JSON.stringify({ transaction_id: req.params.id }),
      ]
    );
    await client.query('COMMIT');
    res.json({ message: 'Marked as delivered', auto_release_at: autoRelease });
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
    if (!tx) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found or wrong status' });
    }
    if (String(tx.buyer_id) !== String(req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only buyer can confirm receipt' });
    }

    await releaseEscrow(client, tx, {
      systemMessage: 'Покупатель подтвердил получение. Сделка завершена!',
    });
    await client.query('COMMIT');
    res.json({ message: 'Transaction completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

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
    if (String(tx.buyer_id) !== String(req.user.id) && String(tx.seller_id) !== String(req.user.id)) {
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
    await pool.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,'Открыт спор. Ожидается решение администрации.', TRUE)`,
      [req.params.id, req.user.id]
    );
    res.status(201).json(rows[0]);
  }
);

// Cancel: buyer only if seller offline 24h since deal creation
router.post('/:id/cancel', authenticate(), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT t.*, u.last_seen_at AS seller_last_seen_at
       FROM transactions t
       JOIN users u ON u.id = t.seller_id
       WHERE t.id=$1 AND t.status='awaiting_delivery'
       FOR UPDATE OF t`,
      [req.params.id]
    );
    const tx = rows[0];
    if (!tx) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cannot cancel at this stage' });
    }
    const isBuyer = String(tx.buyer_id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isAdmin) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!isAdmin) {
      const info = canBuyerCancel(tx, tx.seller_last_seen_at);
      if (!info.allowed) {
        await client.query('ROLLBACK');
        const messages = {
          wait_24h: `Отмена доступна через ${SELLER_OFFLINE_CANCEL_HOURS} ч, если продавец не появится в сети`,
          seller_was_online: 'Отмена недоступна: продавец появлялся в сети после оформления сделки. Откройте спор.',
          wrong_status: 'Отмена на этом этапе невозможна',
        };
        return res.status(400).json({
          error: messages[info.reason] || 'Отмена недоступна',
          cancel_info: info,
        });
      }
    }

    await refundEscrow(client, tx, {
      reason: req.body.reason || (isAdmin ? 'Cancelled by admin' : 'Cancelled by buyer (seller offline 24h)'),
      systemMessage: isAdmin
        ? 'Сделка отменена администратором. Средства возвращены покупателю.'
        : 'Сделка отменена: продавец не появлялся в сети 24 часа. Средства возвращены покупателю.',
    });
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
