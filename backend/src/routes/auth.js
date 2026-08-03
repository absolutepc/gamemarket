const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { authLimiter, validate } = require('../middleware/security');
const { verifyAppleIdentityToken } = require('../utils/appleAuth');

const JWT_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;

function frontendBaseUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/** Treat empty / example placeholders as unset */
function envCredential(name) {
  const raw = String(process.env[name] || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const placeholders = [
    'ваш_app_id',
    'ваш_secret',
    'ваш_services_id',
    'your_app_id',
    'your_secret',
    'your_services_id',
    'changeme',
    'xxx',
    'xxxxxxxx',
    '12345678',
  ];
  if (placeholders.includes(lower)) return null;
  if (/^ваш[_-]/i.test(raw)) return null;
  if (/^your[_-]/i.test(raw)) return null;
  return raw;
}

/** Explicit opt-in. VK / Apple are postponed until setup is ready. */
function oauthFlagEnabled(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

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
    body('account_type').optional().isIn(['buyer', 'seller']),
    body('accept_seller_terms').optional().isBoolean(),
    body('device_fingerprint').optional().isString().isLength({ min: 16, max: 128 }),
  ],
  validate,
  async (req, res) => {
    const { username, email, password } = req.body;
    const accountType = req.body.account_type === 'seller' ? 'seller' : 'buyer';
    if (accountType === 'seller' && req.body.accept_seller_terms !== true) {
      return res.status(400).json({
        error: 'Для регистрации продавца нужно принять правила продажи',
        code: 'SELLER_TERMS_REQUIRED',
      });
    }
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
        `INSERT INTO users (username, email, password_hash, account_type, account_type_chosen, auth_provider)
         VALUES ($1,$2,$3,$4,TRUE,'email')
         RETURNING id, username, email, role, balance, avatar_url, account_type, account_type_chosen,
                   is_founding_seller, founding_seller_number, auth_provider, is_verified`,
        [username, email, hash, accountType]
      );
      let user = rows[0];
      let founders = null;
      if (accountType === 'seller') {
        const { tryGrantFoundingSeller } = require('../services/founders');
        // Release connection before nested pool transaction in tryGrant
        founders = await tryGrantFoundingSeller(pool, user, {
          fingerprint: req.body.device_fingerprint,
          ip: req.ip,
        });
        if (founders.granted) {
          const refreshed = await client.query(
            `SELECT id, username, email, role, balance, avatar_url, account_type, account_type_chosen,
                    is_founding_seller, founding_seller_number, auth_provider, is_verified
             FROM users WHERE id = $1`,
            [user.id]
          );
          user = refreshed.rows[0];
        }
      }
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
      res.status(201).json({ accessToken, user: publicUser(user), founders });
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
  res.json({ user: publicUser(req.user), needs_account_type: needsAccountType(req.user) });
});

function needsAccountType(user) {
  return user?.account_type_chosen === false;
}

function publicUser(user) {
  const accountType = user.account_type || 'buyer';
  const chosen = user.account_type_chosen !== false;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    account_type: accountType,
    account_type_chosen: chosen,
    needs_account_type: !chosen,
    is_founding_seller: Boolean(user.is_founding_seller),
    founding_seller_number: user.founding_seller_number || null,
    balance: user.balance,
    avatar_url: user.avatar_url,
    rating: user.rating,
    sales_count: user.sales_count,
    auth_provider: user.auth_provider || 'email',
    is_verified: Boolean(user.is_verified),
  };
}

