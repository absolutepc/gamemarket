const pool = require('../config/database');
const logger = require('../utils/logger');
const { PLATFORM_FEE_PERCENT } = require('./fees');
const { creditPlatform, ENTRY_TYPES } = require('./platformLedger');

const SELLER_OFFLINE_CANCEL_HOURS = 24;
/** Auto-confirm / escrow release after seller marks delivered */
const BUYER_CONFIRM_HOURS = 48;
/** @deprecated use BUYER_CONFIRM_HOURS */
const BUYER_CONFIRM_DAYS = BUYER_CONFIRM_HOURS / 24;

/** After deal completes, seller payout stay frozen this long before withdrawable */
const PAYOUT_HOLD_HOURS_DEFAULT = 48;
const PAYOUT_HOLD_HOURS_FOUNDERS = 24;

async function sellerPayoutHoldHours(client, sellerId) {
  try {
    const { rows } = await client.query(
      `SELECT COALESCE(is_founding_seller, FALSE) AS is_founding_seller
       FROM users WHERE id = $1`,
      [sellerId]
    );
    return rows[0]?.is_founding_seller ? PAYOUT_HOLD_HOURS_FOUNDERS : PAYOUT_HOLD_HOURS_DEFAULT;
  } catch (err) {
    if (err.code === '42703') return PAYOUT_HOLD_HOURS_DEFAULT;
    throw err;
  }
}

/**
 * Complete the deal: buyer confirmed / auto-release.
 * Seller funds stay in frozen_balance until payout_available_at (48h / Founders 24h).
 */
async function releaseEscrow(client, tx, { systemMessage, notifySeller = true } = {}) {
  const holdHours = await sellerPayoutHoldHours(client, tx.seller_id);
  const payoutAt = new Date(Date.now() + holdHours * 3600 * 1000);
  let holdEnabled = true;

  await client.query(
    `UPDATE users SET sales_count = sales_count + 1 WHERE id=$1`,
    [tx.seller_id]
  );
  await client.query(
    `UPDATE users SET purchases_count = COALESCE(purchases_count, 0) + 1 WHERE id=$1`,
    [tx.buyer_id]
  );

  try {
    await client.query(
      `UPDATE transactions SET
         status='completed',
         buyer_confirmed_at=COALESCE(buyer_confirmed_at, NOW()),
         escrow_released_at=NOW(),
         payout_available_at=$2,
         payout_released_at=NULL,
         updated_at=NOW()
       WHERE id=$1`,
      [tx.id, payoutAt.toISOString()]
    );
  } catch (err) {
    if (err.code !== '42703') throw err;
    holdEnabled = false;
    await client.query(
      `UPDATE transactions SET status='completed', buyer_confirmed_at=COALESCE(buyer_confirmed_at, NOW()),
       escrow_released_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [tx.id]
    );
  }

  if (holdEnabled) {
    // Keep seller_receives in frozen_balance until payout job runs
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
       SELECT $1, 'sale_hold', $2, balance, $3, $4 FROM users WHERE id=$1`,
      [
        tx.seller_id,
        tx.seller_receives,
        `Сделка завершена. Вывод через ${holdHours} ч`,
        tx.id,
      ]
    );
  } else {
    // Legacy DBs without payout columns — credit immediately
    await client.query(
      `UPDATE users SET
         balance = balance + $1,
         frozen_balance = GREATEST(frozen_balance - $1, 0)
       WHERE id=$2`,
      [tx.seller_receives, tx.seller_id]
    );
    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
       SELECT $1, 'sale_credit', $2, balance, 'Sale proceeds released', $3 FROM users WHERE id=$1`,
      [tx.seller_id, tx.seller_receives, tx.id]
    );
  }

  const feeAmount = parseFloat(tx.platform_fee || 0);
  if (feeAmount > 0) {
    await creditPlatform(client, {
      entryType: ENTRY_TYPES.SALE_FEE,
      amount: feeAmount,
      description: 'Комиссия площадки со сделки',
      referenceId: tx.id,
      referenceType: 'transaction',
      meta: {
        listing_id: tx.listing_id,
        seller_id: tx.seller_id,
        buyer_id: tx.buyer_id,
        amount: tx.amount,
        seller_receives: tx.seller_receives,
      },
    });
  }

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
       VALUES ($1,'sale_complete','Сделка завершена!',
               $2,$3)`,
      [
        tx.seller_id,
        holdEnabled
          ? `Средства заморожены на ${holdHours} ч, затем станут доступны для вывода.`
          : 'Средства зачислены на ваш счёт.',
        JSON.stringify({
          transaction_id: tx.id,
          payout_available_at: holdEnabled ? payoutAt.toISOString() : null,
          hold_hours: holdEnabled ? holdHours : 0,
        }),
      ]
    );
  }
}

