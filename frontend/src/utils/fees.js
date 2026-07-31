/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * Reduced 7.5% / Standard 17.5%
 */

export const FEE_REDUCED = 0.075;
export const FEE_STANDARD = 0.175;

const REDUCED_CATEGORY_SLUGS = new Set([
  'subscriptions',
  'topups',
  'gift-cards',
  'ai-services',
]);

const REDUCED_LISTING_TYPES = new Set([
  'subscription',
  'donate',
  'topup',
  'keys',
  'giftcard',
]);

export function resolveFeePercent({ categorySlug, listingType } = {}) {
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) return FEE_REDUCED;
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) return FEE_REDUCED;
  return FEE_STANDARD;
}

export function formatFeePercent(percent) {
  return `${(percent * 100).toFixed(1).replace(/\.0$/, '')}%`;
}

export function calcSellerReceives(price, percent) {
  const amount = parseFloat(price) || 0;
  const fee = amount * percent;
  return {
    fee,
    sellerReceives: amount - fee,
  };
}
