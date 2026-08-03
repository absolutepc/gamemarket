/**
 * Platform treasury ledger — accounting for fees, promote revenue, withdrawals.
 * Physical money lives at PSP / bank; this ledger is the internal books.
 */

const ENTRY_TYPES = {
  SALE_FEE: 'sale_fee',
  LISTING_PROMOTE: 'listing_promote',
  ADJUSTMENT: 'adjustment',
  WITHDRAWAL: 'withdrawal',
  WITHDRAWAL_REVERSAL: 'withdrawal_reversal',
};

async function creditPlatform(clientOrPool, {
  entryType,
  amount,
  description,
  referenceId = null,
  referenceType = null,
  meta = null,
  createdBy = null,
} = {}) {
  const amountNum = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  try {
    const { rows } = await clientOrPool.query(
      `INSERT INTO platform_ledger (
         entry_type, direction, amount, description,
         reference_id, reference_type, meta, created_by
       ) VALUES ($1, 'credit', $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (entry_type, reference_id)
         WHERE reference_id IS NOT NULL
             AND entry_type IN ('sale_fee', 'listing_promote')
       DO NOTHING
       RETURNING *`,
      [
        entryType,
        amountNum,
        description || null,
        referenceId,
        referenceType,
        meta ? JSON.stringify(meta) : null,
        createdBy,
      ]
    );
    return rows[0] || null;
  } catch (err) {
    // Partial unique index may be missing on older DBs — try plain insert once
    if (err.code === '42P01' || err.code === '42703') throw err;
    if (err.code === '23505') return null;
    throw err;
  }
}

async function debitPlatform(clientOrPool, {
  entryType,
  amount,
  description,
  referenceId = null,
  referenceType = null,
  meta = null,
  createdBy = null,
} = {}) {
  const amountNum = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  const { rows } = await clientOrPool.query(
    `INSERT INTO platform_ledger (
       entry_type, direction, amount, description,
       reference_id, reference_type, meta, created_by
     ) VALUES ($1, 'debit', $2, $3, $4, $5, $6::jsonb, $7)
     RETURNING *`,
    [
      entryType,
      amountNum,
      description || null,
      referenceId,
      referenceType,
      meta ? JSON.stringify(meta) : null,
      createdBy,
    ]
  );
  return rows[0] || null;
}

