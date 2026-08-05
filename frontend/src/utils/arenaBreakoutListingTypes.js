/** Arena Breakout (mobile) + Arena Breakout: Infinite — same listing types */

export const ARENA_BREAKOUT_TYPES = [
  'bonds',
  'subscription',
  'account',
  'boosting',
  'packs',
  'item',
  'services',
  'other',
  'rental',
  'twitch_drops',
];

export const ARENA_BREAKOUT_LABELS = {
  bonds: 'Bonds',
  subscription: 'Подписки',
  account: 'Аккаунты',
  boosting: 'Буст',
  packs: 'Наборы',
  item: 'Предметы',
  services: 'Услуги',
  other: 'Другое',
  rental: 'Аренда',
  twitch_drops: 'Twitch Drops',
};

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/:/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasInfinite(n) {
  return n.includes('infinite') || n.includes('infiniti') || n.includes('инфинит');
}

function hasArenaBreakout(n) {
  return n.includes('arena breakout') || n.includes('арена брейкаут') || n.includes('арена брейк');
}

/** Mobile Arena Breakout only (excludes Infinite). */
export function isArenaBreakout(name, search = '') {
  const n = norm(name);
  const s = norm(search);
  if (hasInfinite(n) || hasInfinite(s)) return false;
  return hasArenaBreakout(n) || hasArenaBreakout(s);
}

/** Arena Breakout: Infinite (PC). */
export function isArenaBreakoutInfinite(name, search = '') {
  const n = norm(name);
  const s = norm(search);
  const hit = (x) => hasArenaBreakout(x) && hasInfinite(x);
  return hit(n) || hit(s);
}

/** Either mobile or Infinite — use same listing types. */
export function isArenaBreakoutFamily(name, search = '') {
  return isArenaBreakout(name, search) || isArenaBreakoutInfinite(name, search);
}
