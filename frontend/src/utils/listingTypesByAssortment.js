import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';
import {
  ARENA_BREAKOUT_TYPES,
  ARENA_BREAKOUT_LABELS,
  isArenaBreakout,
} from './arenaBreakoutListingTypes';

/**
 * Allowed listing types by assortment kind.
 * Apps must not offer game-only sections like skins/currency.
 */
const TYPES_BY_KIND = {
  app: [
    'subscription',
    'account',
    'topup',
    'keys',
    'services',
    'media',
    'rental',
    'design',
    'training',
    'other',
  ],
  mobile: [
    'donate',
    'subscription',
    'account',
    'item',
    'topup',
    'currency',
    'skins',
    'boosting',
    'services',
    'game_account',
    'rental',
    'other',
  ],
  pc: [
    'donate',
    'account',
    'item',
    'topup',
    'keys',
    'currency',
    'game_account',
    'boosting',
    'services',
    'skins',
    'games',
    'rental',
    'mods',
    'other',
  ],
};

// FILE WAS TRUNCATED IN PREVIOUS ATTEMPT - using push_files for full restore
export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;
  const name = String(item?.name || gameOrItem || '').toLowerCase().replace(/ё/g, 'е').trim();
  const kind = item?.kind || 'app';
  if (isArenaBreakout(item?.name || name, item?.search)) {
    return ARENA_BREAKOUT_TYPES;
  }
  return TYPES_BY_KIND[kind] || TYPES_BY_KIND.app;
}

export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const itemName = typeof gameOrItem === 'string' ? gameOrItem : gameOrItem?.name;
  const itemSearch = typeof gameOrItem === 'object' ? gameOrItem?.search : '';
  const labelMap = isArenaBreakout(itemName, itemSearch) ? ARENA_BREAKOUT_LABELS : null;
  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
