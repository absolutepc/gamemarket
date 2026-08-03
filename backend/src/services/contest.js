/**
 * Monthly contest — weighted random draw among sellers / buyers.
 * Public APIs never expose individual odds; admin can inspect weights and draw.
 */

const crypto = require('crypto');

const DEFAULT_PRIZE = 'MacBook Air 15″ 256 ГБ';

function monthBounds(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const starts = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const ends = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  const slug = `${y}-${String(m + 1).padStart(2, '0')}`;
  const title = `Конкурс ${slug}`;
  return { slug, title, starts_at: starts, ends_at: ends };
}

function publicContestView(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    prize_sellers: row.prize_sellers,
    prize_buyers: row.prize_buyers,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    seller_winner_username: row.seller_winner_username || null,
    buyer_winner_username: row.buyer_winner_username || null,
    seller_drawn_at: row.seller_drawn_at || null,
    buyer_drawn_at: row.buyer_drawn_at || null,
  };
}

async function ensureMonthContest(pool, date = new Date()) {
  const b = monthBounds(date);
  const existing = await pool.query(`SELECT * FROM contests WHERE slug = $1`, [b.slug]);
  if (existing.rows[0]) {
    return { contest: existing.rows[0], created: false };
  }

  // Inherit prizes from the most recent previous contest when starting a new month
  const prev = await pool.query(
    `SELECT prize_sellers, prize_buyers
     FROM contests
     WHERE starts_at < $1
     ORDER BY starts_at DESC
     LIMIT 1`,
    [b.starts_at.toISOString()]
  );
  const prizeSellers = prev.rows[0]?.prize_sellers || DEFAULT_PRIZE;
  const prizeBuyers = prev.rows[0]?.prize_buyers || DEFAULT_PRIZE;

  const { rows } = await pool.query(
    `INSERT INTO contests (
       slug, title, prize_sellers, prize_buyers, starts_at, ends_at, status
     ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
     ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
     RETURNING *`,
    [
      b.slug,
      b.title,
      prizeSellers,
      prizeBuyers,
      b.starts_at.toISOString(),
      b.ends_at.toISOString(),
    ]
  );
  return { contest: rows[0], created: true };
}

/**
 * Start (or return) the contest for a given month.
 * @param {Date|string} [dateOrSlug] Date, or 'YYYY-MM' slug
 */
async function startContest(pool, dateOrSlug = new Date()) {
  let date = new Date();
  if (typeof dateOrSlug === 'string' && /^\d{4}-\d{2}$/.test(dateOrSlug.trim())) {
    const [y, m] = dateOrSlug.trim().split('-').map(Number);
    date = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0, 0));
  } else if (dateOrSlug instanceof Date && !Number.isNaN(dateOrSlug.getTime())) {
    date = dateOrSlug;
  }

  const { contest, created } = await ensureMonthContest(pool, date);
  const bounds = monthBounds(date);
  const now = new Date();
  const isCurrent =
    contest.slug === bounds.slug
    && new Date(contest.starts_at) <= now
    && new Date(contest.ends_at) > now;

  return {
    contest,
    created,
    already_active: !created && isCurrent && contest.status === 'active',
    slug: contest.slug,
  };
}

/**
 * Hourly/periodic tick: ensure current UTC month contest exists.
 * Previous months stay available for admin draws (status not force-closed).
 */
async function processContestRollover(pool) {
  const { contest, created } = await ensureMonthContest(pool, new Date());
  return { contest, created, slug: contest.slug };
}

function startContestRolloverJob(intervalMs = 3_600_000) {
  const pool = require('../config/database');
  const logger = require('../utils/logger');
  const tick = () => {
    processContestRollover(pool)
      .then((res) => {
        if (res.created) {
          logger.info(`Contest auto-started for ${res.slug}`);
        }
      })
      .catch((err) => logger.error(err));
  };
  tick();
  return setInterval(tick, intervalMs);
}

