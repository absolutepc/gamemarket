const pool = require('../config/database');
const logger = require('../utils/logger');
const { PLATFORM_FEE_PERCENT } = require('./fees');

const SELLER_OFFLINE_CANCEL_HOURS = 24;
const BUYER_CONFIRM_DAYS = 7;

async function releaseEscrow(client, tx, { systemMessage, notifySeller = true } = {}) {
  await client.query(
    `UPDATE users SET
       balance = balance + $1,
       frozen_balance = GREATEST(frozen_balance - $1, 0),
       sales_count = sales_count + 1
     WHERE id=$2`,
    [tx.seller_receives, tx.seller_id]
  );
  await client.query(
    `UPDATE users SET purchases_count = COALESCE(purchases_count, 0) + 1 WHERE id=$1`,
    [tx.buyer_id]
  );
  await client.query(
    `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
     SELECT $1, 'sale_credit', $2, balance, 'Sale proceeds released', $3 FROM users WHERE id=$1`,
    [tx.seller_id, tx.seller_receives, tx.id]
  );
  await client.query(
    `UPDATE transactions SET status='completed', buyer_confirmed_at=COALESCE(buyer_confirmed_at, NOW()),
     escrow_released_at=NOW(), updated_at=NOW() WHERE id=$1`,
    [tx.id]
  );
  if (systemMessage) {
    await client.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,$3, TRUE)`,
      [tx.id, tx.buyer_id, systemMessage]
    );
  }
  if (notifySeller) {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,'sale_complete','Сделка завершена!','Средства зачислены на ваш счёт.',$2)`,
      [tx.seller_id, JSON.stringify({ transaction_id: tx.id })]
    );
  }
}

async function refundEscrow(client, tx, { reason, systemMessage } = {}) {
  await client.query(
    'UPDATE users SET balance = balance + $1 WHERE id=$2',
    [tx.amount, tx.buyer_id]
  );
  await client.query(
    'UPDATE users SET frozen_balance = GREATEST(frozen_balance - $1, 0) WHERE id=$2',
    [tx.seller_receives, tx.seller_id]
  );
  await client.query(
    `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
     SELECT $1, 'refund', $2, balance, $3, $4 FROM users WHERE id=$1`,
    [tx.buyer_id, tx.amount, reason || 'Refund', tx.id]
  );
  await client.query(
    `UPDATE transactions SET status='cancelled', cancelled_at=NOW(),
     cancel_reason=$2, updated_at=NOW() WHERE id=$1`,
    [tx.id, reason || 'Cancelled']
  );
  if (systemMessage) {
    await client.query(
      `INSERT INTO messages (transaction_id, sender_id, content, is_system)
       VALUES ($1,$2,$3, TRUE)`,
      [tx.id, tx.buyer_id, systemMessage]
    );
  }
}

function canBuyerCancel(tx, sellerLastSeen) {
  if (tx.status !== 'awaiting_delivery') return { allowed: false, reason: 'wrong_status' };
  const createdAt = new Date(tx.created_at).getTime();
  const deadline = createdAt + SELLER_OFFLINE_CANCEL_HOURS * 3600 * 1000;
  const now = Date.now();
  if (now < deadline) {
    return {
      allowed: false,
      reason: 'wait_24h',
      available_at: new Date(deadline).toISOString(),
    };
  }
  const lastSeen = sellerLastSeen ? new Date(sellerLastSeen).getTime() : null;
  // Seller appeared online at/after deal start → cancel blocked
  if (lastSeen && lastSeen >= createdAt) {
    return { allowed: false, reason: 'seller_was_online' };
  }
  return { allowed: true, available_at: new Date(deadline).toISOString() };
}

async function processAutoReleases() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM transactions
       WHERE status='awaiting_confirmation'
         AND auto_release_at IS NOT NULL
         AND auto_release_at <= NOW()
       FOR UPDATE SKIP LOCKED
       LIMIT 50`
    );
    for (const tx of rows) {
      await releaseEscrow(client, tx, {
        systemMessage: 'Истёк срок подтверждения (7 дней). Сделка завершена автоматически, средства переведены продавцу.',
      });
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,'auto_release','Автозавершение сделки','Вы не подтвердили получение за 7 дней. Средства переведены продавцу.',$2)`,
        [tx.buyer_id, JSON.stringify({ transaction_id: tx.id })]
      );
    }
    await client.query('COMMIT');
    if (rows.length) logger.info(`Auto-released ${rows.length} transaction(s)`);
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Auto-release failed: ${err.message}`);
    return 0;
  } finally {
    client.release();
  }
}

function startAutoReleaseJob(intervalMs = 60_000) {
  const tick = () => {
    processAutoReleases().catch((err) => logger.error(err));
  };
  tick();
  return setInterval(tick, intervalMs);
}

module.exports = {
  PLATFORM_FEE_PERCENT,
  SELLER_OFFLINE_CANCEL_HOURS,
  BUYER_CONFIRM_DAYS,
  releaseEscrow,
  refundEscrow,
  canBuyerCancel,
  processAutoReleases,
  startAutoReleaseJob,
};
