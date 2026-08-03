/**
 * Founders program — first 100 sellers, admission by application review.
 * Anti-abuse: email identity, device fingerprint, IP, one slot per account.
 */

const FOUNDERS_LIMIT = 100;
const FOUNDERS_ADVISORY_LOCK = 42010001;

const FEE_FOUNDERS_REDUCED = 0.05;
const FEE_FOUNDERS_STANDARD = 0.13;

function normalizeEmailIdentity(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (!raw || !raw.includes('@')) return null;
  const [localPart, domainPart] = raw.split('@');
  let local = localPart;
  let domain = domainPart;
  if (!local || !domain) return null;

  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '');
  } else {
    local = local.split('+')[0];
  }
  return `${local}@${domain}`;
}

function sanitizeFingerprint(raw) {
  const fp = String(raw || '').trim().toLowerCase();
  if (fp.length < 16 || fp.length > 128) return null;
  if (!/^[a-f0-9]+$/.test(fp)) return null;
  return fp;
}

async function getFoundersJoined(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE is_founding_seller = TRUE`
  );
  return rows[0]?.n || 0;
}

/**
 * Grant Founding Seller after admin approval (atomic).
 * @param {import('pg').PoolClient} client — must already be in a transaction with advisory lock
 */
async function grantFoundingSellerInTx(client, user, { fingerprint, ip, emailNorm } = {}) {
  if (user.is_founding_seller) {
    return {
      granted: false,
      reason: 'already_founder',
      number: user.founding_seller_number || null,
    };
  }

  const joined = await getFoundersJoined(client);
  if (joined >= FOUNDERS_LIMIT) {
    return { granted: false, reason: 'sold_out', joined, limit: FOUNDERS_LIMIT };
  }

  const norm = emailNorm || normalizeEmailIdentity(user.email);
  if (!norm) return { granted: false, reason: 'invalid_email', joined, limit: FOUNDERS_LIMIT };

  const emailTaken = await client.query(
    `SELECT id FROM users
     WHERE is_founding_seller = TRUE AND founders_email_norm = $1
     LIMIT 1`,
    [norm]
  );
  if (emailTaken.rows[0]) {
    return { granted: false, reason: 'email_identity_used', joined, limit: FOUNDERS_LIMIT };
  }

  // Fingerprint/IP are stored for admin review only — not hard blockers.
  // Coarse client fingerprints (UA + screen + timezone) collide across sellers.
  const fp = sanitizeFingerprint(fingerprint);
  const ipStr = ip && String(ip).trim() ? String(ip).trim().slice(0, 64) : null;

  // Use MAX+1 so revoked numbers (nulled) or gaps never collide with unique index
  const { rows: maxRows } = await client.query(
    `SELECT COALESCE(MAX(founding_seller_number), 0)::int AS m FROM users`
  );
  const nextNumber = (maxRows[0]?.m || 0) + 1;
  const { rows } = await client.query(
    `UPDATE users SET
       is_founding_seller = TRUE,
       founding_seller_number = $2,
       founding_seller_at = NOW(),
       founders_email_norm = $3,
       founders_fingerprint = COALESCE($4, founders_fingerprint),
       founders_ip = COALESCE($5, founders_ip),
       updated_at = NOW()
     WHERE id = $1 AND is_founding_seller = FALSE
     RETURNING id, founding_seller_number, is_founding_seller`,
    [user.id, nextNumber, norm, fp, ipStr]
  );

  if (!rows[0]) {
    return { granted: false, reason: 'race', joined, limit: FOUNDERS_LIMIT };
  }

  return {
    granted: true,
    number: rows[0].founding_seller_number,
    joined: joined + 1,
    limit: FOUNDERS_LIMIT,
  };
}

/**
 * Submit a Founders application (pending until admin reviews).
 */
async function submitFoundersApplication(pool, user, { message, fingerprint, ip } = {}) {
  if (user.is_founding_seller) {
    return { ok: false, error: 'Вы уже Founding Seller', code: 'ALREADY_FOUNDER' };
  }
  if (user.account_type !== 'seller' && user.role !== 'admin') {
    return { ok: false, error: 'Сначала станьте продавцом', code: 'SELLER_REQUIRED' };
  }

  const joined = await getFoundersJoined(pool);
  if (joined >= FOUNDERS_LIMIT) {
    return { ok: false, error: 'Все 100 мест Founders заняты', code: 'SOLD_OUT' };
  }

  const emailNorm = normalizeEmailIdentity(user.email);
  if (!emailNorm) {
    return { ok: false, error: 'Некорректный email', code: 'INVALID_EMAIL' };
  }

  const fp = sanitizeFingerprint(fingerprint);
  const ipStr = ip && String(ip).trim() ? String(ip).trim().slice(0, 64) : null;
  const note = String(message || '').trim().slice(0, 1000) || null;

  // Hard block only on email identity — device/IP fingerprints are too coarse
  // (same Chrome + resolution + timezone collide across many sellers) and were
  // silently rejecting real applications so admins never saw them.
  const emailTaken = await pool.query(
    `SELECT id FROM users
     WHERE is_founding_seller = TRUE AND founders_email_norm = $1
     LIMIT 1`,
    [emailNorm]
  );
  if (emailTaken.rows[0]) {
    return {
      ok: false,
      error: 'На этот email уже выдан слот Founders',
      code: 'IDENTITY_USED',
    };
  }
  const pendingEmail = await pool.query(
    `SELECT id FROM founders_applications
     WHERE status = 'pending' AND email_norm = $1 AND user_id <> $2
     LIMIT 1`,
    [emailNorm, user.id]
  );
  if (pendingEmail.rows[0]) {
    return {
      ok: false,
      error: 'Заявка с этого email уже на рассмотрении',
      code: 'IDENTITY_USED',
    };
  }

  const existing = await pool.query(
    `SELECT id, status FROM founders_applications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );
  if (existing.rows[0]?.status === 'pending') {
    return {
      ok: true,
      application: existing.rows[0],
      already_pending: true,
    };
  }
  if (existing.rows[0]?.status === 'approved') {
    return { ok: false, error: 'Заявка уже одобрена', code: 'ALREADY_APPROVED' };
  }

  let rows;
  try {
    ({ rows } = await pool.query(
      `INSERT INTO founders_applications
         (user_id, status, message, device_fingerprint, ip, email_norm)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING *`,
      [user.id, note, fp, ipStr, emailNorm]
    ));
  } catch (err) {
    // Table missing (migrate skipped) — create and retry once
    if (err.code === '42P01') {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS founders_applications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          message TEXT,
          device_fingerprint TEXT,
          ip TEXT,
          email_norm TEXT,
          admin_note TEXT,
          reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      ({ rows } = await pool.query(
        `INSERT INTO founders_applications
           (user_id, status, message, device_fingerprint, ip, email_norm)
         VALUES ($1, 'pending', $2, $3, $4, $5)
         RETURNING *`,
        [user.id, note, fp, ipStr, emailNorm]
      ));
    } else {
      throw err;
    }
  }

  // Notify admins so the queue is visible even without refreshing stats
  try {
    const admins = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND COALESCE(is_banned, FALSE) = FALSE`
    );
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, 'founders_application', 'Новая заявка Founders', $2, $3)`,
        [
          admin.id,
          `${user.username || 'Продавец'} подал заявку в Founders`,
          JSON.stringify({ application_id: rows[0].id, username: user.username }),
        ]
      );
    }
  } catch {
    /* notifications best-effort */
  }

  return { ok: true, application: rows[0] };
}

