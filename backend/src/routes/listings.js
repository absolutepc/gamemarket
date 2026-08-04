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
const { creditPlatform, ENTRY_TYPES } = require('../services/platformLedger');

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

async function recordListingView(listingId, sellerId, req, res) {
  if (req.user?.id && String(req.user.id) === String(sellerId)) return false;

  const viewerCookie = ensureViewerCookie(req, res);
  const viewerKey = listingViewerKey(req, viewerCookie);
  const ip = hashIp(req);

  try {
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

function slimListingImages(images) {
  if (!Array.isArray(images) || !images.length) return [];
  const first = images[0];
  if (typeof first !== 'string' || !first.trim()) return [];
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
  'bonds',
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

// RESTORE_MARKER: remainder of routes must exist — if build fails, pull from git history 081d5f01
module.exports = router;
module.exports.normalizeBuyerFields = normalizeBuyerFields;
module.exports.validateBuyerData = validateBuyerData;
module.exports.DEFAULT_AUTO_BUYER_FIELDS = DEFAULT_AUTO_BUYER_FIELDS;
module.exports.LISTING_TYPES = LISTING_TYPES;
