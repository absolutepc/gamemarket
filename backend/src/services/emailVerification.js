/**
 * 6-digit email verification codes.
 * Codes are stored hashed (SHA-256); plain code is only in the outbound email.
 */
const crypto = require('crypto');
const pool = require('../config/database');
const { sendVerificationCode } = require('./email');
const logger = require('../utils/logger');

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateCode() {
  return String(100000 + crypto.randomInt(900000));
}

async function issueVerificationCode(userId, { force = false } = {}) {
  const { rows: users } = await pool.query(
    `SELECT id, email, username, is_verified, auth_provider FROM users WHERE id=$1`,
    [userId]
  );
  const user = users[0];
  if (!user) return { ok: false, error: 'user_not_found' };
  if (user.is_verified) return { ok: false, error: 'already_verified' };
  if (!user.email) return { ok: false, error: 'no_email' };

  if (!force) {
    const { rows: recent } = await pool.query(
      `SELECT created_at FROM email_verification_codes
       WHERE user_id=$1 AND created_at > NOW() - INTERVAL '2 minutes'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (recent[0]) {
      const age = Date.now() - new Date(recent[0].created_at).getTime();
      const left = Math.max(0, RESEND_COOLDOWN_MS - age);
      if (left > 0) {
        return { ok: false, error: 'cooldown', cooldownMs: left };
      }
    }
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE email_verification_codes SET used_at=NOW()
       WHERE user_id=$1 AND used_at IS NULL`,
      [userId]
    );
    await client.query(
      `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
       VALUES ($1,$2,$3)`,
      [userId, codeHash, expiresAt]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '42P01') {
      logger.error('[emailVerification] table missing — run migrate');
      return { ok: false, error: 'not_ready' };
    }
    throw err;
  } finally {
    client.release();
  }

  const sent = await sendVerificationCode(user.email, code, user.username);
  if (!sent.ok && !sent.skipped) {
    logger.error(`[emailVerification] send failed: ${sent.error}`);
  }

  return { ok: true, expiresAt };
}

async function verifyCode(userId, rawCode) {
  const code = String(rawCode || '').trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'invalid_format' };
  }

  const { rows: users } = await pool.query(
    `SELECT id, is_verified FROM users WHERE id=$1`,
    [userId]
  );
  if (!users[0]) return { ok: false, error: 'user_not_found' };
  if (users[0].is_verified) return { ok: true, already: true };

  const { rows } = await pool.query(
    `SELECT * FROM email_verification_codes
     WHERE user_id=$1 AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return { ok: false, error: 'no_code' };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'expired' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'too_many_attempts' };
  }

  const match = hashCode(code) === row.code_hash;
  if (!match) {
    await pool.query(
      `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id=$1`,
      [row.id]
    );
    return { ok: false, error: 'wrong_code' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE email_verification_codes SET used_at=NOW() WHERE id=$1`,
      [row.id]
    );
    await client.query(
      `UPDATE users SET is_verified=TRUE, updated_at=NOW() WHERE id=$1`,
      [userId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  return { ok: true };
}

module.exports = {
  issueVerificationCode,
  verifyCode,
  CODE_TTL_MS,
  MAX_ATTEMPTS,
};
