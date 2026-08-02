/** Map listing_type → category slug for auto category_id on create */
export const LISTING_TYPE_CATEGORY_SLUG = {
  subscription: 'subscriptions',
  donate: 'topups',
  topup: 'topups',
  keys: 'gift-cards',
  skins: 'items',
  games: 'other',
  account: 'accounts',
  game_account: 'accounts',
  item: 'items',
  currency: 'game-currency',
  boosting: 'boosting',
  services: 'other',
  media: 'social',
  rental: 'other',
  mods: 'other',
  design: 'other',
  training: 'other',
  other: 'other',
  giftcard: 'gift-cards',
};

export function categoryIdForListingType(listingType, categories = []) {
  const slug = LISTING_TYPE_CATEGORY_SLUG[listingType];
  if (!slug || !categories?.length) return '';
  const found = categories.find((c) => c.slug === slug);
  return found?.id ? String(found.id) : '';
}
