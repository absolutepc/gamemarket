const router = require('express').Router();
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');

const LISTING_TYPES = ['item', 'account', 'currency', 'boosting', 'subscription', 'topup', 'giftcard', 'other'];

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
      category_id, delivery_method, delivery_instructions, tags,
    } = req.body;
    const safeDesc = xss(description);
    const discount = calcDiscount(price, original_price);
    const { rows } = await pool.query(
      `INSERT INTO listings
         (seller_id, category_id, title, description, price, original_price, discount_percent,
          game, listing_type, delivery_method, delivery_instructions, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, category_id || null, title, safeDesc, price,
       discount.original_price, discount.discount_percent,
       game || null, listing_type, delivery_method || 'manual',
       delivery_instructions || null, tags || []]
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
      delivery_instructions, listing_type, delivery_method, category_id,
    } = req.body;
    const safeDesc = description ? xss(description) : null;
    const nextPrice = price != null ? price : existing[0].price;
    const nextOriginal = original_price !== undefined ? original_price : existing[0].original_price;
    const discount = calcDiscount(nextPrice, nextOriginal);

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
         updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [
        title || null, safeDesc, price || null,
        discount.original_price, discount.discount_percent,
        status || null, game || null, delivery_instructions || null,
        listing_type || null, delivery_method || null,
        category_id || null, req.params.id,
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
