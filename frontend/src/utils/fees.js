/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * 7.5% / 17.5% standard; Founders: 5% / 13%.
 *
 * Game overrides:
 * Arena Breakout (mobile, not Infinite): boosting + item → standard 17.5%.
 */

export const FEE_REDUCED = 0.075;
export const FEE_STANDARD = 0.175;
export const FEE_FOUNDERS_REDUCED = 0.05;
export const FEE_FOUNDERS_STANDARD = 0.13;

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
  'bonds',
  // PUBG Mobile currency
  'uc',
]);

/** For Arena Breakout only: force standard fee even if type is globally reduced. */
export const ARENA_BREAKOUT_FORCE_STANDARD = new Set(['boosting', 'item']);

export function isArenaBreakoutGame(game) {
  const n = String(game || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  if (!n || n.includes('infinite')) return false;
  return n === 'arena breakout' || n.startsWith('arena breakout ');
}

export function isReducedFeeListingType(listingType, game) {
  if (
    listingType
    && isArenaBreakoutGame(game)
    && ARENA_BREAKOUT_FORCE_STANDARD.has(listingType)
  ) {
    return false;
  }
  return REDUCED_LISTING_TYPES.has(listingType);
}

function isReducedTier({ categorySlug, listingType, game } = {}) {
  if (
    listingType
    && isArenaBreakoutGame(game)
    && ARENA_BREAKOUT_FORCE_STANDARD.has(listingType)
  ) {
    return false;
  }
  if (listingType && REDUCED_LISTING_TYPES.has(listingType)) return true;
  if (categorySlug && REDUCED_CATEGORY_SLUGS.has(categorySlug)) return true;
  return false;
}

function isFoundingFlag(isFoundingSeller) {
  return isFoundingSeller === true || isFoundingSeller === 't' || isFoundingSeller === 1;
}

/** Reduced-tier rate only (7.5% or Founders 5%) — for badges / «Платёж» filter. */
export function resolveReducedFeePercent(isFoundingSeller) {
  return isFoundingFlag(isFoundingSeller) ? FEE_FOUNDERS_REDUCED : FEE_REDUCED;
}

export function resolveFeePercent({ categorySlug, listingType, isFoundingSeller, game } = {}) {
  const reduced = isReducedTier({ categorySlug, listingType, game });
  const founding = isFoundingFlag(isFoundingSeller);
  if (founding) {
    return reduced ? FEE_FOUNDERS_REDUCED : FEE_FOUNDERS_STANDARD;
  }
  return reduced ? FEE_REDUCED : FEE_STANDARD;
}

export function calcPlatformFee(price, opts = {}) {
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

export function feePercentForCategorySlug(slug) {
  return resolveFeePercent({ categorySlug: slug });
}
