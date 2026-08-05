/** Full catalog */
import { CATALOG_RAW_0 } from './assortmentCR0';

const _KIND = { a: 'app', m: 'mobile', p: 'pc' };

export const ASSORTMENT = CATALOG_RAW_0.trim().split('\n').filter(Boolean).map((line) => {
  const [n, s, i, k] = line.split('|');
  return { name: n, search: s, icon: '/assortment/' + i + '.png', kind: _KIND[k] || 'app' };
});

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
export function buildHomeCarousel(items) { return (items || []).slice(0, 24); }
export const ASSORTMENT_ICON_VERSION = '20260805g';
export const ASSORTMENT_PREVIEW_COUNT = HOME_CAROUSEL_PINNED.length;
export const ASSORTMENT_TABS = [
  { id: 'pc', label: 'ПК' },
  { id: 'mobile', label: 'Мобильные' },
  { id: 'apps', label: 'Приложения' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'playstation', label: 'PlayStation' },
];
export function interleaveByRatio(a, b) { return [...(a||[]), ...(b||[])]; }
export function assortmentByTab(tabId) {
  const id = tabId === 'games' ? 'pc' : tabId;
  if (id === 'pc') return ASSORTMENT.filter((i) => i.kind === 'pc');
  if (id === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');
  if (id === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app');
  return ASSORTMENT.filter((i) => i.kind === id);
}
