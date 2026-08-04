/**
 * Per-game listing type overrides for popular mobile titles
 * (mirrors Playerok category lists; Lootz reduced fee = 7.5%).
 */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

function matchAny(name, search, predicates) {
  const n = norm(name);
  const s = norm(search);
  return predicates.some((fn) => fn(n, s));
}

// ── Call of Duty: Mobile ──────────────────────────────────────────
export const COD_MOBILE_TYPES = [
  'cp', 'account', 'battle_pass', 'promotion', 'rental', 'other', 'services', 'item', 'boosting',
];
export const COD_MOBILE_LABELS = {
  cp: 'CP',
  account: 'Аккаунты',
  battle_pass: 'Пропуск',
  promotion: 'Акции',
  rental: 'Аренда',
  other: 'Другое',
  services: 'Услуги',
  item: 'Предметы',
  boosting: 'Буст',
};
export function isCodMobile(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'call of duty: mobile' || n === 'call of duty mobile' || n === 'cod mobile' || n === 'codm',
    (n) => n.includes('call of duty') && n.includes('mobile'),
    (n) => n.includes('колл оф дьюти') && n.includes('мобайл'),
    (_n, s) => s.includes('call of duty') && s.includes('mobile'),
  ]);
}

// ── EA SPORTS FC Mobile ───────────────────────────────────────────
export const FC_MOBILE_TYPES = [
  'packs', 'subscription', 'points', 'account', 'promocodes', 'boosting', 'other', 'services', 'game_account', 'rental',
];
export const FC_MOBILE_LABELS = {
  packs: 'Наборы',
  subscription: 'Абонемент',
  points: 'Points',
  account: 'Аккаунты',
  promocodes: 'Промокоды',
  boosting: 'Буст',
  other: 'Другое',
  services: 'Услуги',
  game_account: 'Аккаунты с монетами',
  rental: 'Аренда',
};
export function isFcMobile(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'ea sports fc mobile' || n === 'fc mobile' || n === 'fifa mobile',
    (n) => (n.includes('fc mobile') || n.includes('fifa mobile')) && !n.includes('ultimate'),
    (n) => n.includes('ea sports fc') && n.includes('mobile'),
    (_n, s) => (s.includes('fc mobile') || s.includes('fifa mobile')),
  ]);
}

// ── Standoff 2 ────────────────────────────────────────────────────
export const STANDOFF2_TYPES = [
  'gold', 'account', 'skins', 'promocodes', 'boosting', 'other', 'services', 'promotion', 'design', 'clans', 'twitch_drops', 'gold_pass',
];
export const STANDOFF2_LABELS = {
  gold: 'Голда',
  account: 'Аккаунты',
  skins: 'Скины',
  promocodes: 'Промокоды',
  boosting: 'Буст',
  other: 'Другое',
  services: 'Услуги',
  promotion: 'Акции',
  design: 'Дизайн',
  clans: 'Кланы',
  twitch_drops: 'Twitch Drops',
  gold_pass: 'Gold Pass',
};
export function isStandoff2(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'standoff 2' || n === 'standoff2' || n === 'стандофф 2' || n === 'стандофф2',
    (n) => n.startsWith('standoff 2') || n.startsWith('стандофф 2'),
    (_n, s) => s.includes('standoff 2') || s.includes('стандофф 2'),
  ]);
}

// ── Mobile Legends ────────────────────────────────────────────────
export const MOBILE_LEGENDS_TYPES = [
  'diamonds', 'account', 'charisma', 'promotion', 'rental', 'boosting', 'other', 'services',
];
export const MOBILE_LEGENDS_LABELS = {
  diamonds: 'Алмазы',
  account: 'Аккаунты',
  charisma: 'Харизма',
  promotion: 'Акции',
  rental: 'Аренда',
  boosting: 'Буст',
  other: 'Другое',
  services: 'Услуги',
};
export function isMobileLegends(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'mobile legends' || n === 'mobile legends: bang bang' || n === 'mlbb' || n === 'мобайл легендс',
    (n) => n.includes('mobile legends'),
    (n) => n.includes('мобайл легенд'),
    (_n, s) => s.includes('mobile legends') || s.includes('mlbb'),
  ]);
}

