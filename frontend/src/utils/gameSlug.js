import { ASSORTMENT } from '../data/assortment';

function baseSlugFromItem(item) {
  const m = String(item.icon || '').match(/\/assortment\/(.+)\.[a-z0-9]+$/i);
  const raw = m ? m[1] : (item.search || item.name || 'item');
  return String(raw)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

const bySlug = new Map();
const slugByKey = new Map();

for (const item of ASSORTMENT) {
  let slug = baseSlugFromItem(item);
  if (bySlug.has(slug)) {
    let n = 2;
    while (bySlug.has(`${slug}-${n}`)) n += 1;
    slug = `${slug}-${n}`;
  }
  bySlug.set(slug, item);
  slugByKey.set(`${item.kind}::${item.name}`, slug);
}

/** Stable URL slug for an assortment item (from icon filename). */
export function getAssortmentSlug(item) {
  if (!item) return null;
  const exact = slugByKey.get(`${item.kind}::${item.name}`);
  if (exact) return exact;
  if (item.catalog) {
    const byCatalog = slugByKey.get(`${item.kind}::${item.catalog}`);
    if (byCatalog) return byCatalog;
  }
  const base = baseSlugFromItem(item);
  if (bySlug.has(base)) return base;
  // Prefer mapped slug when icon collided and got a -2 suffix during index build
  for (const [slug, entry] of bySlug) {
    if (entry.icon === item.icon && (entry.name === item.name || entry.name === item.catalog)) {
      return slug;
    }
  }
  return base;
}

/** Path like /games/cs2 */
export function getGamePath(item) {
  const slug = getAssortmentSlug(item);
  return slug ? `/games/${slug}` : '/catalog';
}

export function getAssortmentBySlug(slug) {
  if (!slug) return null;
  return bySlug.get(String(slug).toLowerCase()) || null;
}

export function getAllGameLandingSlugs() {
  return [...bySlug.keys()];
}
