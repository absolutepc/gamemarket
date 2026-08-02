import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';

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

/** Game store / launcher platforms that are kind:app but sell game goods */
const GAME_PLATFORM_TYPES = [
  'donate',
  'subscription',
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
];

const GAME_PLATFORM_NAMES = new Set([
  'epic games',
  'nintendo',
  'ea play',
  'origin',
  'ubisoft',
  'gog',
  'riot',
  'valorant',
]);

/** Social / content apps — no game currency/skins */
const SOCIAL_APP_TYPES = [
  'subscription',
  'account',
  'topup',
  'services',
  'media',
  'rental',
  'other',
];

const SOCIAL_APP_NAMES = new Set([
  'discord',
  'вконтакте',
  'likee',
  'twitch',
]);

/** AI tools / нейросети — только 4 основных типа */
const AI_SERVICE_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

/** DeepSeek: вместо подписки — пополнение баланса */
const DEEPSEEK_TYPES = [
  'topup',
  'account',
  'services',
  'other',
];

/** Kling: базовые 4 типа ИИ + пополнение баланса */
const KLING_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
  'topup',
];

/**
 * Apple — разделы как на Playerok.
 * Порядок важен: так показываем в визарде.
 */
const APPLE_TYPES = [
  'giftcard',
  'game_account',
  'subscription',
  'clean_account',
  'other',
  'services',
  'region_change',
  'rental',
];

const APPLE_LABELS = {
  giftcard: 'Подарочные карты',
  game_account: 'Аккаунты с играми',
  subscription: 'Подписки',
  clean_account: 'Чистые аккаунты',
  other: 'Другое',
  services: 'Услуги',
  region_change: 'Смена региона',
  rental: 'Аренда',
};

/** Soundcloud */
const SOUNDCLOUD_TYPES = [
  'subscription',
  'other',
  'services',
  'account',
];

const SOUNDCLOUD_LABELS = {
  subscription: 'Подписки',
  other: 'Другое',
  services: 'Услуги',
  account: 'Аккаунты',
};

/** Spotify */
const SPOTIFY_TYPES = [
  'subscription',
  'mods',
  'account',
  'region_change',
  'other',
  'services',
];

const SPOTIFY_LABELS = {
  subscription: 'Подписка',
  mods: 'Моды',
  account: 'Аккаунты',
  region_change: 'Смена региона',
  other: 'Другое',
  services: 'Услуги',
};

/** Steam */
const STEAM_TYPES = [
  'topup',
  'games',
  'region_change',
  'game_account',
  'clean_account',
  'item',
  'services',
  'other',
  'steam_rewards',
  'rental',
];

const STEAM_LABELS = {
  topup: 'Пополнение баланса',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  clean_account: 'Чистые аккаунты',
  item: 'Предметы',
  services: 'Услуги',
  other: 'Другое',
  steam_rewards: 'Награды Steam',
  rental: 'Аренда',
};

/** Telegram */
const TELEGRAM_TYPES = [
  'stars',
  'premium',
  'nft_gifts',
  'services',
  'channels',
  'usernames',
  'other',
  'advertising',
  'rental',
  'bots',
  'mods',
  'groups',
  'boosting',
  'stickers',
  'design',
  'clickers',
];

const TELEGRAM_LABELS = {
  stars: 'Звезды',
  premium: 'Премиум',
  nft_gifts: 'Подарки (NFT)',
  services: 'Услуги',
  channels: 'Каналы',
  usernames: 'Юзернеймы',
  other: 'Другое',
  advertising: 'Реклама',
  rental: 'Аренда',
  bots: 'Боты',
  mods: 'Моды',
  groups: 'Группы',
  boosting: 'Бусты',
  stickers: 'Стикеры',
  design: 'Дизайн',
  clickers: 'Кликеры',
};

/** TikTok */
const TIKTOK_TYPES = [
  'coins',
  'account',
  'services',
  'promotion',
  'mods',
  'montage',
  'other',
  'advertising',
  'design',
  'subscription',
];

