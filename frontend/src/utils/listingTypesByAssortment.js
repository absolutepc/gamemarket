import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';
import {
  ARENA_BREAKOUT_TYPES,
  ARENA_BREAKOUT_LABELS,
  isArenaBreakoutFamily,
} from './arenaBreakoutListingTypes';
import {
  PUBG_MOBILE_TYPES,
  PUBG_MOBILE_LABELS,
  isPubgMobile,
} from './pubgMobileListingTypes';

/**
 * Allowed listing types by assortment kind.
 * Apps must not offer game-only sections like skins/currency.
 */

const TYPES_BY_KIND = {
  app: ['subscription', 'account', 'topup', 'keys', 'services', 'media', 'rental', 'design', 'training', 'other'],
  mobile: ['donate', 'subscription', 'account', 'item', 'topup', 'currency', 'skins', 'boosting', 'services', 'game_account', 'rental', 'other'],
  pc: ['donate', 'account', 'item', 'topup', 'keys', 'currency', 'game_account', 'boosting', 'services', 'skins', 'games', 'rental', 'mods', 'other'],
};

function resolveContext(gameOrItem) {
  const raw = typeof gameOrItem === 'string'
    ? gameOrItem
    : (gameOrItem?.name || gameOrItem?.search || '');
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;
  const itemName = item?.name || raw;
  const itemSearch = item?.search || '';
  const kind = item?.kind || 'app';
  return { raw, item, itemName, itemSearch, kind };
}

function isArenaFamilyContext(ctx) {
  return (
    isArenaBreakoutFamily(ctx.itemName, ctx.itemSearch)
    || isArenaBreakoutFamily(ctx.raw, '')
    || isArenaBreakoutFamily(ctx.itemName, '')
    || isArenaBreakoutFamily(ctx.itemSearch, '')
  );
}

export function allowedListingTypesForAssortment(gameOrItem) {
  const ctx = resolveContext(gameOrItem);
  if (isArenaFamilyContext(ctx)) {
    return ARENA_BREAKOUT_TYPES;
  }
  if (isPubgMobile(ctx.itemName, ctx.itemSearch) || isPubgMobile(ctx.raw, '')) {
    return PUBG_MOBILE_TYPES;
  }
  return TYPES_BY_KIND[ctx.kind] || TYPES_BY_KIND.app;
}

export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const ctx = resolveContext(gameOrItem);
  let labelMap = null;
  if (isArenaFamilyContext(ctx)) {
    labelMap = ARENA_BREAKOUT_LABELS;
  } else if (isPubgMobile(ctx.itemName, ctx.itemSearch) || isPubgMobile(ctx.raw, '')) {
    labelMap = PUBG_MOBILE_LABELS;
  }
  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
