/** PUBG Mobile (not PC PUBG / New State) */

export const PUBG_MOBILE_TYPES = [
  'uc',
  'metro_royale',
  'account',
  'promotion',
  'escort',
  'rental',
  'popularity',
  'other',
  'boosting',
  'services',
  'design',
];

export const PUBG_MOBILE_LABELS = {
  uc: 'UC',
  metro_royale: 'Metro Royale',
  account: 'Аккаунты',
  promotion: 'Акции',
  escort: 'Сопровождение',
  rental: 'Аренда',
  popularity: 'Популярность',
  other: 'Другое',
  boosting: 'Буст',
  services: 'Услуги',
  design: 'Дизайн',
};

export function isPubgMobile(name, search = '') {
  const n = String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  const s = String(search || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
  // Exclude PC PUBG and New State
  if (n.includes('new state') || s.includes('new state')) return false;
  if (n === 'pubg' || n.startsWith('pubg ')) return false;
  return (
    n === 'pubg mobile'
    || n.startsWith('pubg mobile')
    || n === 'pubgm'
    || n.includes('пабг мобайл')
    || n.includes('пабг мобил')
    || (s.includes('pubg mobile') && !s.includes('new state'))
  );
}
