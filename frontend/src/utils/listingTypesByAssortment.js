import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';
import {
  ARENA_BREAKOUT_TYPES,
  ARENA_BREAKOUT_LABELS,
  isArenaBreakout,
} from './arenaBreakoutListingTypes';

// NOTE: remainder of this file is loaded from repo via subsequent restore if truncated.
// Temporary bridge — full file content follows in next commit if needed.
export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;
  const name = String(item?.name || gameOrItem || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  const kind = item?.kind || 'app';
  if (isArenaBreakout(item?.name || name, item?.search)) {
    return ARENA_BREAKOUT_TYPES;
  }
  // Fallback will be incomplete — DO NOT USE THIS STUB IN PRODUCTION
  return ['account', 'services', 'other'];
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