/** Optional buyer/seller choice from OAuth body (register flow). */
function resolveOAuthAccountType(body = {}) {
  const raw = body.account_type;
  if (raw !== 'buyer' && raw !== 'seller') {
    return { accountType: 'buyer', chosen: false };
  }
  if (raw === 'seller' && body.accept_seller_terms !== true && body.accept_seller_terms !== 'true') {
    return {
      error: {
        status: 400,
        body: {
          error: 'Для регистрации продавца нужно принять правила продажи',
          code: 'SELLER_TERMS_REQUIRED',
        },
      },
    };
  }
  return { accountType: raw, chosen: true };
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

async function respondOAuth(res, req, user, { created = false } = {}) {
  let founders = null;
  if (user.account_type === 'seller' && !user.is_founding_seller) {
    const { tryGrantFoundingSeller } = require('../services/founders');
    founders = await tryGrantFoundingSeller(pool, user, {
      fingerprint: req.body?.device_fingerprint,
      ip: req.ip,
    });
    if (founders.granted) {
      const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [user.id]);
      user = rows[0];
    }
  }
  const accessToken = await issueSession(res, req, user);
  res.json({
    accessToken,
    user: publicUser(user),
    created,
    needs_account_type: needsAccountType(user),
    founders,
  });
}

function oauthProviderConfig() {
  const base = frontendBaseUrl();
  const vkAppId = envCredential('VK_APP_ID');
  const appleClientId = envCredential('APPLE_CLIENT_ID');
  const googleClientId = envCredential('GOOGLE_CLIENT_ID');
  const googleClientSecret = envCredential('GOOGLE_CLIENT_SECRET');
  return {
    vk: {
      // Postponed: set VK_OAUTH_ENABLED=true (+ VK_APP_ID) to show the button again
      enabled: oauthFlagEnabled('VK_OAUTH_ENABLED') && Boolean(vkAppId),
      appId: vkAppId,
      redirectUri: `${base}/auth/vk/callback`,
    },
    apple: {
      // Postponed: set APPLE_OAUTH_ENABLED=true (+ APPLE_CLIENT_ID) to show the button again
      enabled: oauthFlagEnabled('APPLE_OAUTH_ENABLED') && Boolean(appleClientId),
      clientId: appleClientId,
      redirectUri: `${base}/auth/apple/callback`,
    },
    google: {
      enabled: Boolean(googleClientId && googleClientSecret),
      clientId: googleClientId,
      redirectUri: `${base}/auth/google/callback`,
    },
  };
}

router.get('/providers', (req, res) => {
  res.json(oauthProviderConfig());
});

router.get('/vk/config', (req, res) => {
  const { vk } = oauthProviderConfig();
  res.json(vk);
});

router.get('/apple/config', (req, res) => {
  const { apple } = oauthProviderConfig();
  res.json(apple);
});

router.get('/google/config', (req, res) => {
  const { google } = oauthProviderConfig();
  res.json(google);
});

router.post('/vk',
  authLimiter,
  [
    body('code').trim().notEmpty(),
    body('code_verifier').trim().isLength({ min: 43, max: 128 }),
    body('device_id').optional({ nullable: true }).trim(),
    body('redirect_uri').trim().isURL({ require_tld: false }),
    body('state').optional().trim(),
    body('account_type').optional().isIn(['buyer', 'seller']),
    body('accept_seller_terms').optional(),
    body('device_fingerprint').optional().isString().isLength({ min: 16, max: 128 }),
  ],
  validate,
  async (req, res) => {
    const appId = envCredential('VK_APP_ID');
    if (!oauthFlagEnabled('VK_OAUTH_ENABLED') || !appId) {
      return res.status(503).json({ error: 'Вход через VK ID временно отключён' });
    }

    const accountChoice = resolveOAuthAccountType(req.body);
    if (accountChoice.error) {
      return res.status(accountChoice.error.status).json(accountChoice.error.body);
    }

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
    let created = false;

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
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await pool.query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
        if (!exists.rows.length) break;
        username = `vk_${vkId}_${crypto.randomBytes(2).toString('hex')}`.slice(0, 50);
      }
      const inserted = await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, vk_id, auth_provider, is_verified, account_type, account_type_chosen)
         VALUES ($1,$2,NULL,$3,$4,'vk',TRUE,$5,$6)
         RETURNING *`,
        [username, email, vkUser.avatar || null, vkId, accountChoice.accountType, accountChoice.chosen]
      );
      user = inserted.rows[0];
      created = true;
    } else if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    } else if (vkUser.avatar && !user.avatar_url) {
      const updated = await pool.query(
        `UPDATE users SET avatar_url=$1, auth_provider='vk', updated_at=NOW() WHERE id=$2 RETURNING *`,
        [vkUser.avatar, user.id]
      );
      user = updated.rows[0];
    }

    if (created === false && accountChoice.chosen && user.account_type_chosen === false) {
      const updated = await pool.query(
        `UPDATE users SET account_type=$1, account_type_chosen=TRUE, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [accountChoice.accountType, user.id]
      );
      user = updated.rows[0];
    }

    await respondOAuth(res, req, user, { created });
  }
);

