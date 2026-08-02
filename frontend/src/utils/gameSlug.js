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

/** URL section: apps for services, games for PC/mobile titles */
export function getLandingSection(kindOrItem) {
  const kind = typeof kindOrItem === 'string' ? kindOrItem : kindOrItem?.kind;
  return kind === 'app' ? 'apps' : 'games';
}

export function sectionMatchesKind(section, kind) {
  if (section === 'apps') return kind === 'app';
  if (section === 'games') return kind === 'pc' || kind === 'mobile';
  return false;
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
  for (const [slug, entry] of bySlug) {
    if (entry.icon === item.icon && (entry.name === item.name || entry.name === item.catalog)) {
      return slug;
    }
  }
  return base;
}

/** Path like /games/cs2 or /apps/chatgpt */
export function getAssortmentPath(item) {
  const slug = getAssortmentSlug(item);
  if (!slug) return '/catalog';
  return `/${getLandingSection(item)}/${slug}`;
}

/** @deprecated use getAssortmentPath */
export function getGamePath(item) {
  return getAssortmentPath(item);
}

export function getAssortmentBySlug(slug) {
  if (!slug) return null;
  return bySlug.get(String(slug).toLowerCase()) || null;
}

/**
 * Resolve slug within a URL section. If the item belongs to the other section,
 * returns { item, redirectPath } so the page can redirect.
 */
export function resolveAssortmentLanding(slug, section) {
  const item = getAssortmentBySlug(slug);
  if (!item) return { item: null, redirectPath: null };
  if (sectionMatchesKind(section, item.kind)) {
    return { item, redirectPath: null };
  }
  return { item: null, redirectPath: getAssortmentPath(item) };
}

export function getAllGameLandingSlugs() {
  return [...bySlug.keys()];
}
