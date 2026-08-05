/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * Standard: 7.5% / 17.5%
 * Founders: 5% / 13%
 *
 * Game overrides:
 * Arena Breakout (mobile, not Infinite): boosting + item → standard 17.5%.
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
  'bonds',
  // PUBG Mobile currency
  'uc',
]);

const ARENA_BREAKOUT_FORCE_STANDARD = new Set(['boosting', 'item']);

function isArenaBreakoutGame(game) {
  const n = String(game || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  if (!n || n.includes('infinite')) return false;
  return n === 'arena breakout' || n.startsWith('arena breakout ');
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

function resolveFeePercent({ categorySlug, listingType, isFoundingSeller, game } = {}) {
  const reduced = isReducedTier({ categorySlug, listingType, game });
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
  PLATFORM_FEE_PERCENT: FEE_REDUCED,
  REDUCED_CATEGORY_SLUGS,
  REDUCED_LISTING_TYPES,
  ARENA_BREAKOUT_FORCE_STANDARD,
  isArenaBreakoutGame,
  isReducedTier,
  resolveFeePercent,
  calcPlatformFee,
  feePercentForCategorySlug,
};
