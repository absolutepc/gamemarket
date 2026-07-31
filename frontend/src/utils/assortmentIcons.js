import { ASSORTMENT } from '../data/assortment';

const FALLBACK_ICON = '/assortment/other-apps.png';

/** Normalize for fuzzy game / service matching */
export function normalizeAssortmentKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
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
  const q = normalizeAssortmentKey(gameOrSearch);
  if (!q) return null;

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
  return resolveAssortmentItem(gameOrSearch)?.icon || FALLBACK_ICON;
}

/** True when value is an exact assortment name (required for new listings). */
export function isExactAssortmentName(value) {
  const q = normalizeAssortmentKey(value);
  if (!q) return false;
  return INDEX.some((item) => item.key === q);
}
