const pool = require('../config/database');
const logger = require('../utils/logger');

/** How long an active listing stays on the public showcase */
const LISTING_SHOWCASE_DAYS = 30;

async function processExpiredListings() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE listings
       SET status = 'inactive', updated_at = NOW()
       WHERE id IN (
         SELECT id FROM listings
         WHERE status = 'active'
           AND COALESCE(published_at, created_at) <= NOW() - ($1::int * INTERVAL '1 day')
         FOR UPDATE SKIP LOCKED
         LIMIT 100
       )
       RETURNING id, seller_id, title`,
      [LISTING_SHOWCASE_DAYS]
    );

    for (const listing of rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'listing_expired', 'Лот снят с витрины', $2, $3)`,
        [
          listing.seller_id,
          `«${listing.title}» был на витрине ${LISTING_SHOWCASE_DAYS} дней. Активируйте его снова в профиле.`,
          JSON.stringify({ listing_id: listing.id }),
        ]
      );
    }

    await client.query('COMMIT');
    if (rows.length) logger.info(`Expired ${rows.length} listing(s) off showcase`);
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Listing expiry failed: ${err.message}`);
    return 0;
  } finally {
    client.release();
  }
}

function startListingExpiryJob(intervalMs = 300_000) {
  const tick = () => {
    processExpiredListings().catch((err) => logger.error(err));
  };
  tick();
  return setInterval(tick, intervalMs);
}

module.exports = {
  LISTING_SHOWCASE_DAYS,
  processExpiredListings,
  startListingExpiryJob,
};
