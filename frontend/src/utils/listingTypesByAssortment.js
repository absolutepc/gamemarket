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
  'steam',
  'epic games',
  'playstation',
  'xbox',
  'nintendo',
  'battle.net',
  'rockstar games',
  'ea play',
  'faceit',
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
  'telegram',
  'tiktok',
  'discord',
  'вконтакте',
  'likee',
  'twitch',
  'youtube',
]);

/** AI tools / нейросети — только 4 основных типа */
const AI_SERVICE_TYPES = [
  'subscription',
  'account',
  'services',
  'other',
];

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
]);

const AI_NAME_RE = /\b(ai|gpt|claude|cursor|gemini|grok|kimi|llm|нейро)\b|чатгпт|midjourney|perplexity|deepseek|runway|copilot|leonardo|character\.?\s*ai/i;

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
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
 */
export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;

  const name = normalizeName(item?.name || gameOrItem);
  const kind = item?.kind || 'app';

  if (GAME_PLATFORM_NAMES.has(name) || [...GAME_PLATFORM_NAMES].some((n) => name.includes(n))) {
    return GAME_PLATFORM_TYPES;
  }
  if (isAiService(item?.name || name, item?.search)) {
    return AI_SERVICE_TYPES;
  }
  if (SOCIAL_APP_NAMES.has(name)) {
    return SOCIAL_APP_TYPES;
  }

  return TYPES_BY_KIND[kind] || TYPES_BY_KIND.app;
}

/** LISTING_TYPE_OPTIONS filtered for the selected game/app */
export function listingTypeOptionsForAssortment(gameOrItem, { includeGiftcard = false } = {}) {
  const allowed = new Set(allowedListingTypesForAssortment(gameOrItem));
  return LISTING_TYPE_OPTIONS.filter((o) => {
    if (o.value === 'giftcard') return includeGiftcard;
    return allowed.has(o.value);
  });
}
