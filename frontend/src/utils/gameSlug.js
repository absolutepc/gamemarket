import { ASSORTMENT } from '../data/assortment';
import { offerPathForType } from './offerTypes';

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

/**
 * Path like /games/cs2, /apps/chatgpt, or /games/cs2/accounts
 * @param {object} item
 * @param {string} [listingType] listing_type value (account, currency, …)
 */
export function getAssortmentPath(item, listingType) {
  const slug = getAssortmentSlug(item);
  if (!slug) return '/catalog';
  const base = `/${getLandingSection(item)}/${slug}`;
  const offer = offerPathForType(listingType);
  return offer ? `${base}/${offer}` : base;
}

/** @deprecated use getAssortmentPath */
export function getGamePath(item, listingType) {
  return getAssortmentPath(item, listingType);
}

export function getAssortmentBySlug(slug) {
  if (!slug) return null;
  return bySlug.get(String(slug).toLowerCase()) || null;
}

/**
 * Resolve slug within a URL section. If the item belongs to the other section,
 * returns { item, redirectPath } so the page can redirect.
 */
export function resolveAssortmentLanding(slug, section, listingType) {
  const item = getAssortmentBySlug(slug);
  if (!item) return { item: null, redirectPath: null };
  if (!sectionMatchesKind(section, item.kind)) {
    return { item: null, redirectPath: getAssortmentPath(item, listingType) };
  }
  return { item, redirectPath: null };
}

export function getAllGameLandingSlugs() {
  return [...bySlug.keys()];
}
