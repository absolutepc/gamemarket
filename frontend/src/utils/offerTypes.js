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
  clean_account: 'clean-accounts',
  boosting: 'boosting',
  services: 'services',
  skins: 'skins',
  games: 'games',
  media: 'media',
  rental: 'rental',
  region_change: 'region-change',
  mods: 'mods',
  design: 'design',
  training: 'training',
  giftcard: 'gift-cards',
  steam_rewards: 'steam-rewards',
  stars: 'stars',
  premium: 'premium',
  nft_gifts: 'nft-gifts',
  channels: 'channels',
  usernames: 'usernames',
  advertising: 'advertising',
  bots: 'bots',
  groups: 'groups',
  stickers: 'stickers',
  clickers: 'clickers',
  coins: 'coins',
  promotion: 'promotion',
  montage: 'montage',
  ps_plus: 'ps-plus',
  ea_play: 'ea-play',
  youtube_music: 'youtube-music',
  youtube_tv: 'youtube-tv',
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
    clean_account: 'чистые аккаунты',
    boosting: 'бусты',
    services: 'услуги',
    skins: 'скины',
    games: 'игры',
    media: 'медиа',
    rental: 'аренду',
    region_change: 'смену региона',
    mods: 'моды',
    design: 'дизайн',
    training: 'обучение',
    giftcard: 'подарочные карты',
    steam_rewards: 'награды Steam',
    stars: 'звёзды',
    premium: 'премиум',
    nft_gifts: 'подарки NFT',
    channels: 'каналы',
    usernames: 'юзернеймы',
    advertising: 'рекламу',
    bots: 'ботов',
    groups: 'группы',
    stickers: 'стикеры',
    clickers: 'кликеры',
    coins: 'монеты',
    promotion: 'продвижение',
    montage: 'монтаж',
    ps_plus: 'PS Plus',
    ea_play: 'EA Play',
  };
  return map[type] || 'товары';
}
