const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireRole, requireOwner } = require('../middleware/auth');
const { validate } = require('../middleware/security');
const { releaseEscrow, refundEscrow } = require('../services/escrow');
const {
  listFoundersApplications,
  listFoundingSellers,
  approveFoundersApplication,
  rejectFoundersApplication,
  revokeFoundingSeller,
  compactFoundingSellerNumbers,
  getPlatformStats,
} = require('../services/founders');
const { getAdminAudienceStats } = require('../services/adminStats');
const {
  ensureMonthContest,
  startContest,
  getCurrentContest,
  getContestById,
  listContests,
  listContestParticipants,
  getContestPublicStats,
  drawContestWinner,
  updateContest,
  publicContestView,
} = require('../services/contest');
const {
  getPlatformBalance,
  getPlatformBreakdown,
  listPlatformLedger,
  backfillPlatformLedger,
  listWithdrawals,
  createWithdrawalRequest,
  processWithdrawal,
  addAdjustment,
} = require('../services/platformLedger');

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

/** Pack active Founding Seller numbers into 1..N (fill gaps). */
router.post('/founders/renumber', async (_req, res) => {
  try {
    const result = await compactFoundingSellerNumbers(pool);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось перенумеровать Founders' });
  }
});

/** Audience totals + online (admin dashboard) */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAdminAudienceStats(pool, {
      onlineMinutes: req.query.online_minutes,
    });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