async function getContestById(pool, id) {
  const { rows } = await pool.query(`SELECT * FROM contests WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function getCurrentContest(pool) {
  const now = new Date();
  const { rows } = await pool.query(
    `SELECT c.*,
            sw.username AS seller_winner_username,
            bw.username AS buyer_winner_username
     FROM contests c
     LEFT JOIN users sw ON sw.id = c.seller_winner_id
     LEFT JOIN users bw ON bw.id = c.buyer_winner_id
     WHERE c.status IN ('active', 'drawn')
       AND c.starts_at <= $1
       AND c.ends_at > $1
     ORDER BY c.starts_at DESC
     LIMIT 1`,
    [now.toISOString()]
  );
  if (rows[0]) return rows[0];
  // Ensure current month exists for ops continuity
  const { contest: created } = await ensureMonthContest(pool, now);
  const again = await pool.query(
    `SELECT c.*,
            sw.username AS seller_winner_username,
            bw.username AS buyer_winner_username
     FROM contests c
     LEFT JOIN users sw ON sw.id = c.seller_winner_id
     LEFT JOIN users bw ON bw.id = c.buyer_winner_id
     WHERE c.id = $1`,
    [created.id]
  );
  return again.rows[0] || created;
}

/**
 * Participants from completed deals in contest window.
 * role: 'sellers' | 'buyers'
 */
async function listContestParticipants(pool, contest, role) {
  const col = role === 'sellers' ? 'seller_id' : 'buyer_id';
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.avatar_url, u.account_type,
            COUNT(*)::int AS deals,
            COUNT(*)::int AS weight
     FROM transactions t
     JOIN users u ON u.id = t.${col}
     WHERE t.status = 'completed'
       AND COALESCE(t.escrow_released_at, t.updated_at, t.created_at) >= $1
       AND COALESCE(t.escrow_released_at, t.updated_at, t.created_at) < $2
       AND COALESCE(u.is_banned, FALSE) = FALSE
     GROUP BY u.id
     HAVING COUNT(*) > 0
     ORDER BY COUNT(*) DESC, u.username ASC`,
    [contest.starts_at, contest.ends_at]
  );

  const totalWeight = rows.reduce((s, r) => s + Number(r.weight || 0), 0);
  return rows.map((r) => {
    const weight = Number(r.weight || 0);
    const chance = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      avatar_url: r.avatar_url,
      account_type: r.account_type,
      deals: Number(r.deals || 0),
      weight,
      chance_percent: Math.round(chance * 1000) / 1000,
    };
  });
}

async function getContestPublicStats(pool, contest) {
  const [sellers, buyers] = await Promise.all([
    listContestParticipants(pool, contest, 'sellers'),
    listContestParticipants(pool, contest, 'buyers'),
  ]);
  return {
    sellers_count: sellers.length,
    buyers_count: buyers.length,
    sellers_deals: sellers.reduce((s, p) => s + p.deals, 0),
    buyers_deals: buyers.reduce((s, p) => s + p.deals, 0),
  };
}

