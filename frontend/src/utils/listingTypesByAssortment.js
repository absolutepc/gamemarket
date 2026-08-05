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
import { resolveMobileGameOverride } from './mobileGamesListingTypes';

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

const GAME_PLATFORM_TYPES = [
  'donate', 'subscription', 'account', 'item', 'topup', 'keys', 'currency',
  'game_account', 'boosting', 'services', 'skins', 'games', 'rental', 'mods', 'other',
];

const STEAM_TYPES = ['topup', 'games', 'region_change', 'game_account', 'clean_account', 'item', 'services', 'other', 'steam_rewards', 'rental'];
const STEAM_LABELS = { topup: 'Пополнение', games: 'Игры', region_change: 'Смена региона', game_account: 'Аккаунты с играми', clean_account: 'Чистые аккаунты', item: 'Предметы', services: 'Услуги', other: 'Другое', steam_rewards: 'Награды Steam', rental: 'Аренда' };

const TELEGRAM_TYPES = ['stars', 'premium', 'nft_gifts', 'channels', 'usernames', 'bots', 'groups', 'stickers', 'clickers', 'advertising', 'boosting', 'mods', 'design', 'rental', 'services', 'other'];
const TELEGRAM_LABELS = { stars: 'Звезды', premium: 'Премиум', nft_gifts: 'Подарки (NFT)', channels: 'Каналы', usernames: 'Юзернеймы', bots: 'Боты', groups: 'Группы', stickers: 'Стикеры', clickers: 'Кликеры', advertising: 'Реклама', boosting: 'Буст', mods: 'Моды', design: 'Дизайн', rental: 'Аренда', services: 'Услуги', other: 'Другое' };

const TIKTOK_TYPES = ['coins', 'account', 'services', 'promotion', 'mods', 'montage', 'advertising', 'design', 'subscription', 'other'];
const TIKTOK_LABELS = { coins: 'Монеты', account: 'Аккаунты', services: 'Услуги', promotion: 'Продвижение', mods: 'Моды', montage: 'Монтаж', advertising: 'Реклама', design: 'Дизайн', subscription: 'Подписка', other: 'Другое' };

const DISCORD_TYPES = ['nitro', 'decorations', 'account', 'services', 'other', 'boosting'];
const DISCORD_LABELS = { nitro: 'Nitro', decorations: 'Украшения', account: 'Аккаунты', services: 'Услуги', other: 'Другое', boosting: 'Буст' };

const NETFLIX_TYPES = ['account', 'subscription', 'services', 'giftcard', 'other'];
const NETFLIX_LABELS = { account: 'Аккаунты', subscription: 'Подписка', services: 'Услуги', giftcard: 'Подарочные карты', other: 'Другое' };

const SPOTIFY_TYPES = ['subscription', 'mods', 'account', 'region_change', 'other', 'services'];
const SPOTIFY_LABELS = { subscription: 'Подписка', mods: 'Моды', account: 'Аккаунты', region_change: 'Смена региона', other: 'Другое', services: 'Услуги' };

const YOUTUBE_TYPES = ['premium', 'channels', 'mods', 'services', 'youtube_music', 'advertising', 'montage', 'design', 'other', 'youtube_tv'];
const YOUTUBE_LABELS = { premium: 'Премиум', channels: 'Каналы', mods: 'Моды', services: 'Услуги', youtube_music: 'YouTube Music', advertising: 'Реклама', montage: 'Монтаж', design: 'Дизайн', other: 'Другое', youtube_tv: 'YouTube TV' };

const APPLE_TYPES = ['subscription', 'account', 'giftcard', 'services', 'other'];
const APPLE_LABELS = { subscription: 'Подписка', account: 'Аккаунты', giftcard: 'Подарочные карты', services: 'Услуги', other: 'Другое' };

function norm(s) {
  return String(s || '').toLowerCase().replace(/ё/g, 'е').trim();
}

function isSteam(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'steam' || n.startsWith('steam ') || s.includes('steam');
}
function isTelegram(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'telegram' || n.includes('telegram') || n.includes('телеграм') || s.includes('telegram');
}
function isTiktok(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'tiktok' || n.includes('tiktok') || n.includes('тикток') || s.includes('tiktok');
}
function isDiscord(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'discord' || n.includes('discord') || s.includes('discord');
}
function isNetflix(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'netflix' || n.includes('netflix') || s.includes('netflix');
}
function isSpotify(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'spotify' || n.includes('spotify') || s.includes('spotify');
}
function isYoutube(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'youtube' || n.includes('youtube') || n.includes('ютуб') || s.includes('youtube');
}
function isApple(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'apple' || n === 'app store' || n.includes('apple') || s.includes('apple');
}

export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string' ? resolveAssortmentItem(gameOrItem) : gameOrItem;
  const name = String(item?.name || gameOrItem || '');
  const kind = item?.kind || 'app';

  if (isArenaBreakout(item?.name || name, item?.search)) {
    return ARENA_BREAKOUT_TYPES;
  }
  if (isPubgMobile(item?.name || name, item?.search) || isPubgMobile(name, '')) {
    return PUBG_MOBILE_TYPES;
  }
  const mobileOverride = resolveMobileGameOverride(item?.name || name, item?.search || '', name);
  if (mobileOverride) return mobileOverride.types;

  if (isSteam(item?.name || name, item?.search)) return STEAM_TYPES;
  if (isTelegram(item?.name || name, item?.search)) return TELEGRAM_TYPES;
  if (isTiktok(item?.name || name, item?.search)) return TIKTOK_TYPES;
  if (isDiscord(item?.name || name, item?.search)) return DISCORD_TYPES;
  if (isNetflix(item?.name || name, item?.search)) return NETFLIX_TYPES;
  if (isSpotify(item?.name || name, item?.search)) return SPOTIFY_TYPES;
  if (isYoutube(item?.name || name, item?.search)) return YOUTUBE_TYPES;
  if (isApple(item?.name || name, item?.search)) return APPLE_TYPES;

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
  else {
    const mobile = resolveMobileGameOverride(itemName, itemSearch, itemName);
    if (mobile) labelMap = mobile.labels;
    else if (isSteam(itemName, itemSearch)) labelMap = STEAM_LABELS;
    else if (isTelegram(itemName, itemSearch)) labelMap = TELEGRAM_LABELS;
    else if (isTiktok(itemName, itemSearch)) labelMap = TIKTOK_LABELS;
    else if (isDiscord(itemName, itemSearch)) labelMap = DISCORD_LABELS;
    else if (isNetflix(itemName, itemSearch)) labelMap = NETFLIX_LABELS;
    else if (isSpotify(itemName, itemSearch)) labelMap = SPOTIFY_LABELS;
    else if (isYoutube(itemName, itemSearch)) labelMap = YOUTUBE_LABELS;
    else if (isApple(itemName, itemSearch)) labelMap = APPLE_LABELS;
  }

  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
