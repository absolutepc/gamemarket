/**
 * Lootz fees: Playerok-like tiers, ~2.5% lower.
 * Playerok ~10% / ~20%  →  Lootz 7.5% / 17.5%
 * Founders: 5% / 13%
 *
 * 7.5% (5% founders): донат, подписки, пополнение, ключи, валюта, карты, премиум-тиры и т.п.
 * 17.5% (13% founders): всё остальное
 */

const { FEE_FOUNDERS_REDUCED, FEE_FOUNDERS_STANDARD } = require('./founders');

const FEE_REDUCED = 0.075;
const FEE_STANDARD = 0.175;

const REDUCED_CATEGORY_SLUGS = new Set([
  'subscriptions',
  'topups',
]);

const REDUCED_LISTING_TYPES = new Set([
  'subscription',
  'donate',
  'topup',
  'keys',
  'skins',
  'games',
  'item',
  'giftcard',
  'stars',
  'nft_gifts',
  'stickers',
  'coins',
  'promotion',
  'boosting',
  'game_account',
  'packs',
  'license',
  'software',
  'ps_plus',
  'ea_play',
  'premium',
  'youtube_music',
  'youtube_tv',
  'game_pass',
  'ubisoft_plus',
  'voices',
  'vk_music',
  'vk_play',
  'bits',
  'tariff',
  'tokens',
  'diamonds',
  'superlikes',
  'beans',
  'promocodes',
  'plugins',
  'zems',
  'mochi',
  'gold',
  'elixir',
  'trovo_ace',
  'mana',
  'addons',
  'nitro',
  'decorations',
  'nintendo_switch_online',
]);

function isReducedTier({ categorySlug, listingType } = {}) {
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) return true;
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) return true;
  return false;
}

function resolveFeePercent({ categorySlug, listingType, isFoundingSeller } = {}) {
  const reduced = isReducedTier({ categorySlug, listingType });
  const founding = isFoundingSeller === true || isFoundingSeller === 't' || isFoundingSeller === 1;
  if (founding) {
    return reduced ? FEE_FOUNDERS_REDUCED : FEE_FOUNDERS_STANDARD;
  }
  return reduced ? FEE_REDUCED : FEE_STANDARD;
}

function calcPlatformFee(price, opts = {}) {
  const percent = resolveFeePercent(opts);
  const amount = parseFloat(price) || 0;
  const fee = parseFloat((amount * percent).toFixed(2));
  const sellerReceives = parseFloat((amount - fee).toFixed(2));
  return {
    feePercent: percent,
    feePercentLabel: `${(percent * 100).toFixed(1)}%`,
    fee,
    sellerReceives,
    isFoundingSeller: Boolean(opts.isFoundingSeller),
  };
}

function feePercentForCategorySlug(slug) {
  return resolveFeePercent({ categorySlug: slug });
}

module.exports = {
  FEE_REDUCED,
  FEE_STANDARD,
  FEE_FOUNDERS_REDUCED,
  FEE_FOUNDERS_STANDARD,
  PLATFORM_FEE_PERCENT: FEE_REDUCED, // legacy default (reduced tier)
  REDUCED_CATEGORY_SLUGS,
  REDUCED_LISTING_TYPES,
  isReducedTier,
  resolveFeePercent,
  calcPlatformFee,
  feePercentForCategorySlug,
};