const TIKTOK_LABELS = {
  coins: 'Монеты',
  account: 'Аккаунты',
  services: 'Услуги',
  promotion: 'Продвижение',
  mods: 'Моды',
  montage: 'Монтаж',
  other: 'Другое',
  advertising: 'Реклама',
  design: 'Дизайн',
  subscription: 'Подписки',
};

/** PlayStation */
const PLAYSTATION_TYPES = [
  'topup',
  'ps_plus',
  'game_account',
  'games',
  'clean_account',
  'rental',
  'ea_play',
  'services',
  'other',
];

const PLAYSTATION_LABELS = {
  topup: 'Пополнение бумажника',
  ps_plus: 'PS Plus',
  game_account: 'Аккаунты с играми',
  games: 'Игры',
  clean_account: 'Чистые аккаунты',
  rental: 'Аренда',
  ea_play: 'EA Play',
  services: 'Услуги',
  other: 'Другое',
};

/** Xbox */
const XBOX_TYPES = [
  'game_pass',
  'topup',
  'games',
  'account',
  'clean_account',
  'services',
  'region_change',
  'other',
  'ubisoft_plus',
];

const XBOX_LABELS = {
  game_pass: 'Game Pass',
  topup: 'Пополнение баланса',
  games: 'Игры',
  account: 'Аккаунты',
  clean_account: 'Чистые аккаунты',
  services: 'Услуги',
  region_change: 'Смена региона',
  other: 'Другое',
  ubisoft_plus: 'Ubisoft+',
};

/** Google Play */
const GOOGLE_PLAY_TYPES = [
  'clean_account',
  'subscription',
  'giftcard',
  'games',
  'region_change',
  'game_account',
  'other',
  'services',
];

const GOOGLE_PLAY_LABELS = {
  clean_account: 'Чистые аккаунты',
  subscription: 'Подписки',
  giftcard: 'Подарочные карты',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  other: 'Другое',
  services: 'Услуги',
};

/** Battle.net */
const BATTLENET_TYPES = [
  'topup',
  'games',
  'region_change',
  'game_account',
  'services',
  'other',
];

const BATTLENET_LABELS = {
  topup: 'Пополнение баланса',
  games: 'Игры',
  region_change: 'Смена региона',
  game_account: 'Аккаунты с играми',
  services: 'Услуги',
  other: 'Другое',
};

/** Adobe */
const ADOBE_TYPES = [
  'other',
  'subscription',
  'license',
  'account',
  'services',
  'design',
];

const ADOBE_LABELS = {
  other: 'Другое',
  subscription: 'Подписка',
  license: 'Лицензия',
  account: 'Аккаунты',
  services: 'Услуги',
  design: 'Дизайн',
};

/** Faceit */
const FACEIT_TYPES = [
  'subscription',
  'services',
  'account',
  'rental',
  'boosting',
  'other',
];

const FACEIT_LABELS = {
  subscription: 'Подписка',
  services: 'Услуги',
  account: 'Аккаунты',
  rental: 'Аренда',
  boosting: 'Буст',
  other: 'Другое',
};

/** Rockstar Games */
const ROCKSTAR_TYPES = [
  'clean_account',
  'keys',
  'game_account',
  'services',
  'other',
  'rental',
  'boosting',
];

const ROCKSTAR_LABELS = {
  clean_account: 'Чистые аккаунты',
  keys: 'Ключи',
  game_account: 'Аккаунты с играми',
  services: 'Услуги',
  other: 'Другое',
  rental: 'Аренда',
  boosting: 'Буст',
};

/** Windows */
const WINDOWS_TYPES = [
  'license',
  'software',
  'other',
  'services',
];

const WINDOWS_LABELS = {
  license: 'Лицензия',
  software: 'Программное обеспечение',
  other: 'Другое',
  services: 'Услуги',
};

