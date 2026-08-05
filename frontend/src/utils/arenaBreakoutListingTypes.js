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
    .trim();
}

/** Mobile Arena Breakout only (excludes Infinite). */
export function isArenaBreakout(name, search = '') {
  const n = norm(name);
  const s = norm(search);
  if (n.includes('infinite') || s.includes('infinite')) return false;
  return (
    n === 'arena breakout'
    || n.startsWith('arena breakout ')
    || (s.includes('arena breakout') && !s.includes('infinite'))
  );
}

/** Arena Breakout: Infinite (PC). */
export function isArenaBreakoutInfinite(name, search = '') {
  const n = norm(name);
  const s = norm(search);
  return (
    n.includes('arena breakout') && n.includes('infinite')
  ) || (
    s.includes('arena breakout') && s.includes('infinite')
  ) || n === 'arena breakout infinite'
    || n === 'arena breakout: infinite';
}

/** Either mobile or Infinite — use same listing types. */
export function isArenaBreakoutFamily(name, search = '') {
  return isArenaBreakout(name, search) || isArenaBreakoutInfinite(name, search);
}
