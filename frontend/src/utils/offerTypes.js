/** URL path segment ↔ listing_type for assortment landings */
export const OFFER_PATH_BY_TYPE = {
  subscription: 'subscriptions',
  donate: 'donate',
  account: 'accounts',
  item: 'items',
  topup: 'topup',
  keys: 'keys',
  other: 'other',
  currency: 'currency',
  game_account: 'game-accounts',
  boosting: 'boosting',
  services: 'services',
  skins: 'skins',
  games: 'games',
  media: 'media',
  rental: 'rental',
  mods: 'mods',
  design: 'design',
  training: 'training',
};

export const TYPE_BY_OFFER_PATH = Object.fromEntries(
  Object.entries(OFFER_PATH_BY_TYPE).map(([type, path]) => [path, type])
);

export function offerPathForType(type) {
  if (!type) return null;
  return OFFER_PATH_BY_TYPE[type] || null;
}

export function typeFromOfferPath(pathSeg) {
  if (!pathSeg) return '';
  return TYPE_BY_OFFER_PATH[String(pathSeg).toLowerCase()] || null;
}

export function offerTypeLabel(type) {
  const map = {
    subscription: 'подписку',
    donate: 'донат',
    account: 'аккаунты',
    item: 'предметы',
    topup: 'пополнение',
    keys: 'ключи',
    other: 'товары',
    currency: 'игровую валюту',
    game_account: 'аккаунты с играми',
    boosting: 'бусты',
    services: 'услуги',
    skins: 'скины',
    games: 'игры',
    media: 'медиа',
    rental: 'аренду',
    mods: 'моды',
    design: 'дизайн',
    training: 'обучение',
  };
  return map[type] || 'товары';
}
