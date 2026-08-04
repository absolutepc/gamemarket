/**
 * Admin audience metrics: totals + approximate online (last_seen_at window).
 */

const ONLINE_WINDOW_MINUTES = 5;

const SELLER_EXPR = `(
  account_type = 'seller'
  OR COALESCE(is_founding_seller, FALSE) = TRUE
  OR role IN ('admin', 'owner')
)`;

const ADMIN_EXPR = `role IN ('admin', 'owner')`;

const PURCHASER_EXPR = `COALESCE(purchases_count, 0) > 0`;

const ONLINE_EXPR = `last_seen_at IS NOT NULL AND last_seen_at >= NOW() - ($1::int * INTERVAL '1 minute')`;

async function getAdminAudienceStats(pool, { onlineMinutes = ONLINE_WINDOW_MINUTES } = {}) {
  const minutes = Math.min(60, Math.max(1, Number.parseInt(onlineMinutes, 10) || ONLINE_WINDOW_MINUTES));

  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS users_total,
         COUNT(*) FILTER (WHERE ${ONLINE_EXPR})::int AS users_online,

         COUNT(*) FILTER (WHERE ${SELLER_EXPR})::int AS sellers_total,
         COUNT(*) FILTER (WHERE ${SELLER_EXPR} AND ${ONLINE_EXPR})::int AS sellers_online,

         COUNT(*) FILTER (WHERE COALESCE(is_founding_seller, FALSE) = TRUE)::int AS founders_total,
         COUNT(*) FILTER (
           WHERE COALESCE(is_founding_seller, FALSE) = TRUE AND ${ONLINE_EXPR}
         )::int AS founders_online,

         COUNT(*) FILTER (WHERE ${PURCHASER_EXPR})::int AS purchasers_total,
         COUNT(*) FILTER (WHERE ${PURCHASER_EXPR} AND ${ONLINE_EXPR})::int AS purchasers_online,

         COUNT(*) FILTER (WHERE ${ADMIN_EXPR})::int AS admins_total,
         COUNT(*) FILTER (WHERE ${ADMIN_EXPR} AND ${ONLINE_EXPR})::int AS admins_online
       FROM users`,
      [minutes]
    );

    const r = rows[0] || {};
    return {
      online_window_minutes: minutes,
      generated_at: new Date().toISOString(),
      users: { total: r.users_total || 0, online: r.users_online || 0 },
      sellers: { total: r.sellers_total || 0, online: r.sellers_online || 0 },
      founders: { total: r.founders_total || 0, online: r.founders_online || 0 },
      purchasers: { total: r.purchasers_total || 0, online: r.purchasers_online || 0 },
      admins: { total: r.admins_total || 0, online: r.admins_online || 0 },
    };
  } catch (err) {
    // Columns may be partially migrated — degrade gracefully
    if (err.code !== '42703') throw err;

    const { rows } = await pool.query(`SELECT COUNT(*)::int AS users_total FROM users`);
    const total = rows[0]?.users_total || 0;
    const empty = { total: 0, online: 0 };
    return {
      online_window_minutes: minutes,
      generated_at: new Date().toISOString(),
      users: { total, online: 0 },
      sellers: { ...empty },
      founders: { ...empty },
      purchasers: { ...empty },
      admins: { ...empty },
      partial: true,
    };
  }
}

module.exports = {
  ONLINE_WINDOW_MINUTES,
  getAdminAudienceStats,
};
