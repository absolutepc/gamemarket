/**
 * Founders program — first 100 sellers get reduced fees and ranking boost.
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
 * Atomically try to grant Founding Seller status.
 * Opens its own transaction + advisory lock.
 * @param {import('pg').Pool} pool
 */
async function tryGrantFoundingSeller(pool, user, { fingerprint, ip } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [FOUNDERS_ADVISORY_LOCK]);

    if (user.is_founding_seller) {
      const joined = await getFoundersJoined(client);
      await client.query('COMMIT');
      return {
        granted: false,
        reason: 'already_founder',
        number: user.founding_seller_number || null,
        joined,
        limit: FOUNDERS_LIMIT,
      };
    }

    const joined = await getFoundersJoined(client);
    if (joined >= FOUNDERS_LIMIT) {
      await client.query('COMMIT');
      return { granted: false, reason: 'sold_out', joined, limit: FOUNDERS_LIMIT };
    }

    const emailNorm = normalizeEmailIdentity(user.email);
    if (!emailNorm) {
      await client.query('COMMIT');
      return { granted: false, reason: 'invalid_email', joined, limit: FOUNDERS_LIMIT };
    }

    const provider = String(user.auth_provider || 'email');
    const oauthOk = ['google', 'vk', 'apple'].includes(provider);
    const fp = sanitizeFingerprint(fingerprint);
    if (!oauthOk && !fp) {
      await client.query('COMMIT');
      return { granted: false, reason: 'fingerprint_required', joined, limit: FOUNDERS_LIMIT };
    }

    const emailTaken = await client.query(
      `SELECT id FROM users
       WHERE is_founding_seller = TRUE AND founders_email_norm = $1
       LIMIT 1`,
      [emailNorm]
    );
    if (emailTaken.rows[0]) {
      await client.query('COMMIT');
      return { granted: false, reason: 'email_identity_used', joined, limit: FOUNDERS_LIMIT };
    }

    if (fp) {
      const fpTaken = await client.query(
        `SELECT id FROM users
         WHERE is_founding_seller = TRUE AND founders_fingerprint = $1
         LIMIT 1`,
        [fp]
      );
      if (fpTaken.rows[0]) {
        await client.query('COMMIT');
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
        await client.query('COMMIT');
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
      [user.id, nextNumber, emailNorm, fp, ipStr]
    );

    if (!rows[0]) {
      await client.query('COMMIT');
      return { granted: false, reason: 'race', joined, limit: FOUNDERS_LIMIT };
    }

    await client.query('COMMIT');
    return {
      granted: true,
      number: rows[0].founding_seller_number,
      joined: nextNumber,
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
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE COALESCE(account_type, 'buyer') = 'buyer')::int AS buyers_count,
       COUNT(*) FILTER (WHERE account_type = 'seller')::int AS sellers_count,
       COUNT(*) FILTER (WHERE is_founding_seller = TRUE)::int AS founders_joined,
       COUNT(*)::int AS users_total`
  );
  const r = rows[0] || {};
  const joined = r.founders_joined || 0;
  return {
    buyers_count: r.buyers_count || 0,
    sellers_count: r.sellers_count || 0,
    users_total: r.users_total || 0,
    founders: {
      joined,
      limit: FOUNDERS_LIMIT,
      remaining: Math.max(0, FOUNDERS_LIMIT - joined),
      open: joined < FOUNDERS_LIMIT,
    },
  };
}

module.exports = {
  FOUNDERS_LIMIT,
  FEE_FOUNDERS_REDUCED,
  FEE_FOUNDERS_STANDARD,
  normalizeEmailIdentity,
  sanitizeFingerprint,
  tryGrantFoundingSeller,
  getPlatformStats,
  getFoundersJoined,
};
