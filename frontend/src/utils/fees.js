/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * 7.5%: донат, подписки, пополнение, ключи, валюта, карты, премиум-тиры и т.п.
 * 17.5%: всё остальное
 */

export const FEE_REDUCED = 0.075;
export const FEE_STANDARD = 0.175;

const REDUCED_CATEGORY_SLUGS = new Set([
  'subscriptions',
  'topups',
]);

export const REDUCED_LISTING_TYPES = new Set([
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

export function isReducedFeeListingType(listingType) {
  return REDUCED_LISTING_TYPES.has(listingType);
}

export function resolveFeePercent({ categorySlug, listingType } = {}) {
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) return FEE_REDUCED;
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) return FEE_REDUCED;
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
