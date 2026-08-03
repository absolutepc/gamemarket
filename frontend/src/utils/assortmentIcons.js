import { ASSORTMENT, ASSORTMENT_ICON_VERSION } from '../data/assortment';

const FALLBACK_ICON = `/assortment/other-apps.png?v=${ASSORTMENT_ICON_VERSION}`;

/** Ensure assortment icon URLs carry the cache-bust query. */
export function assortmentIconUrl(src) {
  const raw = String(src || '').trim() || FALLBACK_ICON;
  if (!raw.startsWith('/assortment/')) return raw;
  const bare = raw.split('?')[0];
  return `${bare}?v=${ASSORTMENT_ICON_VERSION}`;
}

/** Normalize for fuzzy game / service matching */
export function normalizeAssortmentKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Map legacy / alternate listing.game values onto current catalog names */
const NAME_ALIASES = {
  chatgpt: 'чатгпт',
  'chatgpt plus': 'чатгпт',
  'chatgpt team': 'чатгпт',
  'chatgpt api': 'чатгпт',
  openai: 'чатгпт',
  'claude ai': 'claude',
  'claude pro': 'claude',
  'claude team': 'claude',
  'cursor ai': 'cursor',
  'cursor pro': 'cursor',
  'app store': 'apple',
  itunes: 'apple',
  'ea sports': 'ea play',
  crunchyroll: 'кранчролл',
  'amazon prime': 'prime video',
  'character.ai': 'character ai',
  'runway ml': 'runway',
  'rockstar launcher': 'rockstar games',
};

function applyAlias(q) {
  return NAME_ALIASES[q] || q;
}

const INDEX = ASSORTMENT.map((item) => ({
  ...item,
  key: normalizeAssortmentKey(item.name),
  searchKey: normalizeAssortmentKey(item.search),
}));

// Prefer longer keys first so "pubg mobile" wins over "pubg"
const INDEX_BY_LENGTH = [...INDEX].sort(
  (a, b) => Math.max(b.key.length, b.searchKey.length) - Math.max(a.key.length, a.searchKey.length)
);

/**
 * Resolve assortment entry by listing.game / search text.
 * Exact name/search first, then longest partial match.
 */
export function resolveAssortmentItem(gameOrSearch) {
  const raw = normalizeAssortmentKey(gameOrSearch);
  if (!raw) return null;
  const q = applyAlias(raw);

  const exact = INDEX.find((item) => item.key === q || item.searchKey === q);
  if (exact) return exact;

  return (
    INDEX_BY_LENGTH.find(
      (item) =>
        (item.key.length >= 3 && (q.includes(item.key) || item.key.includes(q))) ||
        (item.searchKey.length >= 3 && (q.includes(item.searchKey) || item.searchKey.includes(q)))
    ) || null
  );
}

export function resolveAssortmentIcon(gameOrSearch) {
  return assortmentIconUrl(resolveAssortmentItem(gameOrSearch)?.icon || FALLBACK_ICON);
}

/**
 * True when value is an exact assortment name (required for new listings).
 * Pass hiddenKeys (Set) to reject admin-hidden catalog entries.
 */
export function isExactAssortmentName(value, hiddenKeys) {
  const q = normalizeAssortmentKey(value);
  if (!q) return false;
  if (hiddenKeys?.size && hiddenKeys.has(q)) return false;
  return INDEX.some((item) => item.key === q);
}