router.post('/apple',
  authLimiter,
  [
    body('identityToken').trim().notEmpty(),
    body('user').optional({ nullable: true }),
    body('account_type').optional().isIn(['buyer', 'seller']),
    body('accept_seller_terms').optional(),
    body('device_fingerprint').optional().isString().isLength({ min: 16, max: 128 }),
  ],
  validate,
  async (req, res) => {
    if (!oauthFlagEnabled('APPLE_OAUTH_ENABLED') || !envCredential('APPLE_CLIENT_ID')) {
      return res.status(503).json({ error: 'Вход через Apple ID временно отключён' });
    }

    const accountChoice = resolveOAuthAccountType(req.body);
    if (accountChoice.error) {
      return res.status(accountChoice.error.status).json(accountChoice.error.body);
    }

    let claims;
    try {
      claims = await verifyAppleIdentityToken(req.body.identityToken);
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Неверный Apple identity token' });
    }

    const appleId = String(claims.sub);
    const appleEmail = typeof claims.email === 'string' && claims.email.includes('@')
      ? claims.email
      : null;
    const profileUser = req.body.user && typeof req.body.user === 'object' ? req.body.user : null;
    const profileEmail = typeof profileUser?.email === 'string' && profileUser.email.includes('@')
      ? profileUser.email
      : null;
    const email = appleEmail || profileEmail || `apple_${appleId.replace(/\W/g, '').slice(0, 24)}@apple.users.local`;

    const firstName = String(profileUser?.name?.firstName || profileUser?.firstName || '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 16);
    const shortSub = appleId.replace(/\W/g, '').slice(-8) || crypto.randomBytes(3).toString('hex');
    let username = (firstName
      ? `apple_${firstName}_${shortSub}`
      : `apple_${shortSub}`
    ).slice(0, 50).toLowerCase();

    let { rows } = await pool.query('SELECT * FROM users WHERE apple_id=$1', [appleId]);
    let user = rows[0];
    let created = false;

    if (!user && appleEmail) {
      const byEmail = await pool.query('SELECT * FROM users WHERE email=$1', [appleEmail]);
      if (byEmail.rows[0]) {
        const linked = await pool.query(
          `UPDATE users SET apple_id=$1, auth_provider='apple', updated_at=NOW()
           WHERE id=$2
           RETURNING *`,
          [appleId, byEmail.rows[0].id]
        );
        user = linked.rows[0];
      }
    }

    if (!user) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await pool.query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
        if (!exists.rows.length) break;
        username = `apple_${shortSub}_${crypto.randomBytes(2).toString('hex')}`.slice(0, 50);
      }
      const inserted = await pool.query(
        `INSERT INTO users (username, email, password_hash, apple_id, auth_provider, is_verified, account_type, account_type_chosen)
         VALUES ($1,$2,NULL,$3,'apple',TRUE,$4,$5)
         RETURNING *`,
        [username, email, appleId, accountChoice.accountType, accountChoice.chosen]
      );
      user = inserted.rows[0];
      created = true;
    } else if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    } else if (user.auth_provider !== 'apple') {
      const updated = await pool.query(
        `UPDATE users SET auth_provider='apple', updated_at=NOW() WHERE id=$1 RETURNING *`,
        [user.id]
      );
      user = updated.rows[0];
    }

    if (created === false && accountChoice.chosen && user.account_type_chosen === false) {
      const updated = await pool.query(
        `UPDATE users SET account_type=$1, account_type_chosen=TRUE, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [accountChoice.accountType, user.id]
      );
      user = updated.rows[0];
    }

    await respondOAuth(res, req, user, { created });
  }
);

router.post('/google',
  authLimiter,
  [
    body('code').trim().notEmpty(),
    body('code_verifier').trim().isLength({ min: 43, max: 128 }),
    body('redirect_uri').trim().isURL({ require_tld: false }),
    body('state').optional().trim(),
    body('account_type').optional().isIn(['buyer', 'seller']),
    body('accept_seller_terms').optional(),
    body('device_fingerprint').optional().isString().isLength({ min: 16, max: 128 }),
  ],
  validate,
  async (req, res) => {
    const clientId = envCredential('GOOGLE_CLIENT_ID');
    const clientSecret = envCredential('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: 'Google вход не настроен (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)' });
    }

    const accountChoice = resolveOAuthAccountType(req.body);
    if (accountChoice.error) {
      return res.status(accountChoice.error.status).json(accountChoice.error.body);
    }

    const { code, code_verifier, redirect_uri } = req.body;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody,
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return res.status(401).json({
        error: tokenData.error_description || tokenData.error || 'Google token exchange failed',
      });
    }

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await infoRes.json();
    if (!infoRes.ok || !googleUser.sub) {
      return res.status(401).json({
        error: googleUser.error_description || googleUser.error || 'Google userinfo failed',
      });
    }

    const googleId = String(googleUser.sub);
    const email = (typeof googleUser.email === 'string' && googleUser.email.includes('@'))
      ? googleUser.email
      : `google_${googleId.slice(0, 24)}@google.users.local`;
    const given = String(googleUser.given_name || googleUser.name || 'user')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 20) || 'user';
    let username = `g_${given}_${googleId.slice(-8)}`.slice(0, 50).toLowerCase();
    const avatar = typeof googleUser.picture === 'string' ? googleUser.picture : null;

    let { rows } = await pool.query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    let user = rows[0];
    let created = false;

    if (!user && googleUser.email) {
      const byEmail = await pool.query('SELECT * FROM users WHERE email=$1', [googleUser.email]);
      if (byEmail.rows[0]) {
        const linked = await pool.query(
          `UPDATE users SET google_id=$1, auth_provider='google',
             avatar_url=COALESCE(avatar_url, $2),
             is_verified=COALESCE($3, is_verified),
             updated_at=NOW()
           WHERE id=$4
           RETURNING *`,
          [googleId, avatar, googleUser.email_verified === true, byEmail.rows[0].id]
        );
        user = linked.rows[0];
      }
    }

    if (!user) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await pool.query(
          'SELECT id FROM users WHERE username=$1 OR email=$2',
          [username, email]
        );
        if (!exists.rows.length) break;
        username = `g_${googleId.slice(-10)}_${crypto.randomBytes(2).toString('hex')}`.slice(0, 50);
      }
      const inserted = await pool.query(
        `INSERT INTO users (username, email, password_hash, avatar_url, google_id, auth_provider, is_verified, account_type, account_type_chosen)
         VALUES ($1,$2,NULL,$3,$4,'google',$5,$6,$7)
         RETURNING *`,
        [username, email, avatar, googleId, googleUser.email_verified === true, accountChoice.accountType, accountChoice.chosen]
      );
      user = inserted.rows[0];
      created = true;
    } else if (user.is_banned) {
      return res.status(403).json({ error: 'Account suspended' });
    } else {
      const updated = await pool.query(
        `UPDATE users SET
           auth_provider='google',
           avatar_url=COALESCE(avatar_url, $1),
           updated_at=NOW()
         WHERE id=$2
         RETURNING *`,
        [avatar, user.id]
      );
      user = updated.rows[0];
    }

    if (created === false && accountChoice.chosen && user.account_type_chosen === false) {
      const updated = await pool.query(
        `UPDATE users SET account_type=$1, account_type_chosen=TRUE, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [accountChoice.accountType, user.id]
      );
      user = updated.rows[0];
    }

    await respondOAuth(res, req, user, { created });
  }
);

module.exports = router;
