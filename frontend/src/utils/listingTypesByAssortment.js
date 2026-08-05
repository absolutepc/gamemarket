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
 * Restored original app-specific types + Arena Breakout + PUBG Mobile.
 */
const TYPES_BY_KIND = {
  app: [
    'subscription', 'account', 'topup', 'keys', 'services', 'media',
    'rental', 'design', 'training', 'other',
  ],
  mobile: [
    'donate', 'subscription', 'account', 'item', 'topup', 'currency',
    'skins', 'boosting', 'services', 'game_account', 'rental', 'other',
  ],
  pc: [
    'donate', 'account', 'item', 'topup', 'keys', 'currency', 'game_account',
    'boosting', 'services', 'skins', 'games', 'rental', 'mods', 'other',
  ],
};

const STEAM_TYPES = ['topup', 'games', 'region_change', 'game_account', 'clean_account', 'item', 'services', 'other', 'steam_rewards', 'rental'];
const STEAM_LABELS = { topup: 'Пополнение баланса', games: 'Игры', region_change: 'Смена региона', game_account: 'Аккаунты с играми', clean_account: 'Чистые аккаунты', item: 'Предметы', services: 'Услуги', other: 'Другое', steam_rewards: 'Награды Steam', rental: 'Аренда' };

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

const APPLE_TYPES = ['giftcard', 'game_account', 'subscription', 'clean_account', 'other', 'services', 'region_change', 'rental'];
const APPLE_LABELS = { giftcard: 'Подарочные карты', game_account: 'Аккаунты с играми', subscription: 'Подписки', clean_account: 'Чистые аккаунты', other: 'Другое', services: 'Услуги', region_change: 'Смена региона', rental: 'Аренда' };

const PLAYSTATION_TYPES = ['topup', 'ps_plus', 'game_account', 'games', 'clean_account', 'rental', 'ea_play', 'services', 'other'];
const PLAYSTATION_LABELS = { topup: 'Пополнение бумажника', ps_plus: 'PS Plus', game_account: 'Аккаунты с играми', games: 'Игры', clean_account: 'Чистые аккаунты', rental: 'Аренда', ea_play: 'EA Play', services: 'Услуги', other: 'Другое' };

const XBOX_TYPES = ['game_pass', 'topup', 'games', 'account', 'clean_account', 'services', 'region_change', 'other', 'ubisoft_plus'];
const XBOX_LABELS = { game_pass: 'Game Pass', topup: 'Пополнение баланса', games: 'Игры', account: 'Аккаунты', clean_account: 'Чистые аккаунты', services: 'Услуги', region_change: 'Смена региона', other: 'Другое', ubisoft_plus: 'Ubisoft+' };

const GOOGLE_PLAY_TYPES = ['clean_account', 'subscription', 'giftcard', 'games', 'region_change', 'game_account', 'other', 'services'];
const GOOGLE_PLAY_LABELS = { clean_account: 'Чистые аккаунты', subscription: 'Подписки', giftcard: 'Подарочные карты', games: 'Игры', region_change: 'Смена региона', game_account: 'Аккаунты с играми', other: 'Другое', services: 'Услуги' };

const BATTLENET_TYPES = ['topup', 'games', 'region_change', 'game_account', 'services', 'other'];
const BATTLENET_LABELS = { topup: 'Пополнение баланса', games: 'Игры', region_change: 'Смена региона', game_account: 'Аккаунты с играми', services: 'Услуги', other: 'Другое' };

const EPIC_GAMES_TYPES = ['game_account', 'region_change', 'clean_account', 'topup', 'games', 'services', 'other'];
const EPIC_GAMES_LABELS = { game_account: 'Аккаунты с играми', region_change: 'Смена региона', clean_account: 'Чистые аккаунты', topup: 'Пополнение баланса', games: 'Игры', services: 'Услуги', other: 'Другое' };

const TWITCH_TYPES = ['design', 'subscription', 'services', 'advertising', 'account', 'other', 'twitch_drops', 'bits'];
const TWITCH_LABELS = { design: 'Дизайн', subscription: 'Подписки', services: 'Услуги', advertising: 'Реклама', account: 'Аккаунты', other: 'Другое', twitch_drops: 'Twitch Drops', bits: 'Bits' };

const FACEIT_TYPES = ['subscription', 'services', 'account', 'rental', 'boosting', 'other'];
const FACEIT_LABELS = { subscription: 'Подписка', services: 'Услуги', account: 'Аккаунты', rental: 'Аренда', boosting: 'Буст', other: 'Другое' };

