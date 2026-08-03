const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function authenticate(required = true) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      if (required) return res.status(401).json({ error: 'Authentication required' });
      return next();
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const { rows } = await pool.query(
        `SELECT id, username, email, role, is_banned, balance, frozen_balance, avatar_url, rating, sales_count,
                COALESCE(account_type, 'buyer') AS account_type,
                COALESCE(account_type_chosen, TRUE) AS account_type_chosen,
                COALESCE(is_founding_seller, FALSE) AS is_founding_seller,
                founding_seller_number,
                is_verified,
                auth_provider, vk_id, apple_id, google_id, last_seen_at
         FROM users WHERE id = $1`,
        [payload.sub]
      );
      if (!rows[0]) return res.status(401).json({ error: 'User not found' });
      if (rows[0].is_banned) return res.status(403).json({ error: 'Account suspended' });
      req.user = rows[0];
      // Presence heartbeat (throttled by DB cheap update)
      pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [rows[0].id]).catch(() => {});
      next();
    } catch (err) {
      if (required) return res.status(401).json({ error: 'Invalid token' });
      next();
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET };
