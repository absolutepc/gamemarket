const router = require('express').Router();
const { body } = require('express-validator');
const xss = require('xss');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, strictLimiter, validate } = require('../middleware/security');
const { buildDraftsFromPayload, MAX_IMPORT } = require('../services/listingImport');
const { calcPlatformFee } = require('../services/fees');
const listingsRoute = require('./listings');

const ALLOWED_TYPES = new Set(listingsRoute.LISTING_TYPES || []);

const TYPE_TO_CATEGORY = {
  subscription: 'subscriptions',
  donate: 'topups',
  topup: 'topups',
  keys: 'gift-cards',
  skins: 'items',
  games: 'other',
  account: 'accounts',
  game_account: 'accounts',
  clean_account: 'accounts',
  item: 'items',
  currency: 'game-currency',
  boosting: 'boosting',
  services: 'other',
  media: 'social',
  other: 'other',
  giftcard: 'gift-cards',
  stars: 'topups',
  premium: 'subscriptions',
};

async function categoryIdForType(listingType) {
  const slug = TYPE_TO_CATEGORY[listingType] || 'other';
  const { rows } = await pool.query('SELECT id FROM categories WHERE slug=$1 LIMIT 1', [slug]);
  if (rows[0]) return rows[0].id;
  const fallback = await pool.query(`SELECT id FROM categories WHERE slug='other' LIMIT 1`);
  return fallback.rows[0]?.id || null;
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

function fallbackAssortmentImage(game) {
  const q = String(game || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim();
  const map = {
    cursor: '/assortment/cursor.png',
    'cursor ai': '/assortment/cursor.png',
    'cursor pro': '/assortment/cursor.png',
    chatgpt: '/assortment/chatgpt.png',
    'чатгпт': '/assortment/chatgpt.png',
    claude: '/assortment/claude.png',
    steam: '/assortment/steam.png',
    pubg: '/assortment/pubg.png',
    telegram: '/assortment/telegram.png',
  };
  for (const [key, icon] of Object.entries(map)) {
    if (q === key || q.includes(key)) return icon;
  }
  return '/assortment/other-apps.png';
}

function publicAttributes(rawAttrs, importMeta) {
  const out = {};
  if (rawAttrs && typeof rawAttrs === 'object' && !Array.isArray(rawAttrs)) {
    for (const [key, value] of Object.entries(rawAttrs)) {
      if (!key || key.startsWith('_')) continue;
      if (['imported_from', 'source_seller', 'source_url', 'external_id'].includes(key)) continue;
      const v = value == null ? '' : String(value).trim().slice(0, 80);
      if (v) out[key] = v;
    }
  }
  // Persist import provenance privately (hidden on storefront)
  if (importMeta && typeof importMeta === 'object') {
    out._import = importMeta;
  }
  return out;
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item || '').trim())
    .filter((item) => item.startsWith('https://') || item.startsWith('http://') || item.startsWith('/'))
    .slice(0, 5);
}

router.post(
  '/preview',
  authenticate(),
  strictLimiter,
  apiLimiter,
  async (req, res) => {
    if (req.user.account_type !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Импорт доступен только продавцам',
        code: 'SELLER_REQUIRED',
      });
    }
    try {
      const result = buildDraftsFromPayload(req.body || {});
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        error: err.message || 'Не удалось разобрать импорт',
        code: err.code || 'IMPORT_PREVIEW_FAILED',
        ...(err.meta || {}),
      });
    }
  }
);

router.post(
  '/confirm',
  authenticate(),
  strictLimiter,
  [
    body('drafts').isArray({ min: 1, max: MAX_IMPORT }),
  ],
  validate,
  async (req, res) => {
    if (req.user.account_type !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Импорт доступен только продавцам',
        code: 'SELLER_REQUIRED',
      });
    }

    const drafts = (req.body.drafts || []).slice(0, MAX_IMPORT);
    const created = [];
    const failed = [];

    for (let i = 0; i < drafts.length; i += 1) {
      const d = drafts[i] || {};
      try {
        const title = String(d.title || '').trim().slice(0, 200);
        const description = xss(String(d.description || '').trim().slice(0, 5000));
        const price = parseFloat(d.price);
        const game = String(d.game || '').trim().slice(0, 100);
        let listingType = String(d.listing_type || 'other').trim();
        if (!ALLOWED_TYPES.has(listingType)) listingType = 'other';

        if (title.length < 5) throw new Error('Название слишком короткое');
        if (description.length < 20) throw new Error('Описание слишком короткое');
        if (!Number.isFinite(price) || price < 1) throw new Error('Некорректная цена');
        if (!game) throw new Error('Укажите игру или сервис');

        const discount = calcDiscount(price, d.original_price);
        let images = normalizeImages(d.images);
        if (!images.length) {
          // Leave empty — storefront keeps previous placeholder behavior.
          // Seller can add a photo in the editor; do not force category icons.
          images = [];
        }
        const categoryId = await categoryIdForType(listingType);
        const importMeta = {
          provider: d.provider || d._import?.provider || 'manual',
          ...(d.source_url || d._import?.source_url
            ? { source_url: String(d.source_url || d._import.source_url).slice(0, 300) }
            : {}),
          ...(d.external_id || d._import?.external_id
            ? { external_id: String(d.external_id || d._import.external_id).slice(0, 80) }
            : {}),
          ...(d._import?.source_seller
            ? { source_seller: String(d._import.source_seller).slice(0, 80) }
            : {}),
        };
        const attrs = publicAttributes(d.attributes, importMeta);

        const { rows } = await pool.query(
          `INSERT INTO listings
             (seller_id, category_id, title, description, price, original_price, discount_percent,
              game, listing_type, delivery_method, delivery_instructions, tags, buyer_fields, images, attributes,
              status, published_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual',NULL,$10,'[]'::jsonb,$11,$12,'active',NOW())
           RETURNING id, title, price, game, listing_type, status, created_at`,
          [
            req.user.id,
            categoryId,
            title,
            description,
            price,
            discount.original_price,
            discount.discount_percent,
            game,
            listingType,
            Array.isArray(d.tags)
              ? d.tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean).slice(0, 20)
              : [],
            JSON.stringify(images),
            JSON.stringify(attrs),
          ]
        );

        const listing = rows[0];
        const fee = calcPlatformFee(listing.price, {
          listingType,
          isFoundingSeller: req.user.is_founding_seller,
        });
        created.push({
          ...listing,
          fee_percent: fee.feePercent,
        });
      } catch (err) {
        failed.push({
          index: i,
          title: d.title || null,
          error: err.message || 'Ошибка',
        });
      }
    }

    res.status(created.length ? 201 : 400).json({
      created_count: created.length,
      failed_count: failed.length,
      created,
      failed,
    });
  }
);

module.exports = router;
