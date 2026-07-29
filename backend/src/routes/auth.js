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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    }
    const accessToken = await issueSession(res, req, user);
    res.json({
      accessToken,
      user: publicUser(user),
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance,
    avatar_url: user.avatar_url,
    rating: user.rating,
    sales_count: user.sales_count,
    auth_provider: user.auth_provider || 'email',
  };
}

async function issueSession(res, req, user) {
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_EXPIRES_DAYS * 86400000,
  });
  return accessToken;
}

router.get('/vk/config', (req, res) => {
  const appId = process.env.VK_APP_ID;
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.json({
    enabled: Boolean(appId),
    appId: appId || null,
    redirectUri: `${frontendUrl}/auth/vk/callback`,
  });
});

router.post('/vk',
  authLimiter,
  [
    body('code').trim().notEmpty(),
    body('code_verifier').trim().isLength({ min: 43, max: 128 }),
    body('device_id').optional({ nullable: true }).trim(),
    body('redirect_uri').trim().isURL({ require_tld: false }),
    body('state').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const appId = process.env.VK_APP_ID;
    if (!appId) return res.status(503).json({ error: 'VK ID не настроен (VK_APP_ID)' });

    const { code, code_verifier, redirect_uri, state } = req.body;
    const device_id = req.body.device_id || 'web';
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier,
      client_id: String(appId),
      device_id,
      redirect_uri,
      state: state || crypto.randomBytes(16).toString('hex'),
    });
    if (process.env.VK_CLIENT_SECRET) {
      tokenBody.set('client_secret', process.env.VK_CLIENT_SECRET);
    }

    const tokenRes = await fetch('https://id.vk.ru/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(401).json({
        error: tokenData.error_description || tokenData.error || 'VK token exchange failed',
      });
    }

    const infoBody = new URLSearchParams({
      access_token: tokenData.access_token,
      client_id: String(appId),
    });
    const infoRes = await fetch('https://id.vk.ru/oauth2/user_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: infoBody,
    });
    const infoData = await infoRes.json();
    const vkUser = infoData.user || {};
    const vkId = String(tokenData.user_id || vkUser.user_id || '');
    if (!vkId) return res.status(401).json({ error: 'VK user id missing' });

    const email = vkUser.email
      || `vk_${vkId}@vk.users.local`;
    const first = (vkUser.first_name || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
    let username = `vk_${first}_${vkId}`.slice(0, 50).toLowerCase();

    let { rows } = await pool.query('SELECT * FROM users WHERE vk_id=$1', [vkId]);
    let user = rows[0];

    if (!user && vkUser.email) {
      const byEmail = await pool.query('SELECT * FROM users WHERE email=$1', [vkUser.email]);
      if (byEmail.rows[0]) {
        const linked = await pool.query(
          `UPDATE users SET vk_id=$1, auth_provider='vk',
             avatar_url=COALESCE(avatar_url, $2), updated_at=NOW()
           WHERE id=$3
           RETURNING *`,
          [vkId, vkUser.avatar || null, byEmail.rows[0].id]
        );
        user = linked.rows[0];
      }
    }

    if (!user) {
      // ensure unique username
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await pool.query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
        if (!exists.rows.length) break;
        username = `vk_${vkId}_${crypto.randomBytes(2).toString('hex')}`.slice(0, 50);
      }
      const inserted = await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, vk_id, auth_provider, is_verified)
         VALUES ($1,$2,NULL,$3,$4,'vk',TRUE)
         RETURNING *`,
        [username, email, vkUser.avatar || null, vkId]
      );
      user = inserted.rows[0];
    } else if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    } else if (vkUser.avatar && !user.avatar_url) {
      const updated = await pool.query(
        `UPDATE users SET avatar_url=$1, auth_provider='vk', updated_at=NOW() WHERE id=$2 RETURNING *`,
        [vkUser.avatar, user.id]
      );
      user = updated.rows[0];
    }

    const accessToken = await issueSession(res, req, user);
    res.json({ accessToken, user: publicUser(user) });
  }
);

module.exports = router;
