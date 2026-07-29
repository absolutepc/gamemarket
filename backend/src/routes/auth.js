const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { authLimiter, validate } = require('../middleware/security');

const JWT_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;

function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  return { accessToken, refreshToken };
}

router.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/(?=.*[A-Za-z])(?=.*\d)/),
  ],
  validate,
  async (req, res) => {
    const { username, email, password } = req.body;
    const client = await pool.connect();
    try {
      const exists = await client.query(
        'SELECT id FROM users WHERE email=$1 OR username=$2',
        [email, username]
      );
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already taken' });
      }
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await client.query(
        `INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3)
         RETURNING id, username, email, role, balance, avatar_url`,
        [username, email, hash]
      );
      const user = rows[0];
      const { accessToken, refreshToken } = generateTokens(user.id);
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5)`,
        [user.id, tokenHash, expiresAt, req.ip, req.get('user-agent')]
      );
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_EXPIRES_DAYS * 86400000,
      });
      res.status(201).json({ accessToken, user });
    } finally {
      client.release();
    }
  }
);

router.post('/login',
  authLimiter,
  [
    body('login').trim().notEmpty(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { login, password } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email=$1 OR username=$1',
      [login]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5)`,
      [user.id, tokenHash, expiresAt, req.ip, req.get('user-agent')]
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_EXPIRES_DAYS * 86400000,
    });
    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        avatar_url: user.avatar_url,
        rating: user.rating,
        sales_count: user.sales_count,
      },
    });
  }
);

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const { rows } = await pool.query(
    `SELECT rt.*, u.is_banned FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash=$1 AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  if (!rows[0]) return res.status(401).json({ error: 'Invalid refresh token' });
  if (rows[0].is_banned) return res.status(403).json({ error: 'Account suspended' });
  await pool.query('DELETE FROM refresh_tokens WHERE id=$1', [rows[0].id]);
  const { accessToken, refreshToken: newRefresh } = generateTokens(rows[0].user_id);
  const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5)`,
    [rows[0].user_id, newHash, expiresAt, req.ip, req.get('user-agent')]
  );
  res.cookie('refreshToken', newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_EXPIRES_DAYS * 86400000,
  });
  res.json({ accessToken });
});

router.post('/logout', authenticate(false), async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash=$1', [tokenHash]);
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate(), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
