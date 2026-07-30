/**
 * Lootz fees: Playerok-like tiers, ~2.5% lower.
 * Playerok ~10% / ~20%  →  Lootz 7.5% / 17.5%
 */

const FEE_REDUCED = 0.075; // подписки, пополнения, карты, ИИ
const FEE_STANDARD = 0.175; // аккаунты, предметы, валюта, бусты и пр.

const REDUCED_CATEGORY_SLUGS = new Set([
  'subscriptions',
  'topups',
  'gift-cards',
  'ai-services',
]);

const REDUCED_LISTING_TYPES = new Set([
  'subscription',
  'topup',
  'giftcard',
]);

function resolveFeePercent({ categorySlug, listingType } = {}) {
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) {
    return FEE_REDUCED;
  }
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) {
    return FEE_REDUCED;
  }
  // If category explicitly exists and is not reduced → standard
  if (categorySlug) {
    return FEE_STANDARD;
  }
  // No category: fall back to listing type (already checked reduced), else standard
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
