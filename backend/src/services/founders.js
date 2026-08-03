/**
 * Founders program — first 100 sellers, admission by application review.
 * Anti-abuse: email identity, device fingerprint, IP, one slot per account.
 */

const FOUNDERS_LIMIT = 100;
const FOUNDERS_ADVISORY_LOCK = 42010001;

const FEE_FOUNDERS_REDUCED = 0.05;
const FEE_FOUNDERS_STANDARD = 0.10;

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

  const fp = sanitizeFingerprint(fingerprint);
  if (fp) {
    const fpTaken = await client.query(
      `SELECT id FROM users
       WHERE is_founding_seller = TRUE AND founders_fingerprint = $1
       LIMIT 1`,
      [fp]
    );
    if (fpTaken.rows[0]) {
      return { granted: false, reason: 'device_used', joined, limit: FOUNDERS_LIMIT };
    }
  }

  const ipStr = ip && String(ip).trim() ? String(ip).trim().slice(0, 64) : null;
  if (ipStr && ipStr !== '::1' && ipStr !== '127.0.0.1') {
    const ipTaken = await client.query(
      `SELECT id FROM users
       WHERE is_founding_seller = TRUE
         AND founders_ip IS NOT NULL
         AND founders_ip = $1
       LIMIT 1`,
      [ipStr]
    );
    if (ipTaken.rows[0]) {
      return { granted: false, reason: 'ip_used', joined, limit: FOUNDERS_LIMIT };
    }
  }

  const nextNumber = joined + 1;
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
    joined: nextNumber,
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

  // Block if this identity already holds or has a pending application
  const conflict = await pool.query(
    `(
       SELECT 'founder' AS kind FROM users
       WHERE is_founding_seller = TRUE AND (
         founders_email_norm = $1
         OR ($2::text IS NOT NULL AND founders_fingerprint = $2)
         OR ($3::text IS NOT NULL AND founders_ip = $3 AND founders_ip NOT IN ('::1','127.0.0.1'))
       )
       LIMIT 1
     )
     UNION ALL
     (
       SELECT 'pending' AS kind FROM founders_applications
       WHERE status = 'pending' AND user_id <> $4 AND (
         email_norm = $1
         OR ($2::text IS NOT NULL AND device_fingerprint = $2)
         OR ($3::text IS NOT NULL AND ip = $3 AND ip NOT IN ('::1','127.0.0.1'))
       )
       LIMIT 1
     )
     LIMIT 1`,
    [emailNorm, fp, ipStr, user.id]
  );
  if (conflict.rows[0]) {
    return {
      ok: false,
      error: 'Заявка с этого email/устройства/IP уже есть или слот занят',
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

  const { rows } = await pool.query(
    `INSERT INTO founders_applications
       (user_id, status, message, device_fingerprint, ip, email_norm)
     VALUES ($1, 'pending', $2, $3, $4, $5)
     RETURNING *`,
    [user.id, note, fp, ipStr, emailNorm]
  );

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
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const params = [];
  let where = '';
  if (status && status !== 'all') {
    params.push(status);
    where = `WHERE a.status = $${params.length}`;
  }
  params.push(take);
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
        `Вы Founding Seller #${grant.number}. Комиссия 5%/10% активна.`,
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

async function getPlatformStats(pool) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE COALESCE(account_type, 'buyer') = 'buyer')::int AS buyers_count,
         COUNT(*) FILTER (WHERE account_type = 'seller')::int AS sellers_count,
         COUNT(*) FILTER (WHERE is_founding_seller = TRUE)::int AS founders_joined,
         COUNT(*)::int AS users_total`
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
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE COALESCE(account_type, 'buyer') = 'buyer')::int AS buyers_count,
         COUNT(*) FILTER (WHERE account_type = 'seller')::int AS sellers_count,
         COUNT(*)::int AS users_total`
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
  approveFoundersApplication,
  rejectFoundersApplication,
  getPlatformStats,
  getFoundersJoined,
};
