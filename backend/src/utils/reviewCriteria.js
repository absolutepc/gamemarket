/** Allowed review criterion keys; selected count becomes rating 1–5 */
const REVIEW_CRITERIA = [
  { key: 'deal_speed', label: 'Скорость сделки' },
  { key: 'polite_seller', label: 'Вежливый продавец' },
  { key: 'fair_price', label: 'Хорошая цена' },
  { key: 'quality', label: 'Качество выполнения' },
  { key: 'as_described', label: 'Соответствие описанию' },
];

const ALLOWED_KEYS = new Set(REVIEW_CRITERIA.map((c) => c.key));

function normalizeCriteria(raw) {
  if (!Array.isArray(raw)) return null;
  const unique = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const key = item.trim();
    if (!ALLOWED_KEYS.has(key) || unique.includes(key)) continue;
    unique.push(key);
  }
  return unique;
}

function ratingFromCriteria(keys) {
  return Math.min(5, Math.max(0, keys.length));
}

module.exports = {
  REVIEW_CRITERIA,
  ALLOWED_KEYS,
  normalizeCriteria,
  ratingFromCriteria,
};
