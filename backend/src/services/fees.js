/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * Standard: 7.5% / 17.5%
 * Founders: 5% / 13%
 *
 * Game overrides (force standard even if type is globally reduced):
 * - Arena Breakout: boosting, item
 * - Brawl Stars: boosting, promo_actions
 * - Clash of Clans: boosting, promo_actions, capital_gold
 * - Standoff 2: boosting, promocodes
 * - Clash Royale: boosting, promo_actions
 * - EA SPORTS FC Mobile: promocodes, boosting, game_account
 * - Black Russia: item, promocodes, boosting
 * - Mobile Legends: boosting
 * - CoD Mobile: item, boosting
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
  'uc',
  'cp',
  'battle_pass',
  'points',
  'gems',
  'gold_pass',
  'virts',
  'bc',
  'account_virts',
  'capital_gold',
  'promo_actions',
]);

function normGame(game) {
  return String(game || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

const ARENA_BREAKOUT_FORCE_STANDARD = new Set(['boosting', 'item']);

function isArenaBreakoutGame(game) {
  const n = normGame(game);
  if (!n || n.includes('infinite')) return false;
  return n === 'arena breakout' || n.startsWith('arena breakout ');
}

const FORCE_STANDARD_BY_GAME = [
  {
    match: (n) =>
      n === 'brawl stars'
      || n.startsWith('brawl stars')
      || n === 'бравл старс'
      || n.startsWith('бравл старс'),
    types: new Set(['boosting', 'promo_actions']),
  },
  {
    match: (n) =>
      n === 'clash of clans'
      || n.includes('clash of clans')
      || n.includes('клеш оф клан')
      || n.includes('клэш оф клан'),
    types: new Set(['boosting', 'promo_actions', 'capital_gold']),
  },
  {
    match: (n) =>
      n === 'standoff 2'
      || n === 'standoff2'
      || n.startsWith('standoff 2')
      || n === 'стандофф 2'
      || n.startsWith('стандофф 2'),
    types: new Set(['boosting', 'promocodes']),
  },
  {
    match: (n) =>
      n === 'clash royale'
      || n.includes('clash royale')
      || n.includes('клеш рояль')
      || n.includes('клэш рояль'),
    types: new Set(['boosting', 'promo_actions']),
  },
  {
    match: (n) =>
      n === 'ea sports fc mobile'
      || n === 'fc mobile'
      || n === 'fifa mobile'
      || ((n.includes('fc mobile') || n.includes('fifa mobile')) && !n.includes('ultimate'))
      || (n.includes('ea sports fc') && n.includes('mobile')),
    types: new Set(['promocodes', 'boosting', 'game_account']),
  },
  {
    match: (n) =>
      n === 'black russia'
      || n === 'br'
      || n.includes('black russia')
      || n.includes('блэк раша')
      || n.includes('блек раша'),
    types: new Set(['item', 'promocodes', 'boosting']),
  },
  {
    match: (n) =>
      n === 'mobile legends'
      || n.includes('mobile legends')
      || n.includes('мобайл легенд')
      || n === 'mlbb',
    types: new Set(['boosting']),
  },
  {
    match: (n) =>
      n === 'call of duty: mobile'
      || n === 'call of duty mobile'
      || n === 'cod mobile'
      || n === 'codm'
      || (n.includes('call of duty') && n.includes('mobile') && !n.includes('warzone'))
      || (n.includes('колл оф дьюти') && n.includes('мобайл')),
    types: new Set(['item', 'boosting']),
  },
];

function forcesStandardFee(listingType, game) {
  if (!listingType) return false;
  if (isArenaBreakoutGame(game) && ARENA_BREAKOUT_FORCE_STANDARD.has(listingType)) {
    return true;
  }
  const n = normGame(game);
  if (!n) return false;
  for (const entry of FORCE_STANDARD_BY_GAME) {
    if (entry.match(n) && entry.types.has(listingType)) return true;
  }
  return false;
}

function isReducedTier({ categorySlug, listingType, game } = {}) {
  if (forcesStandardFee(listingType, game)) return false;
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
  forcesStandardFee,
  isReducedTier,
  resolveFeePercent,
  calcPlatformFee,
  feePercentForCategorySlug,
};
