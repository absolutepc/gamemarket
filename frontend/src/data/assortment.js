import { P1_C0 } from './assortmentP1C0';
import { P1_C1 } from './assortmentP1C1';
import { P1_C2 } from './assortmentP1C2';
import { P1_C3 } from './assortmentP1C3';
import { P2_C0 } from './assortmentP2C0';
import { P2_C1 } from './assortmentP2C1';
import { P2_C2 } from './assortmentP2C2';
import { P2_C3 } from './assortmentP2C3';

export const ASSORTMENT = [
  ...P1_C0, ...P1_C1, ...P1_C2, ...P1_C3,
  ...P2_C0, ...P2_C1, ...P2_C2, ...P2_C3,
];

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
export function buildHomeCarousel(items) { return (items || []).slice(0, 20); }
export const ASSORTMENT_ICON_VERSION = '20260805d';
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
