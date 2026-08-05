/** Full catalog — compact pipe format */
import { CATALOG_RAW_1 } from './assortmentRaw1';
import { CATALOG_RAW_2 } from './assortmentRaw2';
const _RAW = (CATALOG_RAW_1 + '\n' + CATALOG_RAW_2).trim().split('\n');

const _KIND = { a: 'app', m: 'mobile', p: 'pc' };

export const ASSORTMENT = _RAW.map((line) => {
  const [n, s, i, k] = line.split('|');
  return {
    name: n,
    search: s,
    icon: '/assortment/' + i + '.png',
    kind: _KIND[k] || 'app',
  };
});

export const HOME_CAROUSEL_PINNED = [
  { catalog: 'Claude', name: 'Claude AI' },
  { catalog: 'Cursor', name: 'Cursor AI' },
  { catalog: 'Arena Breakout', name: 'Arena Breakout' },
  { catalog: 'PUBG', name: 'PUBG' },
  { catalog: 'Kimi', name: 'Kimi' },
  { catalog: 'Steam', name: 'Steam' },
  { catalog: 'PUBG Mobile', name: 'PUBG Mobile' },
  { catalog: 'Telegram', name: 'Telegram' },
  { catalog: 'Apple', name: 'Apple' },
  { catalog: 'CoD Mobile', name: 'CoD Mobile' },
  { catalog: 'Standoff 2', name: 'Standoff 2' },
  { catalog: 'ЧатГПТ', name: 'ChatGPT' },
  { catalog: 'Suno', name: 'Suno' },
  { catalog: 'Escape From Tarkov', name: 'Escape From Tarkov' },
  { catalog: 'Xbox', name: 'Xbox' },
  { catalog: 'Netflix', name: 'Netflix' },
  { catalog: 'CS2', name: 'CS2' },
  { catalog: 'Grok', name: 'Grok' },
  { catalog: 'Kling', name: 'Kling' },
  { catalog: 'Clash of Clans', name: 'Clash of Clans' },
  { catalog: 'Clash Royale', name: 'Clash Royale' },
  { catalog: 'Midjourney', name: 'Midjourney' },
];

export const HOME_CAROUSEL_FALLBACK_TAIL = [
  'Discord', 'TikTok', 'Valorant', 'Dota 2', 'GTA 5', 'Roblox', 'Brawl Stars',
  'Free Fire', 'Mobile Legends', 'Genshin', 'Faceit', 'Spotify', 'YouTube',
  'PlayStation', 'Battle.net', 'Epic Games', 'Adobe', 'CapCut', 'Perplexity',
  'DeepSeek', 'Leonardo AI', 'Twitch', 'GeForce NOW', 'EA Play',
];

export const HOME_TOP_14 = HOME_CAROUSEL_PINNED.map((p) => ({
  name: p.name, search: p.catalog, icon: '', kind: 'app', catalog: p.catalog,
}));

export function buildHomeCarousel(items, popularNames = []) {
  const byName = new Map(items.map((i) => [i.name, i]));
  const seen = new Set();
  const out = [];
  const push = (item) => {
    if (!item || seen.has(item.name)) return;
    seen.add(item.name);
    out.push(item);
  };
  for (const p of HOME_CAROUSEL_PINNED) {
    push(byName.get(p.name) || byName.get(p.catalog));
  }
  for (const n of popularNames || []) push(byName.get(n));
  for (const n of HOME_CAROUSEL_FALLBACK_TAIL) push(byName.get(n));
  for (const item of items) push(item);
  return out;
}

export const ASSORTMENT_ICON_VERSION = '20260805e';
export const ASSORTMENT_PREVIEW_COUNT = HOME_CAROUSEL_PINNED.length;

export const ASSORTMENT_TABS = [
  { id: 'pc', label: 'ПК' },
  { id: 'mobile', label: 'Мобильные' },
  { id: 'apps', label: 'Приложения' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'playstation', label: 'PlayStation' },
];

const XBOX_HUB_APPS = new Set(['Xbox', 'Microsoft Store']);
const PLAYSTATION_HUB_APPS = new Set(['PlayStation']);
const CONSOLE_HUB_APPS = new Set([...XBOX_HUB_APPS, ...PLAYSTATION_HUB_APPS]);
const MULTI_CONSOLE_NAMES = new Set(['Steam', 'Epic Games', 'Battle.net', 'Ubisoft', 'EA Play', 'Rockstar Games']);
const XBOX_NAME_RE = /xbox|game pass/i;
const PLAYSTATION_NAME_RE = /playstation|ps4|ps5|ps plus/i;

function isXboxCatalogItem(item) {
  if (item.kind === 'app') return XBOX_HUB_APPS.has(item.name);
  if (item.kind !== 'pc') return false;
  if (MULTI_CONSOLE_NAMES.has(item.name)) return true;
  return XBOX_NAME_RE.test(item.name);
}
function isPlayStationCatalogItem(item) {
  if (item.kind === 'app') return PLAYSTATION_HUB_APPS.has(item.name);
  if (item.kind !== 'pc') return false;
  if (MULTI_CONSOLE_NAMES.has(item.name)) return true;
  return PLAYSTATION_NAME_RE.test(item.name);
}
function withHubsFirst(items, hubNames) {
  const hubs = []; const rest = [];
  for (const item of items) {
    if (hubNames.has(item.name)) hubs.push(item);
    else rest.push(item);
  }
  return [...hubs, ...rest];
}

export function interleaveByRatio(primary, secondary) {
  return [...(primary || []), ...(secondary || [])];
}

export function assortmentByTab(tabId) {
  const id = tabId === 'games' ? 'pc' : tabId;
  if (id === 'pc') return ASSORTMENT.filter((i) => i.kind === 'pc');
  if (id === 'mobile') return ASSORTMENT.filter((i) => i.kind === 'mobile');
  if (id === 'apps') return ASSORTMENT.filter((i) => i.kind === 'app' && !CONSOLE_HUB_APPS.has(i.name));
  if (id === 'xbox') return withHubsFirst(ASSORTMENT.filter(isXboxCatalogItem), XBOX_HUB_APPS);
  if (id === 'playstation') return withHubsFirst(ASSORTMENT.filter(isPlayStationCatalogItem), PLAYSTATION_HUB_APPS);
  return ASSORTMENT.filter((i) => i.kind === 'pc' || i.kind === 'mobile');
}
