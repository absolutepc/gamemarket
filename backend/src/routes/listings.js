const router = require('express').Router();
const crypto = require('crypto');
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');
const { calcPlatformFee } = require('../services/fees');
const { LISTING_SHOWCASE_DAYS } = require('../services/listingExpiry');

function showcaseDaysLeft(publishedAt) {
  if (!publishedAt) return LISTING_SHOWCASE_DAYS;
  const end = new Date(publishedAt).getTime() + LISTING_SHOWCASE_DAYS * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function listingViewerKey(req) {
  if (req.user?.id) return `user:${req.user.id}`;
  const raw = `${req.ip || ''}|${req.get('user-agent') || ''}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
  return `anon:${hash}`;
}

/** Count at most one view per viewer (user or anonymous fingerprint). Owners never inflate their own counter. */
async function recordListingView(listingId, sellerId, req) {
  if (req.user?.id && String(req.user.id) === String(sellerId)) return false;
  const viewerKey = listingViewerKey(req);
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
  'giftcard',
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

  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT l.id, l.title, l.price, l.original_price, l.discount_percent, l.currency,
              l.game, l.listing_type, l.images, l.views_count, l.is_featured,
              l.delivery_method, l.created_at, l.published_at, l.status,
              u.username AS seller_username, u.avatar_url AS seller_avatar,
              u.rating AS seller_rating, u.sales_count AS seller_sales,
              u.reviews_count AS seller_reviews,
              c.name AS category_name, c.slug AS category_slug
       FROM listings l
       JOIN users u ON u.id = l.seller_id
       LEFT JOIN categories c ON c.id = l.category_id
       ${where}
       ORDER BY l.is_featured DESC, ${orderBy}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, take, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM listings l
       LEFT JOIN categories c ON c.id = l.category_id
       ${where}`,
      params
    ),
  ]);

  res.json({
    listings: dataRes.rows,
    total: parseInt(countRes.rows[0].count),
    page: parseInt(page),
    pages: Math.ceil(parseInt(countRes.rows[0].count) / take),
  });
});

router.get('/:id', apiLimiter, authenticate(false), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.*, u.username AS seller_username, u.avatar_url AS seller_avatar,
            u.rating AS seller_rating, u.sales_count AS seller_sales,
            u.reviews_count AS seller_reviews, u.created_at AS seller_since,
            c.name AS category_name, c.slug AS category_slug
     FROM listings l
     JOIN users u ON u.id = l.seller_id
     LEFT JOIN categories c ON c.id = l.category_id
     WHERE l.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });
  const listing = rows[0];

  const counted = await recordListingView(listing.id, listing.seller_id, req);
  if (counted) listing.views_count = Number(listing.views_count || 0) + 1;

  const fee = calcPlatformFee(listing.price, {
    categorySlug: listing.category_slug,
    listingType: listing.listing_type,
  });
  res.json({
    ...listing,
    showcase_days: LISTING_SHOWCASE_DAYS,
    showcase_days_left: listing.status === 'active'
      ? showcaseDaysLeft(listing.published_at || listing.created_at)
      : 0,
    platform_fee_percent: fee.feePercent,
    platform_fee: fee.fee,
    seller_receives: fee.sellerReceives,
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
