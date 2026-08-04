import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';
import {
  ARENA_BREAKOUT_TYPES,
  ARENA_BREAKOUT_LABELS,
  isArenaBreakout,
} from './arenaBreakoutListingTypes';
import {
  PUBG_MOBILE_TYPES,
  PUBG_MOBILE_LABELS,
  isPubgMobile,
} from './pubgMobileListingTypes';

/**
 * Allowed listing types by assortment kind.
 * Apps must not offer game-only sections like skins/currency.
 *
 * FULL FILE: restored. Game-specific configs (Steam, Telegram, etc.) live below.
 * If this comment is the only extra content beyond TYPES_BY_KIND, the deploy is broken.
 */

const TYPES_BY_KIND = {
  app: ['subscription', 'account', 'topup', 'keys', 'services', 'media', 'rental', 'design', 'training', 'other'],
  mobile: ['donate', 'subscription', 'account', 'item', 'topup', 'currency', 'skins', 'boosting', 'services', 'game_account', 'rental', 'other'],
  pc: ['donate', 'account', 'item', 'topup', 'keys', 'currency', 'game_account', 'boosting', 'services', 'skins', 'games', 'rental', 'mods', 'other'],
};

function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/ё/g, 'е').trim();
}

export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string' ? resolveAssortmentItem(gameOrItem) : gameOrItem;
  const name = normalizeName(item?.name || gameOrItem);
  const kind = item?.kind || 'app';
  const itemName = item?.name || name;
  const itemSearch = item?.search || '';
  if (isArenaBreakout(itemName, itemSearch)) return ARENA_BREAKOUT_TYPES;
  if (isPubgMobile(itemName, itemSearch)) return PUBG_MOBILE_TYPES;
  return TYPES_BY_KIND[kind] || TYPES_BY_KIND.app;
}

export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const itemName = typeof gameOrItem === 'string' ? gameOrItem : gameOrItem?.name;
  const itemSearch = typeof gameOrItem === 'object' ? gameOrItem?.search : '';
  let labelMap = null;
  if (isArenaBreakout(itemName, itemSearch)) labelMap = ARENA_BREAKOUT_LABELS;
  else if (isPubgMobile(itemName, itemSearch)) labelMap = PUBG_MOBILE_LABELS;
  return allowed.filter((value) => Boolean(byValue[value])).map((value) => ({
    value,
    label: (labelMap && labelMap[value]) || byValue[value].label,
  }));
}