/** Monthly contest admin */
router.get('/contests', async (req, res) => {
  try {
    await ensureMonthContest(pool);
    const contests = await listContests(pool, { limit: req.query.limit });
    res.json({
      contests: contests.map((c) => ({
        ...publicContestView(c),
        sellers_draw_snapshot: undefined,
        buyers_draw_snapshot: undefined,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить конкурсы' });
  }
});

/**
 * Idempotent: create/activate contest for current UTC month (or body.month=YYYY-MM).
 * Safe to click every month; if already exists, returns it.
 */
router.post('/contests/start', async (req, res) => {
  try {
    const month = typeof req.body?.month === 'string' ? req.body.month.trim() : undefined;
    const result = await startContest(pool, month || new Date());
    const withNames = await pool.query(
      `SELECT c.*,
              sw.username AS seller_winner_username,
              bw.username AS buyer_winner_username
       FROM contests c
       LEFT JOIN users sw ON sw.id = c.seller_winner_id
       LEFT JOIN users bw ON bw.id = c.buyer_winner_id
       WHERE c.id = $1`,
      [result.contest.id]
    );
    res.json({
      created: result.created,
      already_active: result.already_active,
      slug: result.slug,
      contest: publicContestView(withNames.rows[0] || result.contest),
      message: result.created
        ? `Конкурс ${result.slug} создан`
        : result.already_active
          ? `Конкурс ${result.slug} уже активен`
          : `Конкурс ${result.slug} уже существует`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось запустить конкурс' });
  }
});

router.get('/contests/current', async (_req, res) => {
  try {
    const contest = await getCurrentContest(pool);
    if (!contest) return res.status(404).json({ error: 'Конкурс не найден' });
    const [sellers, buyers, stats] = await Promise.all([
      listContestParticipants(pool, contest, 'sellers'),
      listContestParticipants(pool, contest, 'buyers'),
      getContestPublicStats(pool, contest),
    ]);
    res.json({
      contest: {
        ...publicContestView(contest),
        sellers_draw_snapshot: contest.sellers_draw_snapshot || null,
        buyers_draw_snapshot: contest.buyers_draw_snapshot || null,
      },
      stats,
      sellers,
      buyers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить конкурс' });
  }
});

router.get('/contests/:id', async (req, res) => {
  try {
    const contest = await getContestById(pool, req.params.id);
    if (!contest) return res.status(404).json({ error: 'Конкурс не найден' });
    const [sellers, buyers, stats] = await Promise.all([
      listContestParticipants(pool, contest, 'sellers'),
      listContestParticipants(pool, contest, 'buyers'),
      getContestPublicStats(pool, contest),
    ]);
    const withNames = await pool.query(
      `SELECT c.*,
              sw.username AS seller_winner_username,
              bw.username AS buyer_winner_username
       FROM contests c
       LEFT JOIN users sw ON sw.id = c.seller_winner_id
       LEFT JOIN users bw ON bw.id = c.buyer_winner_id
       WHERE c.id = $1`,
      [contest.id]
    );
    res.json({
      contest: {
        ...publicContestView(withNames.rows[0] || contest),
        sellers_draw_snapshot: contest.sellers_draw_snapshot || null,
        buyers_draw_snapshot: contest.buyers_draw_snapshot || null,
      },
      stats,
      sellers,
      buyers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить конкурс' });
  }
});

router.patch('/contests/:id', async (req, res) => {
  try {
    const updated = await updateContest(pool, req.params.id, {
      title: req.body.title,
      prize_sellers: req.body.prize_sellers,
      prize_buyers: req.body.prize_buyers,
      status: req.body.status,
    });
    if (!updated) return res.status(404).json({ error: 'Конкурс не найден' });
    res.json({ contest: publicContestView(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось обновить конкурс' });
  }
});

router.post('/contests/:id/draw', async (req, res) => {
  try {
    const side = req.body.side === 'buyers' ? 'buyers' : 'sellers';
    const result = await drawContestWinner(pool, req.params.id, side, req.user);
    if (!result.ok) {
      const status =
        result.code === 'NOT_FOUND' ? 404
          : result.code === 'ALREADY_DRAWN' || result.code === 'NO_PARTICIPANTS' ? 400
            : 400;
      return res.status(status).json({ error: result.error, code: result.code });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось провести розыгрыш' });
  }
});

/** Platform finance / treasury ledger — owner only */
router.get('/finance', requireOwner(), async (req, res) => {
  try {
    await backfillPlatformLedger(pool).catch((err) => {
      console.error('platform ledger backfill', err.message);
    });
    const [balance, breakdown, ledger, withdrawals] = await Promise.all([
      getPlatformBalance(pool),
      getPlatformBreakdown(pool),
      listPlatformLedger(pool, {
        limit: req.query.limit,
        offset: req.query.offset,
        entryType: req.query.entry_type || null,
      }),
      listWithdrawals(pool, { limit: 50 }),
    ]);
    res.json({ balance, breakdown, ledger, withdrawals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось загрузить финансы' });
  }
});

router.post(
  '/finance/withdrawals',
  requireOwner(),
  [
    body('amount').isFloat({ gt: 0 }),
    body('method').optional({ nullable: true }).trim().isLength({ max: 40 }),
    body('destination').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('note').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await createWithdrawalRequest(pool, req.user, {
        amount: req.body.amount,
        method: req.body.method,
        destination: req.body.destination,
        note: req.body.note,
      });
      if (!result.ok) {
        return res.status(400).json({ error: result.error, code: result.code, balance: result.balance });
      }
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Не удалось создать заявку на вывод' });
    }
  }
);

router.post(
  '/finance/withdrawals/:id/process',
  requireOwner(),
  [
    body('status').isIn(['paid', 'cancelled', 'failed']),
    body('admin_note').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await processWithdrawal(pool, req.params.id, req.user, {
        status: req.body.status,
        adminNote: req.body.admin_note,
      });
      if (!result.ok) {
        const code = result.code === 'NOT_FOUND' ? 404 : 400;
        return res.status(code).json({ error: result.error, code: result.code });
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Не удалось обработать заявку' });
    }
  }
);

router.post(
  '/finance/adjustments',
  requireOwner(),
  [
    body('amount').isFloat({ gt: -1e12, lt: 1e12 }),
    body('description').trim().isLength({ min: 3, max: 500 }),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await addAdjustment(pool, req.user, {
        amount: req.body.amount,
        description: req.body.description,
      });
      if (!result.ok) {
        return res.status(400).json({ error: result.error, code: result.code });
      }
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Не удалось внести корректировку' });
    }
  }
);

module.exports = router;
