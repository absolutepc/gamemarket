/**
 * Lootz fees: like Playerok, but 2.5% lower.
 * 7.5% / 17.5% standard; Founders: 5% / 13%.
 *
 * Game overrides (force standard 17.5% even if type is globally reduced):
 * - Arena Breakout (mobile, not Infinite): boosting + item
 * - Brawl Stars: boosting + promotion / promo_actions
 * - Clash of Clans: boosting + promotion / promo_actions + capital_gold
 * - Standoff 2: boosting + promocodes
 * - Clash Royale: boosting + promotion / promo_actions
 * - EA SPORTS FC Mobile: promocodes + boosting + account (аккаунты с монетами)
 * - Black Russia: item + promocodes + boosting
 * - Mobile Legends: boosting
 * - CoD Mobile: item + boosting
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
  // mobile game currencies / extras (stay reduced unless forced)
  'cp',
  'battle_pass',
  'points',
  'gems',
  'gold_pass',
  'charisma',
  'friends',
  'virts',
  'bc',
  'account_virts',
  'callbacks',
  'capital_gold',
  'promo_actions',
]);

/** Normalize game name for matching */
function normGame(game) {
  return String(game || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Arena Breakout (mobile only — not Infinite) */
export const ARENA_BREAKOUT_FORCE_STANDARD = new Set(['boosting', 'item']);

export function isArenaBreakoutGame(game) {
  const n = normGame(game);
  if (!n || n.includes('infinite')) return false;
  return n === 'arena breakout' || n.startsWith('arena breakout ');
}

/**
 * Per-game force-standard sets.
 * Key matchers are checked against normalized game name.
 * Types listed force 17.5% (or Founders 13%) even if in REDUCED_LISTING_TYPES.
 */
const FORCE_STANDARD_RULES = [
  {
    match: (n) => n === 'arena breakout' || n.startsWith('arena breakout '),
    exclude: (n) => n.includes('infinite'),
    types: new Set(['boosting', 'item']),
  },
  {
    match: (n) => n === 'brawl stars' || n.includes('brawl stars'),
    types: new Set(['boosting', 'promotion', 'promo_actions']),
  },
  {
    match: (n) => n === 'clash of clans' || n.includes('clash of clans'),
    types: new Set(['boosting', 'promotion', 'promo_actions', 'capital_gold']),
  },
  {
    match: (n) => n === 'standoff 2' || n.startsWith('standoff 2') || n === 'standoff2',
    types: new Set(['boosting', 'promocodes']),
  },
  {
    match: (n) => n === 'clash royale' || n.includes('clash royale'),
    types: new Set(['boosting', 'promotion', 'promo_actions']),
  },
  {
    match: (n) =>
      n === 'ea sports fc mobile'
      || n === 'fc mobile'
      || n.includes('ea sports fc mobile')
      || (n.includes('fc mobile') && !n.includes('fc 2')),
    types: new Set(['promocodes', 'boosting', 'account', 'account_virts', 'coins']),
  },
  {
    match: (n) => n === 'black russia' || n.includes('black russia'),
    types: new Set(['item', 'promocodes', 'boosting']),
  },
  {
    match: (n) =>
      n === 'mobile legends'
      || n.includes('mobile legends')
      || n === 'mlbb'
      || n.includes('mobile legends bang bang'),
    types: new Set(['boosting']),
  },
  {
    match: (n) =>
      n === 'cod mobile'
      || n === 'call of duty mobile'
      || n.includes('cod mobile')
      || n.includes('call of duty mobile'),
    types: new Set(['item', 'boosting']),
  },
];

/**
 * Returns true if this game+listingType combination must use standard (17.5%) fee.
 */
export function forcesStandardFee(listingType, game) {
  if (!listingType || !game) return false;
  const n = normGame(game);
  if (!n) return false;
  for (const rule of FORCE_STANDARD_RULES) {
    if (rule.exclude && rule.exclude(n)) continue;
    if (rule.match(n) && rule.types.has(listingType)) return true;
  }
  return false;
}

export function isReducedFeeListingType(listingType, game) {
  if (forcesStandardFee(listingType, game)) return false;
  return REDUCED_LISTING_TYPES.has(listingType);
}

function isReducedTier({ categorySlug, listingType, game } = {}) {
  if (forcesStandardFee(listingType, game)) return false;
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

/** Helpers used by UI */
export function formatFeePercent(percent) {
  return `${((percent || 0) * 100).toFixed(1)}%`;
}

export function calcSellerReceives(price, percent) {
  const amount = parseFloat(price) || 0;
  const fee = parseFloat((amount * (percent || 0)).toFixed(2));
  return parseFloat((amount - fee).toFixed(2));
}
