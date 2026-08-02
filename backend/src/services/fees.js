/**
 * Lootz fees: Playerok-like tiers, ~2.5% lower.
 * Playerok ~10% / ~20%  →  Lootz 7.5% / 17.5%
 *
 * 7.5%: донат, подписки, пополнение баланса, ключи, скины, игры
 * 17.5%: всё остальное
 */

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
]);

function resolveFeePercent({ categorySlug, listingType } = {}) {
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) {
    return FEE_REDUCED;
  }
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) {
    return FEE_REDUCED;
  }
  return FEE_STANDARD;
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
  };
}

function feePercentForCategorySlug(slug) {
  return resolveFeePercent({ categorySlug: slug });
}

module.exports = {
  FEE_REDUCED,
  FEE_STANDARD,
  PLATFORM_FEE_PERCENT: FEE_REDUCED, // legacy default (reduced tier)
  REDUCED_CATEGORY_SLUGS,
  REDUCED_LISTING_TYPES,
  resolveFeePercent,
  calcPlatformFee,
  feePercentForCategorySlug,
};
