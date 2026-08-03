const router = require('express').Router();
const crypto = require('crypto');
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');
const { calcPlatformFee } = require('../services/fees');
const { LISTING_SHOWCASE_DAYS } = require('../services/listingExpiry');
const { enrichListingAttributes } = require('../services/listingImport');
const {
  PROMOTE_PACKAGES,
  getPromotePackage,
  SQL_IS_PROMOTED,
} = require('../services/listingPromote');

function showcaseDaysLeft(publishedAt) {
  if (!publishedAt) return LISTING_SHOWCASE_DAYS;
  const end = new Date(publishedAt).getTime() + LISTING_SHOWCASE_DAYS * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

const VIEW_COOKIE = 'lootz_vid';
const VIEW_IP_COOLDOWN = '12 hours';

function ensureViewerCookie(req, res) {
  let vid = req.cookies?.[VIEW_COOKIE];
  if (!vid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vid)) {
    vid = crypto.randomUUID();
    res.cookie(VIEW_COOKIE, vid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  return vid;
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return forwarded || String(req.ip || '').trim() || '';
}

function hashIp(req) {
  const ip = clientIp(req);
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 40);
}

function listingViewerKey(req, viewerCookie) {
  if (req.user?.id) return `user:${req.user.id}`;
  if (viewerCookie) return `vid:${viewerCookie}`;
  const raw = `${clientIp(req)}|${req.get('user-agent') || ''}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
  return `anon:${hash}`;
}

/**
 * Count at most one view per viewer. Refresh / new tabs must not inflate.
 * - Logged-in: unique by user id
 * - Anonymous: stable httpOnly cookie + IP cooldown (covers cleared cookies)
 * Owners never inflate their own counter.
 */
async function recordListingView(listingId, sellerId, req, res) {
  if (req.user?.id && String(req.user.id) === String(sellerId)) return false;

  const viewerCookie = ensureViewerCookie(req, res);
  const viewerKey = listingViewerKey(req, viewerCookie);
  const ip = hashIp(req);

  try {
    // Anonymous: same IP cannot add another view to this lot within the cooldown,
    // even after clearing cookies / changing UA.
    if (!req.user?.id && ip) {
      const recent = await pool.query(
        `SELECT 1 FROM listing_views
         WHERE listing_id = $1
           AND ip_hash = $2
           AND created_at > NOW() - $3::interval
         LIMIT 1`,
        [listingId, ip, VIEW_IP_COOLDOWN]
      );
      if (recent.rows[0]) return false;
    }

    const { rows } = await pool.query(
      `INSERT INTO listing_views (listing_id, viewer_key, user_id, ip_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (listing_id, viewer_key) DO NOTHING
       RETURNING listing_id`,
      [listingId, viewerKey, req.user?.id || null, ip]
    );
    if (!rows[0]) return false;

    await pool.query(
      'UPDATE listings SET views_count = views_count + 1 WHERE id=$1',
      [listingId]
    );
    return true;
  } catch (err) {
    // Older DBs without ip_hash — still enforce unique viewer_key
    if (err.code === '42703') {
      try {
        const { rows } = await pool.query(
          `INSERT INTO listing_views (listing_id, viewer_key, user_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (listing_id, viewer_key) DO NOTHING
           RETURNING listing_id`,
          [listingId, viewerKey, req.user?.id || null]
        );
        if (!rows[0]) return false;
        await pool.query(
          'UPDATE listings SET views_count = views_count + 1 WHERE id=$1',
          [listingId]
        );
        return true;
      } catch (err2) {
        console.error('recordListingView fallback', err2.message);
        return false;
      }
    }
    console.error('recordListingView', err.message);
    return false;
  }
}

/** Keep list payloads to one image. Do not replace real photos with placeholder —
 * that hid valid JPEG data-URLs (~50–400KB) on home/catalog. Only drop pathological blobs. */
function slimListingImages(images) {
  if (!Array.isArray(images) || !images.length) return [];
  const first = images[0];
  if (typeof first !== 'string' || !first.trim()) return [];
  // ~1MB data-URL is already oversized for a card grid; skip those edge cases only
  if (first.startsWith('data:') && first.length > 1_000_000) {
    return [];
  }
  return [first];
}

function slimAvatar(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:') && url.length > 8_000) return null;
  return url;
}

const LISTING_TYPES = [
  'subscription',
  'donate',
  'account',
  'item',
  'topup',
  'keys',
  'other',
  'currency',
  'game_account',
  'clean_account',
  'boosting',
  'services',
  'skins',
  'games',
  'media',
  'rental',
  'region_change',
  'mods',
  'design',
  'training',
  'license',
  'software',
  'giftcard',
  'steam_rewards',
  'stars',
  'premium',
  'nft_gifts',
  'channels',
  'usernames',
  'advertising',
  'bots',
  'groups',
  'stickers',
  'clickers',
  'coins',
  'promotion',
  'montage',
  'voices',
  'vk_music',
  'vk_play',
  'gifts',
  'twitch_drops',
  'bits',
  'tariff',
  'tokens',
  'diamonds',
  'superlikes',
  'beans',
  'promocodes',
  'plugins',
  'guides',
  'zems',
  'packs',
  'product_design',
  'images',
  'design_packs',
  'mochi',
  'servers',
  'gold',
  'sounds',
  'elixir',
  'trovo_ace',
  'mana',
  'addons',
  'nitro',
  'decorations',
  'nintendo_switch_online',
  'ps_plus',
  'ea_play',
  'youtube_music',
  'youtube_tv',
  'game_pass',
  'ubisoft_plus',
];

const DEFAULT_AUTO_BUYER_FIELDS = [
  { key: 'player_id', label: 'ID / ник', required: true },
];

function slugifyKey(label, index) {
  const base = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return base || `field_${index + 1}`;
}

function normalizeBuyerFields(raw, deliveryMethod) {
  if (deliveryMethod !== 'auto') return [];
  let list = Array.isArray(raw) ? raw : [];
  if (!list.length) list = DEFAULT_AUTO_BUYER_FIELDS;
  return list.slice(0, 5).map((f, i) => {
    const label = String(f.label || f.name || '').trim().slice(0, 80);
    if (!label) return null;
    return {
      key: String(f.key || slugifyKey(label, i)).slice(0, 50),
      label,
      required: f.required !== false,
      placeholder: String(f.placeholder || '').slice(0, 120) || undefined,
    };
  }).filter(Boolean);
}

function validateBuyerData(fields, data) {
  const values = data && typeof data === 'object' ? data : {};
  const cleaned = {};
  for (const field of fields) {
    const raw = values[field.key];
    const value = raw == null ? '' : String(raw).trim();
    if (field.required && value.length < 1) {
      return { error: `Укажите: ${field.label}` };
    }
    if (value.length > 200) {
      return { error: `Слишком длинное значение: ${field.label}` };
    }
    if (value) cleaned[field.key] = value;
  }
  return { data: cleaned };
}

function normalizeAttributes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = String(key).trim().slice(0, 40);
    if (!k) continue;
    const v = value == null ? '' : String(value).trim().slice(0, 80);
    if (v) out[k] = v;
    if (Object.keys(out).length >= 20) break;
  }
  return out;
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item || '').trim())
    .filter((item) => {
      if (!item) return false;
      if (item.startsWith('https://') || item.startsWith('http://') || item.startsWith('/')) return true;
      if (item.startsWith('data:image/') && item.length < 1_200_000) return true;
      return false;
    })
    .slice(0, 5);
}

function calcDiscount(price, originalPrice) {
  const p = parseFloat(price);
  const o = originalPrice != null ? parseFloat(originalPrice) : null;
  if (!o || o <= p) return { original_price: null, discount_percent: 0 };
  return {
    original_price: o,
    discount_percent: Math.round(((o - p) / o) * 100),
  };
}

router.get('/', apiLimiter, async (req, res) => {
  const {
    page = 1, limit = 20, category, game, minPrice, maxPrice,
    search, sort = 'newest', type, seller_id,
  } = req.query;

  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const take = Math.min(50, parseInt(limit));

  let params = [];
  let conditions = ["l.status = 'active'"];
  let paramIdx = 1;

  if (category) {
    conditions.push(`c.slug = $${paramIdx++}`);
    params.push(category);
  }
  if (game) {
    conditions.push(`l.game ILIKE $${paramIdx++}`);
    params.push(`%${game}%`);
  }
  if (minPrice) {
    conditions.push(`l.price >= $${paramIdx++}`);
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    conditions.push(`l.price <= $${paramIdx++}`);
    params.push(parseFloat(maxPrice));
  }
  if (search) {
    conditions.push(`(l.title ILIKE $${paramIdx} OR l.description ILIKE $${paramIdx} OR l.game ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (type) {
    conditions.push(`l.listing_type = $${paramIdx++}`);
    params.push(type);
  }
  if (seller_id) {
    conditions.push(`l.seller_id = $${paramIdx++}`);
    params.push(seller_id);
  }

  const orderMap = {
    newest: 'l.created_at DESC',
    oldest: 'l.created_at ASC',
    price_asc: 'l.price ASC',
    price_desc: 'l.price DESC',
    popular: 'l.views_count DESC',
  };
  const orderBy = orderMap[sort] || 'l.created_at DESC';
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  // Paid TOP first; then requested sort; Founders only as soft tiebreaker
  const rankingOrder = `${SQL_IS_PROMOTED} DESC, ${orderBy}, COALESCE(u.is_founding_seller, FALSE) DESC`;

  const listSqlWithFounders = `
      SELECT l.id, l.title, l.price, l.original_price, l.discount_percent, l.currency,
              l.game, l.listing_type, l.images, l.views_count,
              (${SQL_IS_PROMOTED}) AS is_featured,
              l.featured_until,
              l.delivery_method, l.created_at, l.published_at, l.status,
              u.username AS seller_username, u.avatar_url AS seller_avatar,
              u.rating AS seller_rating, u.sales_count AS seller_sales,
              u.reviews_count AS seller_reviews,
              COALESCE(u.is_founding_seller, FALSE) AS seller_is_founding,
              u.founding_seller_number AS seller_founding_number,
              c.name AS category_name, c.slug AS category_slug
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN categories c ON c.id = l.category_id
       ${where}
       ORDER BY ${rankingOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

  const listSqlBase = `
      SELECT l.id, l.title, l.price, l.original_price, l.discount_percent, l.currency,
              l.game, l.listing_type, l.images, l.views_count, l.is_featured,
              l.delivery_method, l.created_at, l.published_at, l.status,
              u.username AS seller_username, u.avatar_url AS seller_avatar,
              u.rating AS seller_rating, u.sales_count AS seller_sales,
              u.reviews_count AS seller_reviews,
              FALSE AS seller_is_founding,
              NULL::int AS seller_founding_number,
              c.name AS category_name, c.slug AS category_slug
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN categories c ON c.id = l.category_id
       ${where}
       ORDER BY l.is_featured DESC, ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

  let dataRes;
  try {
    dataRes = await pool.query(listSqlWithFounders, [...params, take, offset]);
  } catch (err) {
    // 42703 = undefined_column (e.g. featured_until / founders cols before migrate)
    if (err.code !== '42703') throw err;
    dataRes = await pool.query(listSqlBase, [...params, take, offset]);
  }

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM listings l
     LEFT JOIN categories c ON c.id = l.category_id
     ${where}`,
    params
  );

  const slimListings = dataRes.rows.map((row) => ({
    ...row,
    images: slimListingImages(row.images),
    // Heavy avatars in list kill mobile payloads
    seller_avatar: slimAvatar(row.seller_avatar),
  }));

  res.json({
    listings: slimListings,
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    pages: Math.ceil(parseInt(countRes.rows[0].count) / take),
  });
});

router.get('/promote/packages', apiLimiter, (_req, res) => {
  res.json({ packages: PROMOTE_PACKAGES });
});

router.get('/:id', apiLimiter, authenticate(false), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, u.username AS seller_username, u.avatar_url AS seller_avatar,
            u.rating AS seller_rating, u.sales_count AS seller_sales,
            u.reviews_count AS seller_reviews, u.created_at AS seller_since,
            COALESCE(u.is_founding_seller, FALSE) AS seller_is_founding,
            u.founding_seller_number AS seller_founding_number,
            c.name AS category_name, c.slug AS category_slug
     FROM listings l
     JOIN users u ON u.id = l.seller_id
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE l.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });
  let listing = rows[0];

  // Early imports stored empty attributes — infer duration/plan for storefront + persist once
  const enriched = enrichListingAttributes(listing);
  listing = enriched.listing;
  if (enriched.changed) {
    pool.query(
      'UPDATE listings SET attributes = $1::jsonb WHERE id = $2',
      [JSON.stringify(enriched.attributes), listing.id],
    ).catch(() => {});
  }

  const counted = await recordListingView(listing.id, listing.seller_id, req, res);
  if (counted) listing.views_count = Number(listing.views_count || 0) + 1;

  const fee = calcPlatformFee(listing.price, {
    categorySlug: listing.category_slug,
    listingType: listing.listing_type,
    isFoundingSeller: Boolean(listing.seller_is_founding),
  });
  const featuredUntil = listing.featured_until ? new Date(listing.featured_until) : null;
  const isPromoted = Boolean(featuredUntil && featuredUntil.getTime() > Date.now());
  res.json({
    ...listing,
    is_featured: isPromoted,
    featured_until: isPromoted ? listing.featured_until : null,
    showcase_days: LISTING_SHOWCASE_DAYS,
    showcase_days_left: listing.status === 'active'
      ? showcaseDaysLeft(listing.published_at || listing.created_at)
      : 0,
    platform_fee_percent: fee.feePercent,
    platform_fee: fee.fee,
    seller_receives: fee.sellerReceives,
    promote_packages: PROMOTE_PACKAGES,
  });
});

router.post('/',
  authenticate(),
  strictLimiter,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('description').trim().isLength({ min: 20, max: 5000 }),
    body('price').isFloat({ min: 1, max: 1000000 }),
    body('original_price').optional({ nullable: true }).isFloat({ min: 1, max: 1000000 }),
    body('game').trim().isLength({ min: 1, max: 100 }).withMessage('Укажите игру или сервис'),
    body('listing_type').isIn(LISTING_TYPES),
    body('category_id').optional().isUUID(),
    body('delivery_method').optional().isIn(['manual', 'auto']),
    body('images').optional().isArray({ max: 5 }),
    body('attributes').optional().isObject(),
    body('tags').optional().isArray({ max: 20 }),
  ],
  validate,
  async (req, res) => {
    if (req.user.account_type !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Чтобы выставить лот, зарегистрируйтесь как продавец или перейдите в статус продавца',
        code: 'SELLER_REQUIRED',
      });
    }
    const {
      title, description, price, original_price, game, listing_type,
      category_id, delivery_method, delivery_instructions, tags, buyer_fields,
      images, attributes,
    } = req.body;
    const method = delivery_method || 'manual';
    const fields = normalizeBuyerFields(buyer_fields, method);
    if (method === 'auto' && !fields.length) {
      return res.status(400).json({ error: 'Для автовыдачи укажите хотя бы один атрибут покупателя (например ID / ник)' });
    }
    const safeDesc = xss(description);
    const discount = calcDiscount(price, original_price);
    const imageList = normalizeImages(images);
    const attrs = normalizeAttributes(attributes);
    const tagList = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean).slice(0, 20)
      : Object.values(attrs).slice(0, 12);
    const { rows } = await pool.query(
      `INSERT INTO listings
         (seller_id, category_id, title, description, price, original_price, discount_percent,
          game, listing_type, delivery_method, delivery_instructions, tags, buyer_fields, images, attributes,
          status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',NOW())
       RETURNING *`,
      [req.user.id, category_id || null, title, safeDesc, price,
       discount.original_price, discount.discount_percent,
       game || null, listing_type, method,
       delivery_instructions || null, tagList, JSON.stringify(fields),
       JSON.stringify(imageList), JSON.stringify(attrs)]
    );
    res.status(201).json(rows[0]);
  }
);

router.put('/:id',
  authenticate(),
  strictLimiter,
  [
    body('title').optional().trim().isLength({ min: 5, max: 200 }),
    body('description').optional().trim().isLength({ min: 20, max: 5000 }),
    body('price').optional().isFloat({ min: 1, max: 1000000 }),
    body('original_price').optional({ nullable: true }).isFloat({ min: 1, max: 1000000 }),
    body('game').optional().trim().isLength({ min: 1, max: 100 }),
    body('listing_type').optional().isIn(LISTING_TYPES),
    body('delivery_method').optional().isIn(['manual', 'auto']),
    body('images').optional().isArray({ max: 5 }),
    body('attributes').optional().isObject(),
    body('tags').optional().isArray({ max: 20 }),
  ],
  validate,
  async (req, res) => {
    const { rows: existing } = await pool.query('SELECT * FROM listings WHERE id=$1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });
    if (existing[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const {
      title, description, price, original_price, game,
      delivery_instructions, listing_type, delivery_method, category_id, buyer_fields,
      images, attributes, tags,
    } = req.body;
    const safeDesc = description ? xss(description) : null;
    const nextPrice = price != null ? price : existing[0].price;
    const nextOriginal = original_price !== undefined ? original_price : existing[0].original_price;
    const discount = calcDiscount(nextPrice, nextOriginal);
    const nextMethod = delivery_method || existing[0].delivery_method || 'manual';
    const fields = buyer_fields !== undefined || delivery_method
      ? normalizeBuyerFields(
        buyer_fields !== undefined ? buyer_fields : existing[0].buyer_fields,
        nextMethod
      )
      : undefined;
    if (nextMethod === 'auto' && fields && !fields.length) {
      return res.status(400).json({ error: 'Для автовыдачи укажите хотя бы один атрибут покупателя (например ID / ник)' });
    }

    const imageList = images !== undefined ? normalizeImages(images) : undefined;
    const attrs = attributes !== undefined ? normalizeAttributes(attributes) : undefined;
    const tagList = tags !== undefined
      ? (Array.isArray(tags) ? tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean).slice(0, 20) : [])
      : undefined;

    // status changes only via /reactivate or soft-delete — not free-form PUT
    const { rows } = await pool.query(
      `UPDATE listings SET
         title=COALESCE($1,title),
         description=COALESCE($2,description),
         price=COALESCE($3,price),
         original_price=$4,
         discount_percent=$5,
         game=COALESCE($6,game),
         delivery_instructions=COALESCE($7,delivery_instructions),
         listing_type=COALESCE($8,listing_type),
         delivery_method=COALESCE($9,delivery_method),
         category_id=COALESCE($10,category_id),
         buyer_fields=COALESCE($11,buyer_fields),
         images=COALESCE($12,images),
         attributes=COALESCE($13,attributes),
         tags=COALESCE($14,tags),
         updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [
        title || null, safeDesc, price || null,
        discount.original_price, discount.discount_percent,
        game || null, delivery_instructions || null,
        listing_type || null, delivery_method || null,
        category_id || null,
        fields ? JSON.stringify(fields) : null,
        imageList ? JSON.stringify(imageList) : null,
        attrs ? JSON.stringify(attrs) : null,
        tagList || null,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  }
);

router.post('/:id/reactivate', authenticate(), strictLimiter, async (req, res) => {
  const { rows: existing } = await pool.query(
    'SELECT id, seller_id, status, title FROM listings WHERE id=$1',
    [req.params.id]
  );
  const listing = existing[0];
  if (!listing) return res.status(404).json({ error: 'Лот не найден' });
  if (String(listing.seller_id) !== String(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (listing.status === 'deleted') {
    return res.status(400).json({ error: 'Удалённый лот нельзя активировать' });
  }
  if (listing.status === 'active') {
    const { rows } = await pool.query(
      `UPDATE listings
       SET published_at = NOW(), updated_at = NOW()
       WHERE id=$1
       RETURNING *`,
      [listing.id]
    );
    return res.json({
      ...rows[0],
      showcase_days: LISTING_SHOWCASE_DAYS,
      message: `Витрина продлена на ${LISTING_SHOWCASE_DAYS} дней`,
    });
  }
  if (listing.status !== 'inactive') {
    return res.status(400).json({ error: 'Этот лот нельзя активировать' });
  }

  const { rows } = await pool.query(
    `UPDATE listings
     SET status = 'active', published_at = NOW(), updated_at = NOW()
     WHERE id=$1
     RETURNING *`,
    [listing.id]
  );
  res.json({
    ...rows[0],
    showcase_days: LISTING_SHOWCASE_DAYS,
    message: `Лот снова на витрине на ${LISTING_SHOWCASE_DAYS} дней`,
  });
});

router.post(
  '/:id/promote',
  authenticate(),
  strictLimiter,
  [body('days').isInt({ min: 1, max: 30 })],
  validate,
  async (req, res) => {
    const pkg = getPromotePackage(req.body.days);
    if (!pkg) {
      return res.status(400).json({
        error: 'Выберите пакет продвижения',
        packages: PROMOTE_PACKAGES,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: listingRows } = await client.query(
        `SELECT id, seller_id, status, title, featured_until
         FROM listings WHERE id=$1 FOR UPDATE`,
        [req.params.id]
      );
      const listing = listingRows[0];
      if (!listing) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Лот не найден' });
      }
      if (String(listing.seller_id) !== String(req.user.id) && req.user.role !== 'admin') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (listing.status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Продвигать можно только активный лот' });
      }

      const { rows: userRows } = await client.query(
        'SELECT id, balance FROM users WHERE id=$1 FOR UPDATE',
        [req.user.id]
      );
      const balance = parseFloat(userRows[0]?.balance || 0);
      if (balance < pkg.price) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Недостаточно средств на балансе',
          code: 'INSUFFICIENT_BALANCE',
          required: pkg.price,
          balance,
        });
      }

      const { rows: balRows } = await client.query(
        `UPDATE users SET balance = balance - $1, updated_at = NOW()
         WHERE id=$2 RETURNING balance`,
        [pkg.price, req.user.id]
      );

      await client.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
         VALUES ($1, 'listing_promote', $2, $3, $4, $5)`,
        [
          req.user.id,
          -pkg.price,
          balRows[0].balance,
          `Продвижение лота «${String(listing.title).slice(0, 80)}» на ${pkg.days} дн.`,
          listing.id,
        ]
      );

      const base = listing.featured_until && new Date(listing.featured_until) > new Date()
        ? new Date(listing.featured_until)
        : new Date();
      const featuredUntil = new Date(base.getTime() + pkg.days * 86400000);

      const { rows: updated } = await client.query(
        `UPDATE listings
         SET is_featured = TRUE,
             featured_until = $1,
             updated_at = NOW()
         WHERE id=$2
         RETURNING id, title, is_featured, featured_until, status`,
        [featuredUntil.toISOString(), listing.id]
      );

      await client.query('COMMIT');
      res.json({
        listing: {
          ...updated[0],
          is_featured: true,
        },
        package: pkg,
        balance: balRows[0].balance,
        message: `Лот в ТОП на ${pkg.days} дн. до ${featuredUntil.toLocaleString('ru-RU')}`,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
);

router.delete('/:id', authenticate(), async (req, res) => {
  const { rows } = await pool.query('SELECT seller_id FROM listings WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  if (rows[0].seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await pool.query("UPDATE listings SET status='deleted', updated_at=NOW() WHERE id=$1", [req.params.id]);
  res.json({ message: 'Listing deleted' });
});

module.exports = router;
module.exports.normalizeBuyerFields = normalizeBuyerFields;
module.exports.validateBuyerData = validateBuyerData;
module.exports.DEFAULT_AUTO_BUYER_FIELDS = DEFAULT_AUTO_BUYER_FIELDS;
module.exports.LISTING_TYPES = LISTING_TYPES;