const AI_SERVICE_TYPES = ['subscription', 'account', 'services', 'other'];

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
function isPlaystation(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'playstation' || n.startsWith('playstation ') || n === 'ps5' || n === 'ps4' || s.includes('playstation');
}
function isXbox(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'xbox' || n.startsWith('xbox ') || s.includes('xbox');
}
function isGooglePlay(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'google play' || n === 'googleplay' || n.startsWith('google play ') || s.includes('google play');
}
function isBattlenet(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'battle.net' || n === 'battlenet' || n.includes('battle.net') || s.includes('battle.net') || s.includes('battlenet');
}
function isEpicGames(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'epic games' || n === 'epicgames' || n.startsWith('epic games ') || s.includes('epic games');
}
function isTwitch(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'twitch' || n.startsWith('twitch ') || s.includes('twitch');
}
function isFaceit(name, search = '') {
  const n = norm(name); const s = norm(search);
  return n === 'faceit' || n.startsWith('faceit ') || s.includes('faceit');
}
function isAiService(name, search = '') {
  const n = norm(name); const s = norm(search);
  const ai = ['cursor', 'claude', 'чатгпт', 'chatgpt', 'grok', 'gemini', 'kimi', 'perplexity', 'deepseek', 'midjourney', 'leonardo ai', 'kling', 'suno'];
  return ai.some((x) => n === x || n.startsWith(x + ' ') || s.includes(x));
}

export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string' ? resolveAssortmentItem(gameOrItem) : gameOrItem;
  const name = String(item?.name || gameOrItem || '');
  const kind = item?.kind || 'app';

  if (isArenaBreakout(item?.name || name, item?.search)) return ARENA_BREAKOUT_TYPES;
  if (isPubgMobile(item?.name || name, item?.search) || isPubgMobile(name, '')) return PUBG_MOBILE_TYPES;

  if (isSteam(item?.name || name, item?.search)) return STEAM_TYPES;
  if (isTelegram(item?.name || name, item?.search)) return TELEGRAM_TYPES;
  if (isTiktok(item?.name || name, item?.search)) return TIKTOK_TYPES;
  if (isDiscord(item?.name || name, item?.search)) return DISCORD_TYPES;
  if (isNetflix(item?.name || name, item?.search)) return NETFLIX_TYPES;
  if (isSpotify(item?.name || name, item?.search)) return SPOTIFY_TYPES;
  if (isYoutube(item?.name || name, item?.search)) return YOUTUBE_TYPES;
  if (isApple(item?.name || name, item?.search)) return APPLE_TYPES;
  if (isPlaystation(item?.name || name, item?.search)) return PLAYSTATION_TYPES;
  if (isXbox(item?.name || name, item?.search)) return XBOX_TYPES;
  if (isGooglePlay(item?.name || name, item?.search)) return GOOGLE_PLAY_TYPES;
  if (isBattlenet(item?.name || name, item?.search)) return BATTLENET_TYPES;
  if (isEpicGames(item?.name || name, item?.search)) return EPIC_GAMES_TYPES;
  if (isTwitch(item?.name || name, item?.search)) return TWITCH_TYPES;
  if (isFaceit(item?.name || name, item?.search)) return FACEIT_TYPES;
  if (isAiService(item?.name || name, item?.search)) return AI_SERVICE_TYPES;

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
  else if (isSteam(itemName, itemSearch)) labelMap = STEAM_LABELS;
  else if (isTelegram(itemName, itemSearch)) labelMap = TELEGRAM_LABELS;
  else if (isTiktok(itemName, itemSearch)) labelMap = TIKTOK_LABELS;
  else if (isDiscord(itemName, itemSearch)) labelMap = DISCORD_LABELS;
  else if (isNetflix(itemName, itemSearch)) labelMap = NETFLIX_LABELS;
  else if (isSpotify(itemName, itemSearch)) labelMap = SPOTIFY_LABELS;
  else if (isYoutube(itemName, itemSearch)) labelMap = YOUTUBE_LABELS;
  else if (isApple(itemName, itemSearch)) labelMap = APPLE_LABELS;
  else if (isPlaystation(itemName, itemSearch)) labelMap = PLAYSTATION_LABELS;
  else if (isXbox(itemName, itemSearch)) labelMap = XBOX_LABELS;
  else if (isGooglePlay(itemName, itemSearch)) labelMap = GOOGLE_PLAY_LABELS;
  else if (isBattlenet(itemName, itemSearch)) labelMap = BATTLENET_LABELS;
  else if (isEpicGames(itemName, itemSearch)) labelMap = EPIC_GAMES_LABELS;
  else if (isTwitch(itemName, itemSearch)) labelMap = TWITCH_LABELS;
  else if (isFaceit(itemName, itemSearch)) labelMap = FACEIT_LABELS;

  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
