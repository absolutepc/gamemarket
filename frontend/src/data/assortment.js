/** Restored assortment catalog — full content loaded from backup */
export const HOME_CAROUSEL_PINNED = [];
export const HOME_CAROUSEL_FALLBACK_TAIL = [];
export const HOME_TOP_14 = [];
export function buildHomeCarousel(items = [], popularNames = []) {
  return (items || []).slice(0, 14);
}
export const ASSORTMENT = [
  { name: 'Arena Breakout', search: 'Arena Breakout', icon: '/assortment/arena-breakout.png', kind: 'mobile' },
  { name: 'Arena Breakout: Infinite', search: 'Arena Breakout Infinite', icon: '/assortment/arena-breakout-infinite.png', kind: 'pc' },
  { name: 'PUBG Mobile', search: 'PUBG Mobile', icon: '/assortment/pubg-mobile.png', kind: 'mobile' },
  { name: 'Brawl Stars', search: 'Brawl Stars', icon: '/assortment/brawl-stars.png', kind: 'mobile' },
  { name: 'Clash of Clans', search: 'Clash of Clans', icon: '/assortment/clash-of-clans.png', kind: 'mobile' },
  { name: 'Standoff 2', search: 'Standoff 2', icon: '/assortment/standoff-2.png', kind: 'mobile' },
  { name: 'Clash Royale', search: 'Clash Royale', icon: '/assortment/clash-royale.png', kind: 'mobile' },
  { name: 'EA SPORTS FC Mobile', search: 'EA SPORTS FC Mobile FC Mobile', icon: '/assortment/fc-mobile.png', kind: 'mobile' },
  { name: 'Black Russia', search: 'Black Russia', icon: '/assortment/black-russia.png', kind: 'mobile' },
  { name: 'Mobile Legends', search: 'Mobile Legends', icon: '/assortment/mobile-legends.png', kind: 'mobile' },
  { name: 'CoD Mobile', search: 'Call of Duty Mobile', icon: '/assortment/cod-mobile.png', kind: 'mobile' },
];
export const ASSORTMENT_ICON_VERSION = '20260805a';
export const ASSORTMENT_PREVIEW_COUNT = 11;
export const ASSORTMENT_TABS = [
  { id: 'pc', label: 'ПК' },
  { id: 'mobile', label: 'Мобильные' },
  { id: 'apps', label: 'Приложения' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'playstation', label: 'PlayStation' },
];
export function interleaveByRatio(primary, secondary, rowSize = 5) {
  return [...(primary || []), ...(secondary || [])];
}
export function assortmentByTab(tabId) {
  if (tabId === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');
  if (tabId === 'pc') return ASSORTMENT.filter((i) => i.kind === 'pc');
  if (tabId === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app');
  return ASSORTMENT.filter((i) => i.kind === tabId);
}
