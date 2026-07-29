const router = require('express').Router();
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');

const LISTING_TYPES = ['item', 'account', 'currency', 'boosting', 'subscription', 'topup', 'giftcard', 'other'];

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
              l.delivery_method, l.created_at,
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

router.get('/:id', apiLimiter, async (req, res) => {
  await pool.query('UPDATE listings SET views_count = views_count + 1 WHERE id=$1', [req.params.id]);
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
  res.json(rows[0]);
});

router.post('/',
  authenticate(),
  strictLimiter,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('description').trim().isLength({ min: 20, max: 5000 }),
    body('price').isFloat({ min: 1, max: 1000000 }),
    body('original_price').optional({ nullable: true }).isFloat({ min: 1, max: 1000000 }),
    body('game').optional().trim().isLength({ max: 100 }),
    body('listing_type').isIn(LISTING_TYPES),
    body('category_id').optional().isUUID(),
    body('delivery_method').optional().isIn(['manual', 'auto']),
  ],
  validate,
  async (req, res) => {
    const {
      title, description, price, original_price, game, listing_type,
      category_id, delivery_method, delivery_instructions, tags, buyer_fields,
    } = req.body;
    const method = delivery_method || 'manual';
    const fields = normalizeBuyerFields(buyer_fields, method);
    if (method === 'auto' && !fields.length) {
      return res.status(400).json({ error: 'Для автовыдачи укажите хотя бы один атрибут покупателя (например ID / ник)' });
    }
    const safeDesc = xss(description);
    const discount = calcDiscount(price, original_price);
    const { rows } = await pool.query(
      `INSERT INTO listings
         (seller_id, category_id, title, description, price, original_price, discount_percent,
          game, listing_type, delivery_method, delivery_instructions, tags, buyer_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [req.user.id, category_id || null, title, safeDesc, price,
       discount.original_price, discount.discount_percent,
       game || null, listing_type, method,
       delivery_instructions || null, tags || [], JSON.stringify(fields)]
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
    body('listing_type').optional().isIn(LISTING_TYPES),
    body('delivery_method').optional().isIn(['manual', 'auto']),
  ],
  validate,
  async (req, res) => {
    const { rows: existing } = await pool.query('SELECT * FROM listings WHERE id=$1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });
    if (existing[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const {
      title, description, price, original_price, status, game,
      delivery_instructions, listing_type, delivery_method, category_id, buyer_fields,
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

    const { rows } = await pool.query(
      `UPDATE listings SET
         title=COALESCE($1,title),
         description=COALESCE($2,description),
         price=COALESCE($3,price),
         original_price=$4,
         discount_percent=$5,
         status=COALESCE($6,status),
         game=COALESCE($7,game),
         delivery_instructions=COALESCE($8,delivery_instructions),
         listing_type=COALESCE($9,listing_type),
         delivery_method=COALESCE($10,delivery_method),
         category_id=COALESCE($11,category_id),
         buyer_fields=COALESCE($12,buyer_fields),
         updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [
        title || null, safeDesc, price || null,
        discount.original_price, discount.discount_percent,
        status || null, game || null, delivery_instructions || null,
        listing_type || null, delivery_method || null,
        category_id || null,
        fields ? JSON.stringify(fields) : null,
        req.params.id,
      ]
    );
    res.json(rows[0]);
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
