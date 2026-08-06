const pool = require('../config/database');
const { sendNotificationEmail } = require('./email');
const logger = require('../utils/logger');

const FRONTEND = () =>
  (process.env.FRONTEND_URL || 'https://lootz.ru').replace(/\/$/, '');

function linkFor(type, data = {}) {
  const base = FRONTEND();
  if (data.transaction_id) return `${base}/transactions/${data.transaction_id}`;
  if (data.conversation_id) return `${base}/chats/${data.conversation_id}`;
  if (data.listing_id) return `${base}/listings/${data.listing_id}`;
  if (type === 'chat') return `${base}/chats`;
  if (type && String(type).startsWith('sale')) return `${base}/transactions`;
  if (type === 'withdrawal' || type === 'sale_payout') return `${base}/wallet`;
  return base;
}

const EMAIL_TYPES = new Set([
  'new_sale', 'delivery', 'sale_complete', 'sale_payout', 'dispute_resolved',
  'deal_cancelled', 'chat', 'listing_expired', 'withdrawal', 'refund', 'purchase', 'auto_release',
]);

const CHAT_EMAIL_COOLDOWN_MS = 10 * 60 * 1000;

async function recentChatEmailSent(db, userId) {
  const { rows } = await db.query(
    `SELECT created_at FROM notifications
     WHERE user_id=$1 AND type='chat'
       AND data->>'email_sent' = 'true'
       AND created_at > NOW() - INTERVAL '15 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return false;
  const age = Date.now() - new Date(rows[0].created_at).getTime();
  return age < CHAT_EMAIL_COOLDOWN_MS;
}

async function notify(db, userId, { type, title, body, data = {} }) {
  const client = db || pool;
  const payload = data && typeof data === 'object' ? { ...data } : {};

  let emailSent = false;
  let shouldEmail = EMAIL_TYPES.has(type);

  if (shouldEmail && type === 'chat') {
    try {
      if (await recentChatEmailSent(client, userId)) shouldEmail = false;
    } catch {}
  }

  let userRow = null;
  if (shouldEmail) {
    try {
      const { rows } = await client.query(
        `SELECT email, COALESCE(email_notifications, TRUE) AS email_notifications, is_verified
         FROM users WHERE id=$1`,
        [userId]
      );
      userRow = rows[0] || null;
      if (!userRow?.email || userRow.email_notifications === false) shouldEmail = false;
    } catch (err) {
      if (err.code === '42703') {
        const { rows } = await client.query(`SELECT email FROM users WHERE id=$1`, [userId]);
        userRow = rows[0] || null;
        if (!userRow?.email) shouldEmail = false;
      } else {
        logger.error(`[notify] user lookup: ${err.message}`);
        shouldEmail = false;
      }
    }
  }

  if (shouldEmail && userRow?.email) {
    try {
      const result = await sendNotificationEmail(userRow.email, {
        title, body, link: linkFor(type, payload),
      });
      emailSent = Boolean(result.ok && !result.skipped);
    } catch (err) {
      logger.error(`[notify] email failed: ${err.message}`);
    }
  }

  if (emailSent) payload.email_sent = 'true';

  try {
    const { rows } = await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type, title, body || null, JSON.stringify(payload)]
    );
    return rows[0] || {};
  } catch (err) {
    logger.error(`[notify] insert failed: ${err.message}`);
    return {};
  }
}

module.exports = { notify, EMAIL_TYPES, linkFor };
