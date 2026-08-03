const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/security');
const { releaseEscrow, refundEscrow } = require('../services/escrow');
const {
  listFoundersApplications,
  listFoundingSellers,
  approveFoundersApplication,
  rejectFoundersApplication,
  revokeFoundingSeller,
  getPlatformStats,
} = require('../services/founders');

function normalizeAssortmentKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

router.use(authenticate(), requireRole('admin'));

/** Hidden assortment items with metadata for admin UI */
router.get('/assortment/hidden', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT h.item_key, h.name, h.note, h.created_at, u.username AS hidden_by_username
     FROM assortment_hidden h
     LEFT JOIN users u ON u.id = h.hidden_by
     ORDER BY h.created_at DESC`
  );
  res.json(rows);
});

router.post(
  '/assortment/hide',
  [
    body('name').trim().isLength({ min: 1, max: 200 }),
    body('note').optional({ nullable: true }).trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    const name = String(req.body.name).trim();
    const itemKey = normalizeAssortmentKey(name);
    if (!itemKey) return res.status(400).json({ error: 'Invalid name' });
    const note = req.body.note ? String(req.body.note).trim() : null;

    const { rows } = await pool.query(
      `INSERT INTO assortment_hidden (item_key, name, hidden_by, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (item_key) DO UPDATE
         SET name = EXCLUDED.name,
             note = COALESCE(EXCLUDED.note, assortment_hidden.note),
             hidden_by = EXCLUDED.hidden_by,
             created_at = NOW()
       RETURNING item_key, name, note, created_at`,
      [itemKey, name, req.user.id, note]
    );
    res.json({ message: 'Hidden', item: rows[0] });
  }
);

router.post(
  '/assortment/unhide',
  [body('name').trim().isLength({ min: 1, max: 200 })],
  validate,
  async (req, res) => {
    const name = String(req.body.name).trim();
    const itemKey = normalizeAssortmentKey(name);
    if (!itemKey) return res.status(400).json({ error: 'Invalid name' });

    const { rowCount } = await pool.query(
      `DELETE FROM assortment_hidden WHERE item_key=$1`,
      [itemKey]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not hidden' });
    res.json({ message: 'Restored', key: itemKey });
  }
);


router.get('/disputes', async (req, res) => {
  const { status = 'open' } = req.query;
  const params = [];
  let where = '';
  if (status && status !== 'all') {
    params.push(status);
    where = `WHERE d.status=$${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT d.*,
            t.amount, t.seller_receives, t.status AS transaction_status, t.id AS tx_id,
            l.title AS listing_title,
            bu.username AS buyer_username,
            su.username AS seller_username,
            ou.username AS opened_by_username
     FROM disputes d
     JOIN transactions t ON t.id = d.transaction_id
     JOIN listings l ON l.id = t.listing_id
     JOIN users bu ON bu.id = t.buyer_id
     JOIN users su ON su.id = t.seller_id
     JOIN users ou ON ou.id = d.opened_by
     ${where}
     ORDER BY d.created_at DESC
     LIMIT 100`,
    params
  );
  res.json(rows);
});

router.post('/disputes/:id/resolve',
  [
    body('winner').isIn(['buyer', 'seller']),
    body('resolution').trim().isLength({ min: 10, max: 2000 }),
  ],
  validate,
  async (req, res) => {
    const { winner, resolution } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: disputeRows } = await client.query(
        `SELECT d.* FROM disputes d WHERE d.id=$1 FOR UPDATE`,
        [req.params.id]
      );
      const dispute = disputeRows[0];
      if (!dispute) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Dispute not found' });
      }
      if (dispute.status !== 'open') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Dispute already resolved' });
      }

      const { rows: txRows } = await client.query(
        `SELECT * FROM transactions WHERE id=$1 FOR UPDATE`,
        [dispute.transaction_id]
      );
      const tx = txRows[0];
      if (!tx || tx.status !== 'disputed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Transaction is not in disputed status' });
      }

      if (winner === 'seller') {
        await releaseEscrow(client, tx, {
          systemMessage: `Спор решён в пользу продавца. ${resolution}`,
        });
      } else {
        await refundEscrow(client, tx, {
          reason: `Dispute resolved for buyer: ${resolution}`,
          systemMessage: `Спор решён в пользу покупателя. Средства возвращены. ${resolution}`,
        });
        // Mark as refunded via cancel status; also notify seller
        await client.query(
          `INSERT INTO notifications (user_id, type, title, body, data)
           VALUES ($1,'dispute_resolved','Спор решён','Решение в пользу покупателя. Средства возвращены.',$2)`,
          [tx.seller_id, JSON.stringify({ transaction_id: tx.id, dispute_id: dispute.id })]
        );
      }

      await client.query(
        `UPDATE disputes SET status='resolved', resolution=$2, resolved_by=$3,
         resolved_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [dispute.id, resolution, req.user.id]
      );

      const notifyWinner = winner === 'seller' ? tx.seller_id : tx.buyer_id;
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,'dispute_resolved','Спор решён',$2,$3)`,
        [
          notifyWinner,
          winner === 'seller'
            ? 'Спор решён в вашу пользу. Средства зачислены.'
            : 'Спор решён в вашу пользу. Средства возвращены.',
          JSON.stringify({ transaction_id: tx.id, dispute_id: dispute.id }),
        ]
      );

      await client.query('COMMIT');
      res.json({ message: 'Dispute resolved', winner });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

/** Founders applications queue */
router.get('/founders/applications', async (req, res) => {
  const status = req.query.status || 'pending';
  const [applications, stats] = await Promise.all([
    listFoundersApplications(pool, { status, limit: req.query.limit }),
    getPlatformStats(pool),
  ]);
  res.json({ applications, founders: stats.founders });
});

router.post(
  '/founders/applications/:id/approve',
  [
    body('admin_note').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    const result = await approveFoundersApplication(pool, req.params.id, req.user, {
      adminNote: req.body.admin_note,
    });
    if (!result.ok) {
      return res.status(result.code === 'NOT_FOUND' ? 404 : 400).json({
        error: result.error,
        code: result.code,
      });
    }
    res.json(result);
  }
);

router.post(
  '/founders/applications/:id/reject',
  [
    body('admin_note').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    const result = await rejectFoundersApplication(pool, req.params.id, req.user, {
      adminNote: req.body.admin_note,
    });
    if (!result.ok) {
      return res.status(404).json({ error: result.error, code: result.code });
    }
    res.json(result);
  }
);

/** Current Founding Sellers */
router.get('/founders/members', async (req, res) => {
  const [members, stats] = await Promise.all([
    listFoundingSellers(pool, { limit: req.query.limit }),
    getPlatformStats(pool),
  ]);
  res.json({ members, founders: stats.founders });
});

router.post(
  '/founders/members/:userId/revoke',
  [
    body('admin_note').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    const result = await revokeFoundingSeller(pool, req.params.userId, req.user, {
      adminNote: req.body.admin_note,
    });
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ error: result.error, code: result.code });
    }
    res.json(result);
  }
);

/** Audience totals + online (admin dashboard) */
router.get('/stats', async (req, res) => {
  try {
    const { getAdminAudienceStats } = require('../services/adminStats');
    const stats = await getAdminAudienceStats(pool, {
      onlineMinutes: req.query.online_minutes,
    });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

module.exports = router;