/** YouTube */
const YOUTUBE_TYPES = [
  'premium',
  'channels',
  'mods',
  'services',
  'youtube_music',
  'advertising',
  'montage',
  'design',
  'other',
  'youtube_tv',
];

const YOUTUBE_LABELS = {
  premium: 'Премиум',
  channels: 'Каналы',
  mods: 'Моды',
  services: 'Услуги',
  youtube_music: 'YouTube Music',
  advertising: 'Реклама',
  montage: 'Монтаж',
  design: 'Дизайн',
  other: 'Другое',
  youtube_tv: 'YouTube TV',
};

const AI_SERVICE_NAMES = new Set([
  'cursor',
  'claude',
  'чатгпт',
  'chatgpt',
  'grok',
  'gemini (nano banana)',
  'gemini',
  'kimi',
  'perplexity',
  'нейросети',
  'runway',
  'deepseek',
  'midjourney',
  'character ai',
  'gamma',
  'copilot',
  'leonardo ai',
  'suno',
  'openai',
  'kling',
]);

const AI_NAME_RE = /\b(ai|gpt|claude|cursor|gemini|grok|kimi|llm|нейро|kling)\b|чатгпт|midjourney|perplexity|deepseek|runway|copilot|leonardo|character\.?\s*ai/i;

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

function isDeepSeek(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'deepseek' || n.startsWith('deepseek ') || s.includes('deepseek');
}

function isKling(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'kling' || n.startsWith('kling ') || s.includes('kling');
}

function isApple(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'apple' || n.startsWith('apple ') || s.includes('apple') || n === 'app store';
}

function isSoundcloud(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'soundcloud' || n.startsWith('soundcloud ') || s.includes('soundcloud');
}

function isSpotify(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'spotify' || n.startsWith('spotify ') || s.includes('spotify');
}

function isSteam(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'steam' || n.startsWith('steam ') || s.includes('steam');
}

function isTelegram(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'telegram' || n.startsWith('telegram ') || s.includes('telegram');
}

function isTiktok(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'tiktok' || n.startsWith('tiktok ') || s.includes('tiktok');
}

function isPlaystation(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'playstation'
    || n.startsWith('playstation ')
    || n === 'ps5'
    || n === 'ps4'
    || n === 'psn'
    || s.includes('playstation')
  );
}

function isXbox(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'xbox' || n.startsWith('xbox ') || s.includes('xbox');
}

function isGooglePlay(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'google play'
    || n === 'googleplay'
    || n.startsWith('google play ')
    || s.includes('google play')
    || s.includes('googleplay')
  );
}

function isBattlenet(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'battle.net'
    || n === 'battlenet'
    || n === 'battle net'
    || n.startsWith('battle.net ')
    || n.startsWith('battlenet ')
    || s.includes('battle.net')
    || s.includes('battlenet')
  );
}

function isAdobe(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'adobe' || n.startsWith('adobe ') || s.includes('adobe');
}

function isFaceit(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'faceit' || n.startsWith('faceit ') || s.includes('faceit');
}

function isRockstar(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return (
    n === 'rockstar games'
    || n === 'rockstar'
    || n.startsWith('rockstar ')
    || s.includes('rockstar')
  );
}

function isWindows(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'windows' || n.startsWith('windows ') || s.includes('windows');
}

function isYoutube(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  return n === 'youtube' || n.startsWith('youtube ') || s.includes('youtube');
}

function isAiService(name, search = '') {
  const n = normalizeName(name);
  const s = normalizeName(search);
  if (AI_SERVICE_NAMES.has(n)) return true;
  if ([...AI_SERVICE_NAMES].some((x) => n === x || n.startsWith(`${x} `))) return true;
  return AI_NAME_RE.test(n) || AI_NAME_RE.test(s);
}

/**
 * Returns listing type values allowed for a selected assortment name/item.
 * Order is preserved for UI.
 */