/** Move held sale proceeds from frozen_balance → balance after hold. */
async function creditSellerPayout(client, tx) {
  await client.query(
    `UPDATE users SET
       balance = balance + $1,
       frozen_balance = GREATEST(frozen_balance - $1, 0)
     WHERE id=$2`,
    [tx.seller_receives, tx.seller_id]
  );
  await client.query(
    `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
     SELECT $1, 'sale_credit', $2, balance, 'Средства доступны для вывода', $3 FROM users WHERE id=$1`,
    [tx.seller_id, tx.seller_receives, tx.id]
  );
  await client.query(
    `UPDATE transactions SET payout_released_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [tx.id]
  );
  await client.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1,'sale_payout','Средства доступны',
             'Заморозка после продажи снята — можно выводить.',$2)`,
    [tx.seller_id, JSON.stringify({ transaction_id: tx.id })]
  );
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
        systemMessage: `Истёк срок подтверждения (${BUYER_CONFIRM_HOURS} ч). Сделка завершена автоматически.`,
      });
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,'auto_release','Автозавершение сделки',$2,$3)`,
        [
          tx.buyer_id,
          `Вы не подтвердили получение за ${BUYER_CONFIRM_HOURS} ч. Сделка завершена.`,
          JSON.stringify({ transaction_id: tx.id }),
        ]
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

async function processPayoutReleases() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let rows;
    try {
      ({ rows } = await client.query(
        `SELECT * FROM transactions
         WHERE status = 'completed'
           AND payout_available_at IS NOT NULL
           AND payout_available_at <= NOW()
           AND payout_released_at IS NULL
         FOR UPDATE SKIP LOCKED
         LIMIT 50`
      ));
    } catch (err) {
      if (err.code === '42703') {
        await client.query('ROLLBACK');
        return 0;
      }
      throw err;
    }

    for (const tx of rows) {
      await creditSellerPayout(client, tx);
    }
    await client.query('COMMIT');
    if (rows.length) logger.info(`Released ${rows.length} seller payout hold(s)`);
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Payout release failed: ${err.message}`);
    return 0;
  } finally {
    client.release();
  }
}

function startAutoReleaseJob(intervalMs = 60_000) {
  const tick = () => {
    processAutoReleases().catch((err) => logger.error(err));
    processPayoutReleases().catch((err) => logger.error(err));
  };
  tick();
  return setInterval(tick, intervalMs);
}

module.exports = {
  PLATFORM_FEE_PERCENT,
  SELLER_OFFLINE_CANCEL_HOURS,
  BUYER_CONFIRM_HOURS,
  BUYER_CONFIRM_DAYS,
  PAYOUT_HOLD_HOURS_DEFAULT,
  PAYOUT_HOLD_HOURS_FOUNDERS,
  releaseEscrow,
  creditSellerPayout,
  refundEscrow,
  canBuyerCancel,
  processAutoReleases,
  processPayoutReleases,
  startAutoReleaseJob,
};
