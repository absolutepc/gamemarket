import { ASSORTMENT } from '../data/assortment';

const FALLBACK_ICON = '/assortment/other-apps.png';

/** Normalize for fuzzy game / service matching */
function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const INDEX = ASSORTMENT.map((item) => ({
  ...item,
  key: normalizeKey(item.name),
  searchKey: normalizeKey(item.search),
}));

/**
 * Resolve assortment logo by listing.game / search text.
 * Matches exact name, then contains either way.
 */
export function resolveAssortmentIcon(gameOrSearch) {
  const q = normalizeKey(gameOrSearch);
  if (!q) return FALLBACK_ICON;

  const exact = INDEX.find((item) => item.key === q || item.searchKey === q);
  if (exact) return exact.icon;

  const partial = INDEX.find(
    (item) =>
      q.includes(item.key) ||
      item.key.includes(q) ||
      q.includes(item.searchKey) ||
      item.searchKey.includes(q)
  );
  if (partial) return partial.icon;

  return FALLBACK_ICON;
}

export function resolveAssortmentItem(gameOrSearch) {
  const q = normalizeKey(gameOrSearch);
  if (!q) return null;
  return (
    INDEX.find((item) => item.key === q || item.searchKey === q) ||
    INDEX.find(
      (item) =>
        q.includes(item.key) ||
        item.key.includes(q) ||
        q.includes(item.searchKey) ||
        item.searchKey.includes(q)
    ) ||
    null
  );
}
