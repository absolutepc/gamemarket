const pool = require('./config/database');

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  frozen_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  purchases_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(100),
  parent_id UUID REFERENCES categories(id),
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  discount_percent INT DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'RUB',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  game VARCHAR(100),
  listing_type VARCHAR(30) DEFAULT 'item',
  images JSONB DEFAULT '[]',
  tags VARCHAR(50)[] DEFAULT '{}',
  views_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  delivery_method VARCHAR(50) DEFAULT 'manual',
  delivery_instructions TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  seller_receives DECIMAL(12,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  escrow_released_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  seller_delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  delivery_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  opened_by UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewed_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  criteria JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant1_id, participant2_id, listing_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Игровая валюта', 'game-currency', 'coins', 1),
  ('Аккаунты', 'accounts', 'user', 2),
  ('Предметы', 'items', 'package', 3),
  ('Подписки', 'subscriptions', 'sparkles', 4),
  ('Пополнения', 'topups', 'wallet', 5),
  ('Подарочные карты', 'gift-cards', 'gift', 6),
  ('Бусты', 'boosting', 'zap', 7),
  ('AI и сервисы', 'ai-services', 'bot', 8),
  ('Соцсети', 'social', 'share', 9),
  ('Другое', 'other', 'more-horizontal', 10)
ON CONFLICT (slug) DO NOTHING;
`;

const alters = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchases_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'buyer';
UPDATE users SET account_type = 'seller'
WHERE account_type IS DISTINCT FROM 'seller'
  AND (
    COALESCE(sales_count, 0) > 0
    OR EXISTS (SELECT 1 FROM listings l WHERE l.seller_id = users.id AND l.status != 'deleted')
  );
-- NULL first so existing rows can be marked "already chosen" once; new OAuth defaults to false
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type_chosen BOOLEAN;
UPDATE users SET account_type_chosen = TRUE WHERE account_type_chosen IS NULL;
ALTER TABLE users ALTER COLUMN account_type_chosen SET DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN account_type_chosen SET NOT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_id BIGINT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email';
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS buyer_fields JSONB DEFAULT '[]';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS buyer_data JSONB DEFAULT '{}';
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
UPDATE listings SET status='active' WHERE status='sold';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
UPDATE listings SET published_at = COALESCE(published_at, created_at) WHERE published_at IS NULL;
ALTER TABLE listings ALTER COLUMN published_at SET DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_listings_expire
  ON listings ((COALESCE(published_at, created_at)))
  WHERE status = 'active';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '[]';
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_transaction_unique ON reviews(transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_one_per_buyer_deal ON reviews(transaction_id, reviewer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_auto_release ON transactions(auto_release_at) WHERE status='awaiting_confirmation';
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

CREATE TABLE IF NOT EXISTS assortment_hidden (
  item_key VARCHAR(200) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  hidden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assortment_hidden_created ON assortment_hidden(created_at DESC);

CREATE TABLE IF NOT EXISTS listing_views (
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_key VARCHAR(80) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (listing_id, viewer_key)
);
CREATE INDEX IF NOT EXISTS idx_listing_views_user ON listing_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_views_created ON listing_views(created_at DESC);
`;

/** Usernames promoted to admin on each migrate (comma-separated). Default: Mercy */
function bootstrapAdminUsernames() {
  const raw = process.env.ADMIN_USERNAMES != null && String(process.env.ADMIN_USERNAMES).trim() !== ''
    ? process.env.ADMIN_USERNAMES
    : 'Mercy';
  return [...new Set(
    String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )];
}

async function promoteBootstrapAdmins(client) {
  const usernames = bootstrapAdminUsernames();
  for (const username of usernames) {
    const { rowCount, rows } = await client.query(
      `UPDATE users
       SET role = 'admin', updated_at = NOW()
       WHERE LOWER(username) = LOWER($1) AND role IS DISTINCT FROM 'admin'
       RETURNING username, role`,
      [username]
    );
    if (rowCount > 0) {
      console.log(`Promoted to admin: ${rows[0].username}`);
    }
  }
}

const foundersAlters = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_seller BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_seller_number INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_seller_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founders_email_norm TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founders_fingerprint TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founders_ip TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_founding_seller_number
  ON users (founding_seller_number) WHERE founding_seller_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_founders_email_norm
  ON users (founders_email_norm) WHERE is_founding_seller = TRUE AND founders_email_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_founders_fingerprint
  ON users (founders_fingerprint) WHERE is_founding_seller = TRUE AND founders_fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_founding_seller
  ON users (is_founding_seller) WHERE is_founding_seller = TRUE;
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
);
CREATE INDEX IF NOT EXISTS idx_founders_applications_status_created
  ON founders_applications (status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_founders_applications_one_pending
  ON founders_applications (user_id) WHERE status = 'pending';
`;

async function migrateFounders(client) {
  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL statement_timeout = 15000');
    await client.query(foundersAlters);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

async function migrate({ closePool = false } = {}) {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(schema);
    await client.query(alters);
    try {
      await migrateFounders(client);
    } catch (err) {
      console.error('Founders migration skipped/failed:', err.message || err);
    }
    await promoteBootstrapAdmins(client);
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    client.release();
    if (closePool) await pool.end();
  }
}

module.exports = { migrate, schema };

if (require.main === module) {
  migrate({ closePool: true }).catch(() => process.exit(1));
}