// ── Brawl Stars ───────────────────────────────────────────────────
export const BRAWL_STARS_TYPES = [
  'promotion', 'account', 'gems', 'boosting', 'promo_actions', 'services', 'other', 'friends', 'design',
];
export const BRAWL_STARS_LABELS = {
  promotion: 'Акции',
  account: 'Аккаунты',
  gems: 'Гемы',
  boosting: 'Буст',
  promo_actions: 'Промоакции',
  services: 'Услуги',
  other: 'Другое',
  friends: 'Друзья',
  design: 'Дизайн',
};
export function isBrawlStars(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'brawl stars' || n === 'бравл старс' || n === 'brawlstars',
    (n) => n.startsWith('brawl stars') || n.startsWith('бравл старс'),
    (_n, s) => s.includes('brawl stars') || s.includes('бравл старс'),
  ]);
}

// ── Black Russia (BR) ─────────────────────────────────────────────
export const BLACK_RUSSIA_TYPES = [
  'virts', 'account', 'bc', 'account_virts', 'boosting', 'other', 'item', 'callbacks', 'promocodes', 'services', 'rental',
];
export const BLACK_RUSSIA_LABELS = {
  virts: 'Вирты',
  account: 'Аккаунты',
  bc: 'BC',
  account_virts: 'Аккаунты с виртами',
  boosting: 'Буст',
  other: 'Другое',
  item: 'Предметы',
  callbacks: 'Обзвоны',
  promocodes: 'Промокоды',
  services: 'Услуги',
  rental: 'Аренда',
};
export function isBlackRussia(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'black russia' || n === 'br' || n === 'блэк раша' || n === 'блек раша',
    (n) => n.includes('black russia') || n.includes('блэк раша') || n.includes('блек раша'),
    (_n, s) => s.includes('black russia') || s.includes('блэк раша'),
  ]);
}

// ── Clash of Clans ────────────────────────────────────────────────
export const CLASH_OF_CLANS_TYPES = [
  'promotion', 'account', 'gems', 'clans', 'capital_gold', 'other', 'services', 'boosting', 'promo_actions',
];
export const CLASH_OF_CLANS_LABELS = {
  promotion: 'Акции',
  account: 'Аккаунты',
  gems: 'Гемы',
  clans: 'Кланы',
  capital_gold: 'Золото столицы',
  other: 'Другое',
  services: 'Услуги',
  boosting: 'Буст',
  promo_actions: 'Промоакции',
};
export function isClashOfClans(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'clash of clans' || n === 'coc' || n === 'клеш оф кланс' || n === 'клэш оф кланс',
    (n) => n.includes('clash of clans') || n.includes('клеш оф клан') || n.includes('клэш оф клан'),
    (_n, s) => s.includes('clash of clans'),
  ]);
}

// ── Clash Royale ──────────────────────────────────────────────────
export const CLASH_ROYALE_TYPES = [
  'promotion', 'gems', 'account', 'boosting', 'promo_actions', 'other', 'services',
];
export const CLASH_ROYALE_LABELS = {
  promotion: 'Акции',
  gems: 'Гемы',
  account: 'Аккаунты',
  boosting: 'Буст',
  promo_actions: 'Промоакции',
  other: 'Другое',
  services: 'Услуги',
};
export function isClashRoyale(name, search = '') {
  return matchAny(name, search, [
    (n) => n === 'clash royale' || n === 'клеш рояль' || n === 'клэш рояль',
    (n) => n.includes('clash royale') || n.includes('клеш рояль') || n.includes('клэш рояль'),
    (_n, s) => s.includes('clash royale'),
  ]);
}

/** Ordered detectors → { types, labels }. First match wins. */
export const MOBILE_GAME_OVERRIDES = [
  { test: isCodMobile, types: COD_MOBILE_TYPES, labels: COD_MOBILE_LABELS },
  { test: isFcMobile, types: FC_MOBILE_TYPES, labels: FC_MOBILE_LABELS },
  { test: isStandoff2, types: STANDOFF2_TYPES, labels: STANDOFF2_LABELS },
  { test: isMobileLegends, types: MOBILE_LEGENDS_TYPES, labels: MOBILE_LEGENDS_LABELS },
  { test: isBrawlStars, types: BRAWL_STARS_TYPES, labels: BRAWL_STARS_LABELS },
  { test: isBlackRussia, types: BLACK_RUSSIA_TYPES, labels: BLACK_RUSSIA_LABELS },
  { test: isClashOfClans, types: CLASH_OF_CLANS_TYPES, labels: CLASH_OF_CLANS_LABELS },
  { test: isClashRoyale, types: CLASH_ROYALE_TYPES, labels: CLASH_ROYALE_LABELS },
];

export function resolveMobileGameOverride(itemName, itemSearch, raw) {
  for (const entry of MOBILE_GAME_OVERRIDES) {
    if (entry.test(itemName, itemSearch) || entry.test(raw, '')) {
      return entry;
    }
  }
  return null;
}