async function getPlatformBalance(pool) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0)::float AS credits,
       COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0)::float AS debits,
       COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)::float AS balance
     FROM platform_ledger`
  );
  const r = rows[0] || {};
  return {
    balance: Math.round((r.balance || 0) * 100) / 100,
    credits: Math.round((r.credits || 0) * 100) / 100,
    debits: Math.round((r.debits || 0) * 100) / 100,
  };
}

async function getPlatformBreakdown(pool) {
  const { rows } = await pool.query(
    `SELECT entry_type,
            COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)::float AS net
     FROM platform_ledger
     GROUP BY entry_type
     ORDER BY entry_type`
  );
  const byType = {};
  for (const row of rows) byType[row.entry_type] = Math.round((row.net || 0) * 100) / 100;
  return byType;
}

async function listPlatformLedger(pool, { limit = 50, offset = 0, entryType = null } = {}) {
  const take = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 50));
  const skip = Math.max(0, Number.parseInt(offset, 10) || 0);
  const params = [];
  let where = '';
  if (entryType) {
    params.push(String(entryType));
    where = `WHERE pl.entry_type = $${params.length}`;
  }
  params.push(take);
  params.push(skip);

  const { rows } = await pool.query(
    `SELECT pl.*,
            u.username AS created_by_username
     FROM platform_ledger pl
     LEFT JOIN users u ON u.id = pl.created_by
     ${where}
     ORDER BY pl.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = entryType ? [String(entryType)] : [];
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM platform_ledger pl ${
      entryType ? 'WHERE pl.entry_type = $1' : ''
    }`,
    countParams
  );

  return { items: rows, total: countRows[0]?.n || 0, limit: take, offset: skip };
}

/**
 * One-time-ish backfill from completed deals + promote wallet txs (idempotent).
 */
async function backfillPlatformLedger(pool) {
  let fees = 0;
  let promotes = 0;

  const feeRes = await pool.query(
    `INSERT INTO platform_ledger (
       entry_type, direction, amount, description,
       reference_id, reference_type, meta, created_at
     )
     SELECT
       'sale_fee',
       'credit',
       t.platform_fee,
       'Комиссия со сделки (backfill)',
       t.id,
       'transaction',
       jsonb_build_object('listing_id', t.listing_id, 'backfill', true),
       COALESCE(t.escrow_released_at, t.updated_at, t.created_at)
     FROM transactions t
     WHERE t.status = 'completed'
       AND COALESCE(t.platform_fee, 0) > 0
     ON CONFLICT (entry_type, reference_id)
       WHERE reference_id IS NOT NULL
         AND entry_type IN ('sale_fee', 'listing_promote')
     DO NOTHING`
  );
  fees = feeRes.rowCount || 0;

  const promoRes = await pool.query(
    `INSERT INTO platform_ledger (
       entry_type, direction, amount, description,
       reference_id, reference_type, meta, created_at
     )
     SELECT
       'listing_promote',
       'credit',
       ABS(wt.amount),
       COALESCE(wt.description, 'Продвижение лота (backfill)'),
       wt.id,
       'wallet_transaction',
       jsonb_build_object('listing_id', wt.reference_id, 'backfill', true),
       wt.created_at
     FROM wallet_transactions wt
     WHERE wt.type = 'listing_promote'
       AND ABS(wt.amount) > 0
     ON CONFLICT (entry_type, reference_id)
       WHERE reference_id IS NOT NULL
         AND entry_type IN ('sale_fee', 'listing_promote')
     DO NOTHING`
  );
  promotes = promoRes.rowCount || 0;

  return { fees, promotes };
}

async function listWithdrawals(pool, { limit = 50 } = {}) {
  const take = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const { rows } = await pool.query(
    `SELECT w.*,
            cu.username AS created_by_username,
            pu.username AS processed_by_username
     FROM platform_withdrawals w
     LEFT JOIN users cu ON cu.id = w.created_by
     LEFT JOIN users pu ON pu.id = w.processed_by
     ORDER BY w.created_at DESC
     LIMIT $1`,
    [take]
  );
  return rows;
}

async function createWithdrawalRequest(pool, adminUser, {
  amount,
  method = 'card',
  destination = '',
  note = '',
} = {}) {
  const amountNum = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: 'Укажите сумму', code: 'INVALID_AMOUNT' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bal = await getPlatformBalance(client);
    if (amountNum > bal.balance + 1e-9) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        error: `Недостаточно учтённого баланса (доступно ${bal.balance} ₽)`,
        code: 'INSUFFICIENT',
        balance: bal.balance,
      };
    }

    const { rows } = await client.query(
      `INSERT INTO platform_withdrawals (
         amount, method, destination, note, status, created_by
       ) VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [
        amountNum,
        String(method || 'card').slice(0, 40),
        String(destination || '').trim().slice(0, 500) || null,
        String(note || '').trim().slice(0, 1000) || null,
        adminUser.id,
      ]
    );

    await client.query('COMMIT');
    return { ok: true, withdrawal: rows[0], balance: bal.balance };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function processWithdrawal(pool, withdrawalId, adminUser, { status, adminNote } = {}) {
  if (!['paid', 'cancelled', 'failed'].includes(status)) {
    return { ok: false, error: 'Некорректный статус', code: 'INVALID_STATUS' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM platform_withdrawals WHERE id = $1 FOR UPDATE`,
      [withdrawalId]
    );
    const w = rows[0];
    if (!w) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Заявка не найдена', code: 'NOT_FOUND' };
    }
    if (w.status !== 'pending') {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Заявка уже обработана', code: 'ALREADY_PROCESSED' };
    }

    if (status === 'paid') {
      const bal = await getPlatformBalance(client);
      if (Number(w.amount) > bal.balance + 1e-9) {
        await client.query('ROLLBACK');
        return {
          ok: false,
          error: `Недостаточно баланса для выплаты (доступно ${bal.balance} ₽)`,
          code: 'INSUFFICIENT',
        };
      }
      await debitPlatform(client, {
        entryType: ENTRY_TYPES.WITHDRAWAL,
        amount: w.amount,
        description: `Вывод #${String(w.id).slice(0, 8)} · ${w.method}${
          w.destination ? ` · ${w.destination}` : ''
        }`,
        referenceId: w.id,
        referenceType: 'platform_withdrawal',
        meta: { method: w.method, destination: w.destination },
        createdBy: adminUser.id,
      });
    }

    const { rows: updated } = await client.query(
      `UPDATE platform_withdrawals SET
         status = $2,
         admin_note = COALESCE($3, admin_note),
         processed_by = $4,
         processed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [withdrawalId, status, adminNote || null, adminUser.id]
    );

    await client.query('COMMIT');
    return { ok: true, withdrawal: updated[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function addAdjustment(pool, adminUser, { amount, description }) {
  const amountNum = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(amountNum) || amountNum === 0) {
    return { ok: false, error: 'Укажите ненулевую сумму', code: 'INVALID_AMOUNT' };
  }
  const desc = String(description || '').trim().slice(0, 500);
  if (!desc) {
    return { ok: false, error: 'Нужен комментарий к корректировке', code: 'NOTE_REQUIRED' };
  }

  const entry =
    amountNum > 0
      ? await creditPlatform(pool, {
          entryType: ENTRY_TYPES.ADJUSTMENT,
          amount: amountNum,
          description: desc,
          createdBy: adminUser.id,
        })
      : await debitPlatform(pool, {
          entryType: ENTRY_TYPES.ADJUSTMENT,
          amount: Math.abs(amountNum),
          description: desc,
          createdBy: adminUser.id,
        });

  return { ok: true, entry };
}

module.exports = {
  ENTRY_TYPES,
  creditPlatform,
  debitPlatform,
  getPlatformBalance,
  getPlatformBreakdown,
  listPlatformLedger,
  backfillPlatformLedger,
  listWithdrawals,
  createWithdrawalRequest,
  processWithdrawal,
  addAdjustment,
};
