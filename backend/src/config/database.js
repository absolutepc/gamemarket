const { Pool } = require('pg');

function buildPoolConfig() {
  // Prefer Railway DATABASE_URL when present
  if (process.env.DATABASE_URL) {
    const needsSsl =
      process.env.DB_SSL === 'true' ||
      process.env.DATABASE_URL.includes('rlwy.net') ||
      process.env.DATABASE_URL.includes('railway.app');

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'gamemarket',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
