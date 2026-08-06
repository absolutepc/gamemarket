/** Ensure email verification schema exists (idempotent). */
async function ensureEmailSchema(pool) {
  const sql = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user
  ON email_verification_codes (user_id, created_at DESC);
`;
  try {
    await pool.query(sql);
  } catch (err) {
    console.error('[email] schema ensure failed:', err.message);
  }
}

module.exports = { ensureEmailSchema };