/** Public self view: participation flag + own deal count only (no odds). */
async function getMyContestParticipation(pool, contest, userId) {
  if (!userId || !contest) {
    return { as_seller: null, as_buyer: null };
  }
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE seller_id = $3)::int AS sales,
       COUNT(*) FILTER (WHERE buyer_id = $3)::int AS purchases
     FROM transactions
     WHERE status = 'completed'
       AND COALESCE(escrow_released_at, updated_at, created_at) >= $1
       AND COALESCE(escrow_released_at, updated_at, created_at) < $2
       AND (seller_id = $3 OR buyer_id = $3)`,
    [contest.starts_at, contest.ends_at, userId]
  );
  const sales = rows[0]?.sales || 0;
  const purchases = rows[0]?.purchases || 0;
  return {
    as_seller: { participating: sales > 0, deals: sales },
    as_buyer: { participating: purchases > 0, deals: purchases },
  };
}

function weightedPick(participants) {
  const total = participants.reduce((s, p) => s + p.weight, 0);
  if (!total) return null;
  const ticket = crypto.randomInt(0, total);
  let cursor = 0;
  for (const p of participants) {
    cursor += p.weight;
    if (ticket < cursor) {
      return { winner: p, ticket, total_weight: total };
    }
  }
  return { winner: participants[participants.length - 1], ticket, total_weight: total };
}

/**
 * Draw seller or buyer winner (weighted by completed deals in period).
 * side: 'sellers' | 'buyers'
 */
async function drawContestWinner(pool, contestId, side, adminUser) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM contests WHERE id = $1 FOR UPDATE`,
      [contestId]
    );
    const contest = rows[0];
    if (!contest) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Конкурс не найден', code: 'NOT_FOUND' };
    }
    if (contest.status === 'cancelled') {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Конкурс отменён', code: 'CANCELLED' };
    }

    const winnerCol = side === 'sellers' ? 'seller_winner_id' : 'buyer_winner_id';
    const drawnCol = side === 'sellers' ? 'seller_drawn_at' : 'buyer_drawn_at';
    const snapshotCol = side === 'sellers' ? 'sellers_draw_snapshot' : 'buyers_draw_snapshot';

    if (contest[winnerCol]) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Победитель уже выбран', code: 'ALREADY_DRAWN' };
    }

    const participants = await listContestParticipants(client, contest, side);
    if (!participants.length) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Нет участников для розыгрыша', code: 'NO_PARTICIPANTS' };
    }

    const pick = weightedPick(participants);
    if (!pick?.winner) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Не удалось выбрать победителя', code: 'DRAW_FAILED' };
    }

    const snapshot = {
      drawn_at: new Date().toISOString(),
      drawn_by: adminUser?.id || null,
      side,
      ticket: pick.ticket,
      total_weight: pick.total_weight,
      winner_id: pick.winner.id,
      winner_username: pick.winner.username,
      participants: participants.map((p) => ({
        id: p.id,
        username: p.username,
        weight: p.weight,
        deals: p.deals,
        chance_percent: p.chance_percent,
      })),
    };

    const { rows: updated } = await client.query(
      `UPDATE contests SET
         ${winnerCol} = $2,
         ${drawnCol} = NOW(),
         ${snapshotCol} = $3::jsonb,
         drawn_by = $4,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        contestId,
        pick.winner.id,
        JSON.stringify(snapshot),
        adminUser?.id || null,
      ]
    );

    let row = updated[0];
    if (row.seller_winner_id && row.buyer_winner_id) {
      const { rows: drawnRows } = await client.query(
        `UPDATE contests SET status = 'drawn', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [contestId]
      );
      row = drawnRows[0] || row;
    }

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'contest_win', 'Победа в конкурсе Lootz', $2, $3)`,
      [
        pick.winner.id,
        `Вы выиграли розыгрыш (${side === 'sellers' ? 'продавцы' : 'покупатели'}) — ${
          side === 'sellers' ? contest.prize_sellers : contest.prize_buyers
        }`,
        JSON.stringify({ contest_id: contestId, side, prize: side === 'sellers' ? contest.prize_sellers : contest.prize_buyers }),
      ]
    );

    await client.query('COMMIT');
    return {
      ok: true,
      side,
      winner: {
        id: pick.winner.id,
        username: pick.winner.username,
        deals: pick.winner.deals,
        chance_percent: pick.winner.chance_percent,
      },
      contest: row,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function listContests(pool, { limit = 24 } = {}) {
  const take = Math.min(48, Math.max(1, Number.parseInt(limit, 10) || 24));
  const { rows } = await pool.query(
    `SELECT c.*,
            sw.username AS seller_winner_username,
            bw.username AS buyer_winner_username
     FROM contests c
     LEFT JOIN users sw ON sw.id = c.seller_winner_id
     LEFT JOIN users bw ON bw.id = c.buyer_winner_id
     ORDER BY c.starts_at DESC
     LIMIT $1`,
    [take]
  );
  return rows;
}

async function updateContest(pool, id, patch = {}) {
  const fields = [];
  const params = [id];
  const map = {
    title: 'title',
    prize_sellers: 'prize_sellers',
    prize_buyers: 'prize_buyers',
    status: 'status',
  };
  for (const [key, col] of Object.entries(map)) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return getContestById(pool, id);
  fields.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE contests SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] || null;
}

module.exports = {
  DEFAULT_PRIZE,
  monthBounds,
  publicContestView,
  ensureMonthContest,
  startContest,
  processContestRollover,
  startContestRolloverJob,
  getContestById,
  getCurrentContest,
  listContestParticipants,
  getContestPublicStats,
  getMyContestParticipation,
  drawContestWinner,
  listContests,
  updateContest,
  weightedPick,
};
