import { ASSORTMENT_PART1 } from './assortmentPart1';
import { ASSORTMENT_PART2 } from './assortmentPart2';

export const ASSORTMENT = [...ASSORTMENT_PART1, ...ASSORTMENT_PART2];

export const HOME_CAROUSEL_PINNED = [
  { catalog: 'Claude', name: 'Claude AI' },
  { catalog: 'Cursor', name: 'Cursor AI' },
  { catalog: 'Arena Breakout', name: 'Arena Breakout' },
  { catalog: 'PUBG', name: 'PUBG' },
  { catalog: 'Steam', name: 'Steam' },
  { catalog: 'PUBG Mobile', name: 'PUBG Mobile' },
  { catalog: 'Telegram', name: 'Telegram' },
  { catalog: 'CoD Mobile', name: 'CoD Mobile' },
  { catalog: 'Standoff 2', name: 'Standoff 2' },
  { catalog: 'Clash of Clans', name: 'Clash of Clans' },
  { catalog: 'Clash Royale', name: 'Clash Royale' },
];

export const HOME_CAROUSEL_FALLBACK_TAIL = [];
export const HOME_TOP_14 = HOME_CAROUSEL_PINNED.map((p) => ({ name: p.name, search: p.catalog, icon: '', kind: 'app', catalog: p.catalog }));

export function buildHomeCarousel(items, popularNames = []) {
  return (items || []).slice(0, 20);
}

export const ASSORTMENT_ICON_VERSION = '20260805c';
export const ASSORTMENT_PREVIEW_COUNT = HOME_CAROUSEL_PINNED.length;

export const ASSORTMENT_TABS = [
  { id: 'pc', label: 'ПК' },
  { id: 'mobile', label: 'Мобильные' },
  { id: 'apps', label: 'Приложения' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'playstation', label: 'PlayStation' },
];

export function interleaveByRatio(primary, secondary) {
  return [...(primary || []), ...(secondary || [])];
}

export function assortmentByTab(tabId) {
  const id = tabId === 'games' ? 'pc' : tabId;
  if (id === 'pc') return ASSORTMENT.filter((i) => i.kind === 'pc');
  if (id === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');
  if (id === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app');
  return ASSORTMENT.filter((i) => i.kind === id);
}