async function getMyFoundersApplication(pool, userId) {
  const { rows } = await pool.query(
    `SELECT id, status, message, admin_note, created_at, reviewed_at, updated_at
     FROM founders_applications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function listFoundersApplications(pool, { status = 'pending', limit = 50 } = {}) {
  const take = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const params = [];
  let where = '';
  if (status && status !== 'all') {
    params.push(String(status));
    where = `WHERE a.status = $${params.length}`;
  }
  params.push(take);
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              u.username, u.email, u.avatar_url, u.auth_provider, u.sales_count, u.account_type,
              u.is_founding_seller, u.founding_seller_number,
              rev.username AS reviewer_username
       FROM founders_applications a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN users rev ON rev.id = a.reviewed_by
       ${where}
       ORDER BY
         CASE a.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         a.created_at ASC
       LIMIT $${params.length}`,
      params
    );
    return rows;
  } catch (err) {
    if (err.code === '42P01') return [];
    throw err;
  }
}

async function approveFoundersApplication(pool, applicationId, adminUser, { adminNote } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [FOUNDERS_ADVISORY_LOCK]);

    const { rows: apps } = await client.query(
      `SELECT * FROM founders_applications WHERE id = $1 FOR UPDATE`,
      [applicationId]
    );
    const app = apps[0];
    if (!app) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Заявка не найдена', code: 'NOT_FOUND' };
    }
    if (app.status !== 'pending') {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Заявка уже рассмотрена', code: 'ALREADY_REVIEWED' };
    }

    const { rows: users } = await client.query(
      `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
      [app.user_id]
    );
    const user = users[0];
    if (!user) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Пользователь не найден', code: 'USER_NOT_FOUND' };
    }

    const grant = await grantFoundingSellerInTx(client, user, {
      fingerprint: app.device_fingerprint,
      ip: app.ip,
      emailNorm: app.email_norm,
    });

    if (!grant.granted) {
      await client.query('ROLLBACK');
      const messages = {
        sold_out: 'Все места Founders уже заняты',
        email_identity_used: 'Email уже использован для Founders',
        device_used: 'Устройство уже использовано для Founders',
        ip_used: 'IP уже использован для Founders',
        already_founder: 'Пользователь уже Founding Seller',
      };
      return {
        ok: false,
        error: messages[grant.reason] || 'Не удалось выдать статус',
        code: grant.reason || 'GRANT_FAILED',
      };
    }

    await client.query(
      `UPDATE founders_applications SET
         status = 'approved',
         admin_note = COALESCE($2, admin_note),
         reviewed_by = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1`,
      [applicationId, adminNote || null, adminUser.id]
    );

    // Ensure seller account type
    await client.query(
      `UPDATE users SET account_type = 'seller', account_type_chosen = TRUE, updated_at = NOW()
       WHERE id = $1 AND account_type IS DISTINCT FROM 'seller'`,
      [user.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'founders_approved', 'Founders одобрена',
               $2, $3)`,
      [
        user.id,
        `Вы Founding Seller #${grant.number}. Комиссия 5%/13% активна.`,
        JSON.stringify({ founding_seller_number: grant.number, application_id: applicationId }),
      ]
    );

    await client.query('COMMIT');
    return { ok: true, number: grant.number, joined: grant.joined };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function rejectFoundersApplication(pool, applicationId, adminUser, { adminNote } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE founders_applications SET
         status = 'rejected',
         admin_note = COALESCE($2, admin_note),
         reviewed_by = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [applicationId, adminNote || null, adminUser.id]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Заявка не найдена или уже рассмотрена', code: 'NOT_FOUND' };
    }
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'founders_rejected', 'Founders: заявка отклонена',
               $2, $3)`,
      [
        rows[0].user_id,
        adminNote
          ? `Заявка в Founders отклонена: ${adminNote}`
          : 'Заявка в Founders отклонена. Можно подать новую позже.',
        JSON.stringify({ application_id: applicationId }),
      ]
    );
    await client.query('COMMIT');
    return { ok: true, application: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function listFoundingSellers(pool, { limit = 100 } = {}) {
  const take = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 100));
  const { rows } = await pool.query(
    `SELECT id, username, email, avatar_url, sales_count, account_type,
            founding_seller_number, founding_seller_at,
            founders_email_norm, founders_fingerprint, founders_ip
     FROM users
     WHERE is_founding_seller = TRUE
     ORDER BY founding_seller_number ASC NULLS LAST, founding_seller_at ASC
     LIMIT $1`,
    [take]
  );
  return rows;
}

/**
 * Revoke Founding Seller status. Frees the slot; email may re-apply later.
 */
async function revokeFoundingSeller(pool, userId, adminUser, { adminNote } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [FOUNDERS_ADVISORY_LOCK]);

    const { rows: users } = await client.query(
      `SELECT id, username, is_founding_seller, founding_seller_number
       FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = users[0];
    if (!user) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Пользователь не найден', code: 'NOT_FOUND' };
    }
    if (!user.is_founding_seller) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'У пользователя нет статуса Founders', code: 'NOT_FOUNDER' };
    }

    const previousNumber = user.founding_seller_number;
    const note = String(adminNote || '').trim().slice(0, 1000) || null;

    await client.query(
      `UPDATE users SET
         is_founding_seller = FALSE,
         founding_seller_number = NULL,
         founders_email_norm = NULL,
         founders_fingerprint = NULL,
         founders_ip = NULL,
         updated_at = NOW()
       WHERE id = $1 AND is_founding_seller = TRUE`,
      [userId]
    );

    // Mark latest approved application as revoked for admin history
    await client.query(
      `UPDATE founders_applications SET
         admin_note = CASE
           WHEN $2::text IS NULL THEN COALESCE(admin_note, 'Статус снят админом')
           ELSE $2
         END,
         reviewed_by = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = (
         SELECT id FROM founders_applications
         WHERE user_id = $1 AND status = 'approved'
         ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
         LIMIT 1
       )`,
      [userId, note, adminUser.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'founders_revoked', 'Founders: статус снят',
               $2, $3)`,
      [
        userId,
        note
          ? `Статус Founding Seller снят: ${note}`
          : 'Статус Founding Seller снят администратором. Комиссия вернулась к стандартной.',
        JSON.stringify({
          previous_number: previousNumber,
          revoked_by: adminUser.id,
        }),
      ]
    );

    const joined = await getFoundersJoined(client);
    await client.query('COMMIT');
    return {
      ok: true,
      user_id: userId,
      username: user.username,
      previous_number: previousNumber,
      joined,
      limit: FOUNDERS_LIMIT,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function getPlatformStats(pool) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE COALESCE(account_type, 'buyer') = 'buyer'
           AND COALESCE(is_founding_seller, FALSE) = FALSE)::int AS buyers_count,
         COUNT(*) FILTER (
           WHERE account_type = 'seller'
              OR COALESCE(is_founding_seller, FALSE) = TRUE
              OR role = 'admin'
         )::int AS sellers_count,
         COUNT(*) FILTER (WHERE is_founding_seller = TRUE)::int AS founders_joined,
         COUNT(*)::int AS users_total
       FROM users`
    );
    const r = rows[0] || {};
    const joined = r.founders_joined || 0;
    let pending = 0;
    try {
      const p = await pool.query(
        `SELECT COUNT(*)::int AS n FROM founders_applications WHERE status = 'pending'`
      );
      pending = p.rows[0]?.n || 0;
    } catch {
      pending = 0;
    }
    return {
      buyers_count: r.buyers_count || 0,
      sellers_count: r.sellers_count || 0,
      users_total: r.users_total || 0,
      founders: {
        joined,
        limit: FOUNDERS_LIMIT,
        remaining: Math.max(0, FOUNDERS_LIMIT - joined),
        open: joined < FOUNDERS_LIMIT,
        pending_applications: pending,
      },
    };
  } catch (err) {
    if (err.code !== '42703') throw err;
    // Columns may be partially migrated — count what we can
    try {
      const { rows } = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE COALESCE(account_type, 'buyer') = 'buyer')::int AS buyers_count,
           COUNT(*) FILTER (WHERE account_type = 'seller' OR role = 'admin')::int AS sellers_count,
           COUNT(*)::int AS users_total
         FROM users`
      );
      const r = rows[0] || {};
      return {
        buyers_count: r.buyers_count || 0,
        sellers_count: r.sellers_count || 0,
        users_total: r.users_total || 0,
        founders: {
          joined: 0,
          limit: FOUNDERS_LIMIT,
          remaining: FOUNDERS_LIMIT,
          open: true,
          pending_applications: 0,
        },
      };
    } catch (err2) {
      if (err2.code !== '42703') throw err2;
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS users_total FROM users`
      );
      return {
        buyers_count: 0,
        sellers_count: 0,
        users_total: rows[0]?.users_total || 0,
        founders: {
          joined: 0,
          limit: FOUNDERS_LIMIT,
          remaining: FOUNDERS_LIMIT,
          open: true,
          pending_applications: 0,
        },
      };
    }
  }
}

module.exports = {
  FOUNDERS_LIMIT,
  FEE_FOUNDERS_REDUCED,
  FEE_FOUNDERS_STANDARD,
  normalizeEmailIdentity,
  sanitizeFingerprint,
  grantFoundingSellerInTx,
  submitFoundersApplication,
  getMyFoundersApplication,
  listFoundersApplications,
  listFoundingSellers,
  approveFoundersApplication,
  rejectFoundersApplication,
  revokeFoundingSeller,
  getPlatformStats,
  getFoundersJoined,
};