export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;

  const name = normalizeName(item?.name || gameOrItem);
  const kind = item?.kind || 'app';

  if (isPlaystation(item?.name || name, item?.search)) {
    return PLAYSTATION_TYPES;
  }
  if (isXbox(item?.name || name, item?.search)) {
    return XBOX_TYPES;
  }
  if (isGooglePlay(item?.name || name, item?.search)) {
    return GOOGLE_PLAY_TYPES;
  }
  if (isBattlenet(item?.name || name, item?.search)) {
    return BATTLENET_TYPES;
  }
  if (isAdobe(item?.name || name, item?.search)) {
    return ADOBE_TYPES;
  }
  if (isFaceit(item?.name || name, item?.search)) {
    return FACEIT_TYPES;
  }
  if (isRockstar(item?.name || name, item?.search)) {
    return ROCKSTAR_TYPES;
  }
  if (isWindows(item?.name || name, item?.search)) {
    return WINDOWS_TYPES;
  }
  if (isYoutube(item?.name || name, item?.search)) {
    return YOUTUBE_TYPES;
  }
  if (isTelegram(item?.name || name, item?.search)) {
    return TELEGRAM_TYPES;
  }
  if (isTiktok(item?.name || name, item?.search)) {
    return TIKTOK_TYPES;
  }
  if (isSteam(item?.name || name, item?.search)) {
    return STEAM_TYPES;
  }
  if (isApple(item?.name || name, item?.search)) {
    return APPLE_TYPES;
  }
  if (isSpotify(item?.name || name, item?.search)) {
    return SPOTIFY_TYPES;
  }
  if (isSoundcloud(item?.name || name, item?.search)) {
    return SOUNDCLOUD_TYPES;
  }
  if (GAME_PLATFORM_NAMES.has(name) || [...GAME_PLATFORM_NAMES].some((n) => name.includes(n))) {
    return GAME_PLATFORM_TYPES;
  }
  if (isDeepSeek(item?.name || name, item?.search)) {
    return DEEPSEEK_TYPES;
  }
  if (isKling(item?.name || name, item?.search)) {
    return KLING_TYPES;
  }
  if (isAiService(item?.name || name, item?.search)) {
    return AI_SERVICE_TYPES;
  }
  if (SOCIAL_APP_NAMES.has(name)) {
    return SOCIAL_APP_TYPES;
  }

  return TYPES_BY_KIND[kind] || TYPES_BY_KIND.app;
}

/** LISTING_TYPE_OPTIONS filtered for the selected game/app (keeps allowed order) */
export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const itemName = typeof gameOrItem === 'string' ? gameOrItem : gameOrItem?.name;
  const itemSearch = typeof gameOrItem === 'object' ? gameOrItem?.search : '';
  const labelMap =
    (isPlaystation(itemName, itemSearch) && PLAYSTATION_LABELS)
    ||     (isXbox(itemName, itemSearch) && XBOX_LABELS)
    || (isGooglePlay(itemName, itemSearch) && GOOGLE_PLAY_LABELS)
    || (isBattlenet(itemName, itemSearch) && BATTLENET_LABELS)
    || (isAdobe(itemName, itemSearch) && ADOBE_LABELS)
    || (isFaceit(itemName, itemSearch) && FACEIT_LABELS)
    || (isRockstar(itemName, itemSearch) && ROCKSTAR_LABELS)
    || (isWindows(itemName, itemSearch) && WINDOWS_LABELS)
    || (isYoutube(itemName, itemSearch) && YOUTUBE_LABELS)
    || (isTelegram(itemName, itemSearch) && TELEGRAM_LABELS)
    || (isTiktok(itemName, itemSearch) && TIKTOK_LABELS)
    || (isSteam(itemName, itemSearch) && STEAM_LABELS)
    || (isApple(itemName, itemSearch) && APPLE_LABELS)
    || (isSpotify(itemName, itemSearch) && SPOTIFY_LABELS)
    || (isSoundcloud(itemName, itemSearch) && SOUNDCLOUD_LABELS)
    || null;

  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
