/** Arena Breakout (mobile only — not Infinite) */

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

export function isArenaBreakout(name, search = '') {
  const n = String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  const s = String(search || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  if (n.includes('infinite') || s.includes('infinite')) return false;
  return (
    n === 'arena breakout'
    || n.startsWith('arena breakout ')
    || (s.includes('arena breakout') && !s.includes('infinite'))
  );
}
